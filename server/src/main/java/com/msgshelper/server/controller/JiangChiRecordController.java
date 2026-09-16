package com.msgshelper.server.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.msgshelper.server.common.Result;
import com.msgshelper.server.dto.JiangChiRecordRequest;
import com.msgshelper.server.entity.JiangChiRecord;
import com.msgshelper.server.service.JiangChiRecordService;

/** 将池战绩 —— 实际路径是 /api/jiang-chi/records（/api 来自 server.servlet.context-path） */
@RestController
@RequestMapping("/jiang-chi")
public class JiangChiRecordController {

    private final JiangChiRecordService service;

    public JiangChiRecordController(JiangChiRecordService service) {
        this.service = service;
    }

    /**
     * 记一局，或只登记武将所属将池。
     *
     * <p>请求体 {@code { mode, pool, hero, role?, result? }}：
     * 带 role + result → 对应身份（位置）的胜场或败场 +1；
     * 不带 → 只登记并刷新 (将池, 武将) 这条的更新日期，胜败场不动。
     *
     * <p>返回这条记录的最新全貌（前端想显示「3 胜 1 负」就不用再查一次）。
     */
    @PostMapping("/records")
    public Result<JiangChiRecord> record(@RequestBody JiangChiRecordRequest request) {
        return Result.ok(service.record(request));
    }

    /**
     * 武将名单 —— 前端搜索框的候选来源。
     *
     * <p>内容是记录表里出现过的武将名去重（最近用过的排前面），没有单独的武将主数据表：
     * 前端搜不到也能手填新武将（SearchSelect 的 allowCustom），记下第一局后它就在名单里了。
     */
    @GetMapping("/heroes")
    public Result<List<String>> listHeroes() {
        return Result.ok(service.listHeroes());
    }
}
