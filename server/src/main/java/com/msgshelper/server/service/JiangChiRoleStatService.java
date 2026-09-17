package com.msgshelper.server.service;

import java.util.Arrays;
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
 * <p><b>口径就一条</b>：该身份的胜场 ÷ 该身份自己的场数（胜场 + 败场）。
 * 每个身份各算各的，谁也不借谁的场数当分母 —— 斗地主的农民不拿地主的场数除，
 * 军争的忠臣 / 反贼 / 内奸、团战的二三四号位同理。
 *
 * <p>该身份在这个将池下<b>一场没打</b>（场数为 0）时没有胜率可言，{@link RoleStat#rate()} 给 null，
 * 前端那一格留空（写 0% 会像是「打了全输」）。
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

        return Arrays.stream(RoleCounter.values())
                .map(counter -> RoleStat.of(counter.mode(), counter.role(),
                        count(sums, counter, "win"), count(sums, counter, "lose")))
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
