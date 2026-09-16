package com.msgshelper.server.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * 兜底异常处理 —— 让异常也走统一响应体，前端不用为「接口挂了」单独写一套分支。
 *
 * <p>堆栈只进日志，不回给前端：对外只给一句能看懂的话。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 业务校验不通过 —— 通道是好的，是数据不合规矩。
     * 仍回 HTTP 200，让前端统一按 code 判成败（见 src/utils/request.js）。
     */
    @ExceptionHandler(BizException.class)
    public Result<Void> handleBiz(BizException e) {
        log.warn("业务校验不通过: {}", e.getMessage());
        return Result.fail(e.getCode(), e.getMessage());
    }

    /** 路径没匹配上任何接口 —— 这是客户端的错，别一律报成 500 */
    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Result<Void> handleNotFound(NoResourceFoundException e) {
        return Result.fail(HttpStatus.NOT_FOUND.value(), "接口不存在");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handle(Exception e) {
        log.error("未处理的异常", e);
        return Result.fail(Result.CODE_ERROR, "服务器开小差了，请稍后再试");
    }
}
