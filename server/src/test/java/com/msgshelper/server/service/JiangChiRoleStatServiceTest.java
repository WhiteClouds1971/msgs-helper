package com.msgshelper.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.msgshelper.server.common.BizException;
import com.msgshelper.server.dto.RoleStat;
import com.msgshelper.server.mapper.JiangChiRecordMapper;

/**
 * 身份（位置）胜率：统计范围是一个将池，分子取该身份自己的胜场，
 * 分母取该将池下「每局唯一身份」（地主 / 主公 / 一号位）的局长。
 *
 * <p>不起数据库：汇总 SQL 的结果由 mock 直接喂进来（那句 SQL 本身由
 * {@link com.msgshelper.server.JiangChiRoleStatEndpointTest} 走真实链路验）。
 */
class JiangChiRoleStatServiceTest {

    /** 测试用的将池 —— 值本身不参与算法，只验它原样传给了汇总 SQL */
    private static final String POOL = "jiang-chi-1";

    private final JiangChiRecordMapper mapper = mock(JiangChiRecordMapper.class);
    private final JiangChiRoleStatService service = new JiangChiRoleStatService(mapper);

    @Test
    @DisplayName("斗地主：农民拿地主的局长当分母，不是农民自己的总场（一局两个农民，总场是局数的两倍）")
    void farmerUsesLandlordTotalAsDenominator() {
        // 这个将池打了 12 局：地主 7 胜 5 负。每局两个农民，所以农民一栏记的是 10 胜 14 负
        List<RoleStat> stats = statsOf(
                "landlord_win", new BigDecimal("7"), "landlord_lose", new BigDecimal("5"),
                "farmer_win", new BigDecimal("10"), "farmer_lose", new BigDecimal("14"));

        RoleStat landlord = stat(stats, "dou-di-zhu", "landlord");
        assertThat(landlord.games()).isEqualTo(12);
        assertThat(landlord.rate()).isEqualTo(58.33);

        // 农民 10 胜，但分母是 12 局 → 83.33%；要是拿农民自己的 24 场当分母就成了 41.67%
        RoleStat farmer = stat(stats, "dou-di-zhu", "farmer");
        assertThat(farmer.win()).isEqualTo(10);
        assertThat(farmer.lose()).isEqualTo(14);
        assertThat(farmer.games()).isEqualTo(12);
        assertThat(farmer.rate()).isEqualTo(83.33);
    }

    @Test
    @DisplayName("军争：分母是主公的局长，忠臣 / 反贼 / 内奸共用它")
    void junZhengRolesShareLordTotal() {
        List<RoleStat> stats = statsOf(
                "lord_win", 40L, "lord_lose", 60L,                 // 100 局
                "loyalist_win", 50L, "loyalist_lose", 30L,
                "rebel_win", 60L, "rebel_lose", 20L,
                "traitor_win", 0L, "traitor_lose", 0L);            // 没打过内奸

        assertThat(stat(stats, "jun-zheng", "lord").games()).isEqualTo(100);
        assertThat(stat(stats, "jun-zheng", "loyalist").rate()).isEqualTo(50.0);
        assertThat(stat(stats, "jun-zheng", "rebel").rate()).isEqualTo(60.0);
        // 一局没打是 0% 而不是没有胜率：分母还在（总有人当主公），只是这个身份没赢过
        assertThat(stat(stats, "jun-zheng", "traitor").rate()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("团战：分母是一号位的局长，二三四号位共用它")
    void tuanZhanRolesShareSeat1Total() {
        List<RoleStat> stats = statsOf(
                "seat1_win", 3L, "seat1_lose", 1L,                 // 4 局
                "seat2_win", 2L, "seat2_lose", 2L,
                "seat3_win", 1L, "seat3_lose", 3L,
                "seat4_win", 4L, "seat4_lose", 0L);

        // role 是前端表单里的 value（一号位是 "1"，不是列前缀 seat1）
        assertThat(stat(stats, "tuan-zhan", "1").rate()).isEqualTo(75.0);
        assertThat(stat(stats, "tuan-zhan", "2").rate()).isEqualTo(50.0);
        assertThat(stat(stats, "tuan-zhan", "3").rate()).isEqualTo(25.0);
        assertThat(stat(stats, "tuan-zhan", "4").rate()).isEqualTo(100.0);
        stats.stream()
                .filter(item -> item.mode().equals("tuan-zhan"))
                .forEach(item -> assertThat(item.games()).isEqualTo(4));
    }

    @Test
    @DisplayName("这个将池一条记录都没有：局长为 0，胜率留空（不是 0%）")
    void emptyPoolMeansNoRate() {
        List<RoleStat> stats = statsOf();

        assertThat(stats).hasSize(RoleCounter.values().length);
        stats.forEach(item -> {
            assertThat(item.games()).isZero();
            assertThat(item.rate()).isNull();
        });
    }

    @Test
    @DisplayName("汇总值不认死类型：BigDecimal（SUM）与 Integer（COALESCE 兜的 0）都能读")
    void readsAnyNumberType() {
        List<RoleStat> stats = statsOf(
                "landlord_win", new BigDecimal("7"), "landlord_lose", 5,   // 一个 DECIMAL 一个 Integer
                "farmer_win", 3, "farmer_lose", 1);

        assertThat(stat(stats, "dou-di-zhu", "landlord").games()).isEqualTo(12);
        assertThat(stat(stats, "dou-di-zhu", "farmer").rate()).isEqualTo(25.0);
    }

    @Test
    @DisplayName("将池原样交给汇总 SQL，列名由 RoleCounter 全量给出（加新身份不用改 SQL）")
    void passesPoolAndEveryRoleColumn() {
        statsOf();

        verify(mapper).sumCounters(POOL, RoleCounter.columnPrefixes());
    }

    @Test
    @DisplayName("不给将池就报错：口径就是某个将池，不能悄悄回一份全库的数")
    void poolIsRequired() {
        assertThatThrownBy(() -> service.list(null))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("将池");
        assertThatThrownBy(() -> service.list("   "))
                .isInstanceOf(BizException.class);
    }

    /** 喂一份汇总结果，按给定将池跑一遍 service */
    private List<RoleStat> statsOf(Object... pairs) {
        when(mapper.sumCounters(any(), any())).thenReturn(sums(pairs));
        return service.list(POOL);
    }

    /** 拼一份 {@code <前缀>_win / <前缀>_lose → 值} 的汇总结果 */
    private static Map<String, Object> sums(Object... pairs) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < pairs.length; i += 2) {
            map.put((String) pairs[i], pairs[i + 1]);
        }
        return map;
    }

    /** 从结果里按 (模式, 身份) 取那一条 */
    private static RoleStat stat(List<RoleStat> stats, String mode, String role) {
        return stats.stream()
                .filter(stat -> stat.mode().equals(mode) && stat.role().equals(role))
                .findFirst()
                .orElseThrow(() -> new AssertionError("没有这个身份：" + mode + " / " + role));
    }
}
