package com.msgshelper.server.service;

import com.msgshelper.server.common.BizException;

/**
 * 「模式 + 身份/位置」→ 表里那一对胜/败场列 的对照表。
 *
 * <p>role 的取值就是前端各模式表单里的 value（见 src/pages/jiang-chi/components/*.vue），
 * 三套身份/位置互不重复，所以 (mode, role) 能唯一定到一组列。
 *
 * <p><b>这里的 columnPrefix 会拼进 SQL</b>（见 JiangChiRecordMapper#increaseCounter），
 * 所以列名只认本枚举，绝不接受请求里的任意字符串。
 */
public enum RoleCounter {

    /** 斗地主 · 地主 */
    LANDLORD("dou-di-zhu", "landlord", "landlord"),
    /** 斗地主 · 农民 */
    FARMER("dou-di-zhu", "farmer", "farmer"),

    /** 军争 · 主公 */
    LORD("jun-zheng", "lord", "lord"),
    /** 军争 · 忠臣 */
    LOYALIST("jun-zheng", "loyalist", "loyalist"),
    /** 军争 · 反贼 */
    REBEL("jun-zheng", "rebel", "rebel"),
    /** 军争 · 内奸 */
    TRAITOR("jun-zheng", "traitor", "traitor"),

    /** 团战 · 一号位 */
    SEAT1("tuan-zhan", "1", "seat1"),
    /** 团战 · 二号位 */
    SEAT2("tuan-zhan", "2", "seat2"),
    /** 团战 · 三号位 */
    SEAT3("tuan-zhan", "3", "seat3"),
    /** 团战 · 四号位 */
    SEAT4("tuan-zhan", "4", "seat4");

    private final String mode;
    private final String role;
    private final String columnPrefix;

    RoleCounter(String mode, String role, String columnPrefix) {
        this.mode = mode;
        this.role = role;
        this.columnPrefix = columnPrefix;
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
}
