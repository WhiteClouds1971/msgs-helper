package com.msgshelper.server.dto;

/**
 * 一个身份（位置）的胜率 —— 前端「身份 / 位置」每个选项后面显示的那个百分比。
 *
 * <p>统计范围是<b>一个将池</b>（跨武将）：这个数是「这个将池里这个身份打得怎么样」，
 * 换个将池就是另一套数。将池本身不进参数 —— 一次请求就只算一个将池，
 * 前端按当前选中的那个来问（见 JiangChiRecordController#listRoleStats）。
 *
 * @param mode  模式，取前端 MODES 的 value：dou-di-zhu / jun-zheng / tuan-zhan
 * @param role  身份（斗地主、军争）或位置（团战），取前端各模式表单的 value
 * @param win   该身份的胜场合计
 * @param lose  该身份的败场合计
 * @param games 该将池下、该模式的总局数，也就是胜率的分母 —— 每局必然出现、且只出现一次的
 *              那个身份（斗地主的地主 / 军争的主公 / 团战的一号位）的胜场 + 败场。
 *              农民这类「一局有好几个」的身份不当分母；同一模式下每个身份拿到的是同一个数
 * @param rate  胜率（0~100，两位小数）= win / games；该模式一局都没打过时为 {@code null}，
 *              前端那一格留空（0 局没有胜率可言，写 0% 会像是「打了全输」）
 */
public record RoleStat(String mode, String role, long win, long lose, long games, Double rate) {

    /**
     * 由三个场数拼一条 —— 分母换算成胜率这一步收在这里，别处不用再关心「分母是哪个身份」。
     */
    public static RoleStat of(String mode, String role, long win, long lose, long games) {
        return new RoleStat(mode, role, win, lose, games, rate(win, games));
    }

    /** 胜率（0~100，两位小数）：与导出的 {@code JiangChiStatRow} 用同一套四舍五入 */
    private static Double rate(long win, long games) {
        if (games <= 0) {
            return null;
        }
        return Math.round(win * 10000.0 / games) / 100.0;
    }
}
