package com.msgshelper.server.common;

/**
 * 统一响应体 —— 所有接口一律返回它，前端 src/utils/request.js 按同一约定拆包。
 *
 * <p>code 为 0 表示成功，非 0 表示失败；HTTP 状态码与业务结果分开看：
 * 业务失败仍是 200（靠 code 区分），只有服务端真出了异常才是 5xx。
 *
 * @param code    0 = 成功，其余为失败码
 * @param message 给人看的提示，前端出错时直接弹它
 * @param data    业务数据，失败时为 null
 */
public record Result<T>(int code, String message, T data) {

    /** 成功 */
    public static final int CODE_SUCCESS = 0;

    /** 服务端异常 */
    public static final int CODE_ERROR = 500;

    /** 成功，无数据 */
    public static <T> Result<T> ok() {
        return new Result<>(CODE_SUCCESS, "ok", null);
    }

    /** 成功，带数据 */
    public static <T> Result<T> ok(T data) {
        return new Result<>(CODE_SUCCESS, "ok", data);
    }

    /** 失败 */
    public static <T> Result<T> fail(int code, String message) {
        return new Result<>(code, message, null);
    }
}
