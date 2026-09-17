package com.msgshelper.server.service;

import java.util.Arrays;
import java.util.List;
import java.util.function.Function;

import com.msgshelper.server.common.BizException;
import com.msgshelper.server.entity.JiangChiRecord;

/**
 * 「模式 + 身份/位置」→ 表里那一对胜/败场列 的对照表。
 *
 * <p>role 的取值就是前端各模式表单里的 value（见 src/pages/jiang-chi/components/*.vue），
 * 三套身份/位置互不重复，所以 (mode, role) 能唯一定到一组列。
 *
 * <p><b>这里的 columnPrefix 会拼进 SQL</b>（见 JiangChiRecordMapper#increaseCounter），
 * 所以列名只认本枚举，绝不接受请求里的任意字符串。
 *
 * <p>同一个 columnPrefix 还兼当导出报表的字段前缀（{@code {.xxxWin}} / {@code {.xxxLose}} /
 * {@code {.xxxRate}}，见 {@link JiangChiStatRow}）—— 报表的一列本来就是这个身份的一档战绩，
 * 再立一套对照只会多一处要同步的地方。
 *
 * <p>枚举顺序 = 报表里的列顺序 = 「胜率最高/最低」撞上并列时认谁：新增身份一律往后加，
 * 别插在中间（插在中间会改掉并列时的取舍，也会让已有导出对不上）。
 */
public enum RoleCounter {

    /** 斗地主 · 地主 */
    LANDLORD("dou-di-zhu", "landlord", "landlord", "地主",
            JiangChiRecord::getLandlordWin, JiangChiRecord::getLandlordLose),
    /** 斗地主 · 农民 */
    FARMER("dou-di-zhu", "farmer", "farmer", "农民",
            JiangChiRecord::getFarmerWin, JiangChiRecord::getFarmerLose),

    /** 军争 · 主公 */
    LORD("jun-zheng", "lord", "lord", "主公",
            JiangChiRecord::getLordWin, JiangChiRecord::getLordLose),
    /** 军争 · 忠臣 */
    LOYALIST("jun-zheng", "loyalist", "loyalist", "忠臣",
            JiangChiRecord::getLoyalistWin, JiangChiRecord::getLoyalistLose),
    /** 军争 · 反贼 */
    REBEL("jun-zheng", "rebel", "rebel", "反贼",
            JiangChiRecord::getRebelWin, JiangChiRecord::getRebelLose),
    /** 军争 · 内奸 */
    TRAITOR("jun-zheng", "traitor", "traitor", "内奸",
            JiangChiRecord::getTraitorWin, JiangChiRecord::getTraitorLose),

    /** 团战 · 一号位 */
    SEAT1("tuan-zhan", "1", "seat1", "一号位",
            JiangChiRecord::getSeat1Win, JiangChiRecord::getSeat1Lose),
    /** 团战 · 二号位 */
    SEAT2("tuan-zhan", "2", "seat2", "二号位",
            JiangChiRecord::getSeat2Win, JiangChiRecord::getSeat2Lose),
    /** 团战 · 三号位 */
    SEAT3("tuan-zhan", "3", "seat3", "三号位",
            JiangChiRecord::getSeat3Win, JiangChiRecord::getSeat3Lose),
    /** 团战 · 四号位 */
    SEAT4("tuan-zhan", "4", "seat4", "四号位",
            JiangChiRecord::getSeat4Win, JiangChiRecord::getSeat4Lose);

    private final String mode;
    private final String role;
    private final String columnPrefix;
    private final String label;
    private final Function<JiangChiRecord, Integer> winGetter;
    private final Function<JiangChiRecord, Integer> loseGetter;

    RoleCounter(String mode, String role, String columnPrefix, String label,
                Function<JiangChiRecord, Integer> winGetter,
                Function<JiangChiRecord, Integer> loseGetter) {
        this.mode = mode;
        this.role = role;
        this.columnPrefix = columnPrefix;
        this.label = label;
        this.winGetter = winGetter;
        this.loseGetter = loseGetter;
    }

    /**
     * 按模式 + 身份（位置）取对照项。
     *
     * @throws BizException 组合不合法（比如军争配上了「地主」）
     */
    public static RoleCounter of(String mode, String role) {
        for (RoleCounter counter : values()) {
            if (counter.mode.equals(mode) && counter.role.equals(role)) {
                return counter;
            }
        }
        throw new BizException("模式 " + mode + " 下没有这个身份（位置）：" + role);
    }

    /**
     * 胜场 / 败场 的列名。
     *
     * @param result 对局结果，只认 win / lose
     * @throws BizException 结果值不认识
     */
    public String columnOf(String result) {
        return switch (result) {
            case "win" -> columnPrefix + "_win";
            case "lose" -> columnPrefix + "_lose";
            default -> throw new BizException("对局结果只能是 win 或 lose：" + result);
        };
    }

    /** 报表用的字段前缀，也是 {@link #columnOf} 拼列名用的那一段 */
    public String columnPrefix() {
        return columnPrefix;
    }

    /**
     * 所有身份的列前缀（按枚举顺序）。
     *
     * <p>给汇总接口拼列名用（见 {@link com.msgshelper.server.mapper.JiangChiRecordMapper#sumCounters}）——
     * 加了新身份，那边不用跟着改一行。
     */
    public static List<String> columnPrefixes() {
        return Arrays.stream(values()).map(RoleCounter::columnPrefix).toList();
    }

    /** 所属模式，取前端 MODES 的 value */
    public String mode() {
        return mode;
    }

    /** 身份（位置），取前端各模式表单的 value */
    public String role() {
        return role;
    }

    /** 身份（位置）的中文名 —— 报表里「胜率最高/最低身份」写的就是它 */
    public String label() {
        return label;
    }

    /** 该身份（位置）的胜场；列上为 null 按 0 算（列本身 NOT NULL，只有手搓的实体才会是 null） */
    public int win(JiangChiRecord record) {
        return orZero(winGetter.apply(record));
    }

    /** 该身份（位置）的败场，同上 */
    public int lose(JiangChiRecord record) {
        return orZero(loseGetter.apply(record));
    }

    private static int orZero(Integer value) {
        return value == null ? 0 : value;
    }
}
