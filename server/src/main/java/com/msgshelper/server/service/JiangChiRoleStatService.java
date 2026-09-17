package com.msgshelper.server.service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.msgshelper.server.common.BizException;
import com.msgshelper.server.dto.RoleStat;
import com.msgshelper.server.mapper.JiangChiRecordMapper;

/**
 * 身份（位置）胜率 —— 前端「身份 / 位置」选项后面那个百分比的数据源。
 *
 * <p><b>统计范围是一个将池</b>：分子分母都只在所选将池的记录里加 ——
 * 选项上那个数是「这个将池里这个身份打得怎么样」，同一将池下各武将的战绩合在一起看；
 * 换个将池就是另一套数。
 *
 * <p><b>分母的口径</b>（三种模式各一条，共同点是「分子都是该身份自己的胜场」）：
 * <ul>
 *   <li>局长 = 该将池、该模式里每局必然出现、且只出现一次的那个身份的胜场 + 败场
 *       （斗地主的地主 / 军争的主公 / 团战的一号位，见 {@link RoleCounter#perGame()}）；</li>
 *   <li>斗地主的农民<b>不</b>拿自己的总场数当分母 —— 一局两个农民，农民的总场是局数的两倍，
 *       拿它当分母，胜率会算成真实值的一半。<b>同一个模式下每个身份共用一个分母</b>，
 *       军争的忠臣 / 反贼 / 内奸、团战的二三四号位同理。</li>
 * </ul>
 */
@Service
public class JiangChiRoleStatService {

    private final JiangChiRecordMapper mapper;

    public JiangChiRoleStatService(JiangChiRecordMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * 某个将池下，各模式各身份的胜率。
     *
     * <p>顺序跟 {@link RoleCounter} 的枚举顺序一致（模式分组、组内按身份），
     * 前端直接按 (模式, 身份) 取值，不用关心顺序。
     *
     * @param pool 将池，取前端 POOLS 的 value
     * @throws BizException 将池为空 —— 口径就是「某个将池」，没有将池就无从统计，
     *                      宁可报错也不要悄悄回一份全库的数
     */
    public List<RoleStat> list(String pool) {
        if (!StringUtils.hasText(pool)) {
            throw new BizException("将池不能为空");
        }

        Map<String, Object> sums = mapper.sumCounters(pool.trim(), RoleCounter.columnPrefixes());

        // 分母一个模式算一次就够：它是「每局唯一身份」的总场，同模式的每个身份共用
        Map<String, Long> games = new HashMap<>();
        for (RoleCounter counter : RoleCounter.values()) {
            if (counter.perGame()) {
                games.put(counter.mode(), count(sums, counter, "win") + count(sums, counter, "lose"));
            }
        }

        return Arrays.stream(RoleCounter.values())
                .map(counter -> RoleStat.of(counter.mode(), counter.role(),
                        count(sums, counter, "win"), count(sums, counter, "lose"),
                        games.getOrDefault(counter.mode(), 0L)))
                .toList();
    }

    /**
     * 取汇总结果里的一格。
     *
     * <p>不认死类型：SUM 在 MySQL 里出来的是 DECIMAL（Java 侧 BigDecimal），
     * 被 COALESCE 兜成 0 时又可能是 Integer —— 一律按 Number 取长整型。
     */
    private static long count(Map<String, Object> sums, RoleCounter counter, String kind) {
        Object value = sums.get(counter.columnPrefix() + "_" + kind);
        return value instanceof Number number ? number.longValue() : 0L;
    }
}
