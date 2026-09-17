package com.msgshelper.server.service;

/**
 * 将池 → 中文名，导出报表里「将池」那一列写的就是它。
 *
 * <p>库里存的是稳定标识（{@code jiang-chi-1}），给人看的名字在别处 —— 前端
 * {@code src/pages/jiang-chi/Index.vue} 的 POOLS 常量。两边因此各有一份对照：
 * <b>改将池名要同时改这里和那里</b>。之所以不把中文名存进库，是因为它是展示口径，
 * 将来真把将池换成「标准 / 风 / 火…」时，只需要动这两处映射，历史数据一行都不用改。
 *
 * <p>前八个是占位名（将池1 ~ 将池8），往后接真实将池（王战2026），与前端同一套。
 * 顺序与前端 POOL_OPTIONS 一致 —— 前端那份是下拉的展示顺序，这里跟着排。
 */
public enum PoolCatalog {

    POOL_1("jiang-chi-1", "将池1"),
    POOL_2("jiang-chi-2", "将池2"),
    POOL_3("jiang-chi-3", "将池3"),
    POOL_4("jiang-chi-4", "将池4"),
    POOL_5("jiang-chi-5", "将池5"),
    POOL_6("jiang-chi-6", "将池6"),
    POOL_7("jiang-chi-7", "将池7"),
    POOL_8("jiang-chi-8", "将池8"),

    /** 王者之战（王战）2026 —— 赛事将池 */
    WANG_ZHAN_2026("wang-zhan-2026", "王战2026");

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
