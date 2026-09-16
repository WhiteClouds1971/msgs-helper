package com.msgshelper.server.controller;

import java.time.OffsetDateTime;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.msgshelper.server.common.Result;

/**
 * 连通性探针 —— 前端联调时用来确认「Vite 代理 → 后端 → 统一响应体拆包」整条链路是通的。
 *
 * <p>实际路径是 /api/ping（/api 来自 application.yml 的 server.servlet.context-path）。
 */
@RestController
public class PingController {

    @GetMapping("/ping")
    public Result<Map<String, Object>> ping() {
        return Result.ok(Map.of(
                "service", "msgs-helper-server",
                "time", OffsetDateTime.now().toString()));
    }
}
