package com.msgshelper.server.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.msgshelper.server.common.BizException;
import com.msgshelper.server.dto.HeroStat;
import com.msgshelper.server.mapper.JiangChiRecordMapper;

/**
 * 武将胜率 —— 「某个将池 + 某个模式 + 某个身份（位置）下，各武将打得怎么样」。
 *
 * <p>口径就一条：每个武将各算各的 —— 胜率 = 该武将在<b>这个身份</b>下的胜场 ÷
 * 它自己在这个身份下的场数（胜 + 败）。同一个武将的地主场次不会混进农民那档，
 * 别的武将、别的身份、别的将池的场次也都不参与。
 *
 * <p>三个条件一个都不能少：换将池换一套数据，换模式换一套身份，换身份换一套分子分母 ——
 * 少一个都答不出「这个身份下谁最能打」这个问题。
 *
 * <p>范围内<b>只留现在还待在这个将池里的武将</b>（{@code in_pool = 1}，见
 * {@link JiangChiRecordMapper#heroStats}）：换过池子的武将在旧池子里留下的是历史战绩，
 * 不该拿来和新池子的现任比。
 *
 * <p>排序与截断都在 SQL 里：胜率高的在前，场数多的次之；一场没打的武将不进来
 * （0 场没有胜率可言）。默认<b>不截断</b> —— 口径已被将池与身份框住，条数最多就是该将池的武将数。
 */
@Service
public class JiangChiHeroStatService {

    private final JiangChiRecordMapper mapper;

    public JiangChiHeroStatService(JiangChiRecordMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * 某个将池 + 某个身份（位置）下的武将战绩，按胜率从高到低。
     *
     * @param pool  将池，取前端 POOLS 的 value
     * @param mode  模式：dou-di-zhu / jun-zheng / tuan-zhan
     * @param role  身份（斗地主、军争）或位置（团战），取前端各模式表单的 value
     * @param limit 最多回几条；<b>null（或给 0 / 负数）= 全都回</b> —— 前端要的就是「这个身份下的
     *              全部武将」，条数本来就少；真要前 N 名时再传个正数进来
     * @throws BizException 三项里缺了哪一项（口径缺一不可），或模式与身份对不上号
     *                      （由 {@link RoleCounter#of} 判）
     */
    public List<HeroStat> list(String pool, String mode, String role, Integer limit) {
        if (!StringUtils.hasText(pool)) {
            throw new BizException("将池不能为空");
        }
        if (!StringUtils.hasText(mode)) {
            throw new BizException("模式不能为空");
        }
        if (!StringUtils.hasText(role)) {
            throw new BizException("身份（位置）不能为空");
        }

        RoleCounter counter = RoleCounter.of(mode, role);

        // 不传或给了非正数 = 不截断：SQL 那边靠 <if> 决定要不要拼 LIMIT，
        // 拿不到 null 就不会收到 0 / 负数这种怪值
        Integer size = limit != null && limit > 0 ? limit : null;

        return mapper.heroStats(pool.trim(),
                        counter.columnOf("win"), counter.columnOf("lose"), size)
                .stream()
                .map(row -> HeroStat.of(text(row.get("hero")),
                        count(row, "win_count"), count(row, "lose_count")))
                .toList();
    }

    /**
     * 取汇总结果里的一格。
     *
     * <p>不认死类型：SUM 在 MySQL 里出来的是 DECIMAL（Java 侧 BigDecimal），
     * 被 COALESCE 兜成 0 时又可能是 Integer —— 一律按 Number 取长整型。
     */
    private static long count(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value instanceof Number number ? number.longValue() : 0L;
    }

    /** 武将名：列上 NOT NULL，只有手搓的结果集才会是 null */
    private static String text(Object value) {
        return value == null ? "" : value.toString();
    }
}
