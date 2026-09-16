package com.msgshelper.server.service;

import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;

import com.msgshelper.server.entity.JiangChiRecord;

/**
 * 导出报表的一行 —— 记录表的一行，加上按身份（位置）算出来的胜率与几项汇总。
 *
 * <p>给 {@link JiangChiExportService} 填 Excel 模板用，{@link #toMap()} 的 key 与模板第三行
 * 的占位符（{@code {.hero}}、{@code {.landlordWin}} …）一一对应，改字段名两边都要改。
 *
 * <p>三条算法规矩（模板第一行那句升降级规则就靠它们）：
 * <ul>
 *   <li><b>胜率</b> = 胜场 /（胜场 + 败场），按百分比存成 0~100 的数，保留两位小数；</li>
 *   <li><b>最高胜率总场数</b> = 胜率最高那一档自己的场数（胜场 + 败场），
 *       与「胜率最高身份/位置」「身份/位置最高胜率」两列配成一组：这一档的胜率是在多少场里打出来的。
 *       <b>不是</b>所有身份加起来的局数 —— 三个模式的身份混在一起求和，凑出来的数跟哪一档的胜率都对不上，
 *       也撑不起升降级规则里「够不够份量」这个门槛。一场没打时为 0；</li>
 *   <li><b>最后更新时间</b>取记录的 {@code updated_at}，写成 {@code yyyy-MM-dd HH:mm} 的文本
 *       （按下「新增」记一局、或改所属将池都会刷新它）—— 精确到分钟就够用，
 *       秒既没人看又要撑宽一列；写成文本是为了不看模板格子的格式脸色，导出即所见；</li>
 *   <li><b>胜率最高 / 最低身份</b>只在<b>打过</b>的身份里挑：0 场的身份没有胜率，
 *       要是让它算 0% 参赛，任何一个只打过一种身份的武将都会凭空多出一个「0% 的最低身份」，
 *       降级规则（最低胜率 &lt; 40 就降）就废了。撞上并列时取 {@link RoleCounter} 顺序靠前的那个，
 *       同一份数据每次导出结果都一样。</li>
 * </ul>
 */
public final class JiangChiStatRow {

    /** 「最后更新时间」一列在报表里的写法：见类注释 */
    private static final DateTimeFormatter UPDATED_AT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final JiangChiRecord record;

    /** 各身份（位置）的胜场 */
    private final Map<RoleCounter, Integer> wins = new EnumMap<>(RoleCounter.class);
    /** 各身份（位置）的败场 */
    private final Map<RoleCounter, Integer> loses = new EnumMap<>(RoleCounter.class);
    /** 各身份（位置）的胜率；null = 这一档一场没打，报表里留空 */
    private final Map<RoleCounter, Double> rates = new EnumMap<>(RoleCounter.class);

    /** 最高胜率总场数：胜率最高那一档的场数；一场没打时为 0 */
    private final int bestRoleTotal;

    /** 打过的身份里胜率最高 / 最低的那个；一场没打时两者都是 null */
    private final RoleCounter best;
    private final Double bestRate;
    private final RoleCounter worst;
    private final Double worstRate;

    public JiangChiStatRow(JiangChiRecord record) {
        this.record = record;

        RoleCounter top = null;
        RoleCounter bottom = null;
        double topRate = 0;
        double bottomRate = 0;
        int topPlayed = 0;

        for (RoleCounter counter : RoleCounter.values()) {
            int win = counter.win(record);
            int lose = counter.lose(record);
            int times = win + lose;

            wins.put(counter, win);
            loses.put(counter, lose);

            if (times == 0) {
                rates.put(counter, null);
                continue;
            }

            double rate = rate(win, times);
            rates.put(counter, rate);
            // 严格大于 / 小于：并列时先来的那个不被顶掉，于是留下的就是顺序靠前的身份
            if (top == null || rate > topRate) {
                top = counter;
                topRate = rate;
                topPlayed = times;
            }
            if (bottom == null || rate < bottomRate) {
                bottom = counter;
                bottomRate = rate;
            }
        }

        this.bestRoleTotal = topPlayed;
        this.best = top;
        this.bestRate = top == null ? null : topRate;
        this.worst = bottom;
        this.worstRate = bottom == null ? null : bottomRate;
    }

    /**
     * 摊平成一行数据 —— EasyExcel 按 key 找模板里的 {@code {.key}}。
     *
     * <p>每个身份的三个 key 一个都不能少：EasyExcel 填列表时，是「碰到一个占位符就往下错一行」，
     * 少给一个 key 会让这一列的行号与其它列错开。没打过就放 null，那一格自然是空的。
     */
    public Map<String, Object> toMap() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("hero", record.getHero());
        row.put("pool", PoolCatalog.labelOf(record.getPool()));
        row.put("bestRoleTotal", bestRoleTotal);
        row.put("bestRole", best == null ? null : best.label());
        row.put("bestRate", bestRate);
        row.put("worstRole", worst == null ? null : worst.label());
        row.put("worstRate", worstRate);
        for (RoleCounter counter : RoleCounter.values()) {
            String prefix = counter.columnPrefix();
            row.put(prefix + "Win", wins.get(counter));
            row.put(prefix + "Lose", loses.get(counter));
            row.put(prefix + "Rate", rates.get(counter));
        }
        // 排在最后，与模板里这一列的位置一致（updated_at 库里有 NOT NULL 兜底，
        // 只有「还没落库的新对象」才会是 null，那一格留空）
        row.put("updatedAt", record.getUpdatedAt() == null ? null : UPDATED_AT.format(record.getUpdatedAt()));
        return row;
    }

    /** 胜率（0~100，两位小数）：四舍五入到百分位，免得报表里冒出 66.66666666666667 */
    private static double rate(int win, int played) {
        return Math.round(win * 10000.0 / played) / 100.0;
    }
}
