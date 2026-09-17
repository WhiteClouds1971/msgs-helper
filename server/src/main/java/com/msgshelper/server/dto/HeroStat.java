package com.msgshelper.server.dto;

/**
 * 一个武将在一个「将池 + 模式 + 身份（位置）」下的战绩 —— 胜率榜里的一行。
 *
 * <p>与 {@link RoleStat} 是同一套口径的两个方向：那边是「这个将池里这个身份打得怎么样」
 * （跨武将汇总），这边是「这个将池里这个身份下，某个武将打得怎么样」——分子分母都只数
 * 这一个武将身上这<b>一个身份</b>的胜败场，不借别的身份（如地主）的场数当分母。
 *
 * <p>场数与胜率都由 {@link #of} 一次算好，SQL 只负责把两个相加的数量回来 ——
 * 口径散在两地，将来一改就对不上。
 *
 * @param hero  武将
 * @param win   该武将在该身份下的胜场
 * @param lose  该武将在该身份下的败场
 * @param games 总场数 = 胜场 + 败场，也就是胜率的分母
 * @param rate  胜率（0~100，两位小数）= win / games；该武将在该身份下一场没打过时为
 *              {@code null}（0 场没有胜率可言，写 0% 会像是「打了全输」）
 */
public record HeroStat(String hero, long win, long lose, long games, Double rate) {

    /**
     * 由胜场与败场拼一条 —— 场数与胜率都在这儿一次算好，调用方只管把两个数喂进来。
     */
    public static HeroStat of(String hero, long win, long lose) {
        long games = win + lose;
        return new HeroStat(hero, win, lose, games, rate(win, games));
    }

    /** 胜率（0~100，两位小数）：与 {@link RoleStat}、导出的 JiangChiStatRow 同一套四舍五入 */
    private static Double rate(long win, long games) {
        if (games <= 0) {
            return null;
        }
        return Math.round(win * 10000.0 / games) / 100.0;
    }
}
