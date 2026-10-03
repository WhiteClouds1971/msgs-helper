package com.msgshelper.server.service;

/**
 * 将池 → 中文名，导出报表里「将池」那一列写的就是它。
 *
 * <p>库里存的是稳定标识（{@code dou-di-zhu-1}），给人看的名字在别处 —— 前端
 * {@code src/pages/sheng-lv-tong-ji/modes.js} 的 POOL_OPTIONS 常量。两边因此各有一份对照：
 * <b>改将池名要同时改这里和那里</b>。之所以不把中文名存进库，是因为它是展示口径，
 * 将来再换一套将池划分时，只需要动这两处映射，历史数据一行都不用改。
 *
 * <p>按玩法分三个系列、各四个：斗地主1 ~ 4、身份1 ~ 4、排位1 ~ 4，与前端同一套。
 * 顺序与前端 POOL_OPTIONS 一致 —— 前端那份是下拉的展示顺序，这里跟着排。
 *
 * <p>上一版那八个占位池（{@code jiang-chi-1 ~ 8}）已作废、不再登记。库里可能还挂着
 * 它们的旧战绩：{@link #labelOf} 对不上号就原样返回，报表里「将池」一列会把标识
 * 照抄出去 —— 这是只读口径下的有意为之（不抛异常，也不去动历史数据）。
 */
public enum PoolCatalog {

    /** 斗地主 —— 玩法专属将池 */
    DOU_DI_ZHU_1("dou-di-zhu-1", "斗地主1"),
    DOU_DI_ZHU_2("dou-di-zhu-2", "斗地主2"),
    DOU_DI_ZHU_3("dou-di-zhu-3", "斗地主3"),
    DOU_DI_ZHU_4("dou-di-zhu-4", "斗地主4"),

    /** 身份 —— 玩法专属将池 */
    SHEN_FEN_1("shen-fen-1", "身份1"),
    SHEN_FEN_2("shen-fen-2", "身份2"),
    SHEN_FEN_3("shen-fen-3", "身份3"),
    SHEN_FEN_4("shen-fen-4", "身份4"),

    /** 排位 —— 玩法专属将池 */
    PAI_WEI_1("pai-wei-1", "排位1"),
    PAI_WEI_2("pai-wei-2", "排位2"),
    PAI_WEI_3("pai-wei-3", "排位3"),
    PAI_WEI_4("pai-wei-4", "排位4");

    private final String value;
    private final String label;

    PoolCatalog(String value, String label) {
        this.value = value;
        this.label = label;
    }

    /**
     * 将池的中文名。
     *
     * <p>对不上号的原样返回 —— 导出是只读的，遇到没登记的值宁可把标识照抄出去，
     * 也不要抛异常把整份报表带崩。
     */
    public static String labelOf(String pool) {
        for (PoolCatalog item : values()) {
            if (item.value.equals(pool)) {
                return item.label;
            }
        }
        return pool;
    }
}
