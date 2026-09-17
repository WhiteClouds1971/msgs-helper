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
 * @param games 该身份的场数 = 胜场 + 败场，也就是胜率的分母。每个身份各算各的，
 *              不借别的身份（如地主）的场数
 * @param rate  胜率（0~100，两位小数）= win / games；该身份在这个将池下一场没打时为
 *              {@code null}，前端那一格留空（0 场没有胜率可言，写 0% 会像是「打了全输」）
 */
public record RoleStat(String mode, String role, long win, long lose, long games, Double rate) {

    /**
     * 由胜场与败场拼一条 —— 场数与胜率都在这儿一次算好，调用方只管把两个数喂进来。
     */
    public static RoleStat of(String mode, String role, long win, long lose) {
        long games = win + lose;
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
