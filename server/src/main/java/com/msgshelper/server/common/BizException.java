package com.msgshelper.server.common;

/**
 * 业务校验不通过 —— 请求本身是通的，是数据不合业务规矩。
 *
 * <p>回给前端的仍是 HTTP 200，靠 {@link Result} 里的 code 区分（见 GlobalExceptionHandler）。
 */
public class BizException extends RuntimeException {

    private final int code;

    public BizException(String message) {
        this(Result.CODE_BAD_REQUEST, message);
    }

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
