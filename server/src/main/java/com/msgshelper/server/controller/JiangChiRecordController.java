package com.msgshelper.server.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.msgshelper.server.common.Result;
import com.msgshelper.server.dto.HeroStat;
import com.msgshelper.server.dto.JiangChiRecordRequest;
import com.msgshelper.server.dto.RoleStat;
import com.msgshelper.server.entity.JiangChiRecord;
import com.msgshelper.server.service.JiangChiExportService;
import com.msgshelper.server.service.JiangChiHeroStatService;
import com.msgshelper.server.service.JiangChiRecordService;
import com.msgshelper.server.service.JiangChiRoleStatService;

/** 将池战绩 —— 实际路径是 /api/jiang-chi/records（/api 来自 server.servlet.context-path） */
@RestController
@RequestMapping("/jiang-chi")
public class JiangChiRecordController {

    /** xlsx 的 MIME，Excel 与 WPS 都认这个 */
    private static final MediaType XLSX = MediaType
            .parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    /** 附件名里的时间戳：导两次不会互相覆盖，也一眼看得出是哪天导的 */
    private static final DateTimeFormatter FILE_STAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmm");

    private final JiangChiRecordService service;
    private final JiangChiExportService exportService;
    private final JiangChiRoleStatService roleStatService;
    private final JiangChiHeroStatService heroStatService;

    public JiangChiRecordController(JiangChiRecordService service,
                                    JiangChiExportService exportService,
                                    JiangChiRoleStatService roleStatService,
                                    JiangChiHeroStatService heroStatService) {
        this.service = service;
        this.exportService = exportService;
        this.roleStatService = roleStatService;
        this.heroStatService = heroStatService;
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
     * 撤回一局 —— 与 {@link #record} 反着走：把那一场的胜/败场 -1。
     *
     * <p>请求体与 {@code /records} 同形，但 role 与 result <b>必填</b>：撤回的是某一场对局，
     * 光有「武将 + 将池」减不掉任何东西（只登记归属的那种记录不进撤回列表）。
     *
     * <p>与新增一样不碰武将的将池归属 —— 见 {@link JiangChiRecordService#undo}。
     *
     * <p>返回这条记录的最新全貌（前端显示「3 胜 1 负」用）。
     */
    @PostMapping("/records/undo")
    public Result<JiangChiRecord> undo(@RequestBody JiangChiRecordRequest request) {
        return Result.ok(service.undo(request));
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

    /**
     * 某个将池下，各身份（位置）的胜率 —— 前端「身份 / 位置」每个选项后面那个百分比。
     *
     * <p>按将池汇总（不分武将），三个模式一次全给：条数是死的（模式 × 身份），
     * 前端切模式时不用再请求一次，切将池才要。
     *
     * <p>口径：该身份的胜场 ÷ 该身份自己的场数（胜 + 负），各身份各算各的 —— 见
     * {@link JiangChiRoleStatService}。
     *
     * @param pool 将池，取前端 POOLS 的 value —— 口径就是某个将池，不给（或给空）
     *             由 service 抛业务异常（不是 400/500：走统一响应体，前端照常弹那句文案）
     */
    @GetMapping("/role-stats")
    public Result<List<RoleStat>> listRoleStats(@RequestParam(required = false) String pool) {
        return Result.ok(roleStatService.list(pool));
    }

    /**
     * 某个将池 + 某个模式 + 某个身份（位置）下的武将胜率 —— 胜率榜页那张表。
     *
     * <p>口径：每个武将各算各的 —— 胜率 = 该武将在<b>这个身份</b>下的胜场 ÷ 它自己在这个身份下的
     * 场数（胜 + 败）。同一个武将的地主场次不会混进农民那档，别的武将、别的身份、别的将池也都
     * 不参与（见 {@link JiangChiHeroStatService}）。
     *
     * <p>范围内只留<b>现在还待在这个将池里</b>的武将：换过池子的武将在旧池子留下的是历史战绩。
     *
     * <p>三项都是必给：换将池换一套数据，换模式换一套身份，换身份换一套分子分母 ——
     * 少一个都答不出「这个身份下谁最能打」。缺项或模式 / 身份对不上号时，由 service 抛业务异常
     * （走统一响应体，前端照常弹那句文案）。
     *
     * @param pool  将池，取前端 POOLS 的 value
     * @param mode  模式：dou-di-zhu / jun-zheng / tuan-zhan
     * @param role  身份（斗地主、军争）或位置（团战），取前端各模式表单的 value
     * @param limit 最多回几条；不传（或给 0 / 负数）就把该身份下的武将<b>全部</b>回过来
     * @return 按胜率从高到低排好的武将战绩；一场没打的武将不在里面
     */
    @GetMapping("/hero-stats")
    public Result<List<HeroStat>> listHeroStats(@RequestParam(required = false) String pool,
                                                @RequestParam(required = false) String mode,
                                                @RequestParam(required = false) String role,
                                                @RequestParam(required = false) Integer limit) {
        return Result.ok(heroStatService.list(pool, mode, role, limit));
    }

    /**
     * 导出武将胜率统计 Excel（全量记录按模板填好）。
     *
     * <p>这条<b>不走 {@link Result} 统一响应体</b>：客户端要的是一个附件，不是 JSON。
     * 前端 {@code src/utils/request.js} 见响应体里没有 code 就原样交出，拿到的正是二进制流。
     * 出错时仍由 GlobalExceptionHandler 兜底（5xx + JSON），前端按「下载失败」提示。
     *
     * <p>文件名放响应头里（RFC 5987 的 {@code filename*}），前端也可以自己起名 ——
     * 它按 blob 取不到响应头，实际用的是自己那份名字。
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> export() {
        String filename = "武将胜率统计-" + LocalDateTime.now().format(FILE_STAMP) + ".xlsx";
        // 响应头只能是 ASCII：中文名百分号编码；filename 给不认识 filename* 的老客户端兜底
        String encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(XLSX)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + encoded + "\"; filename*=UTF-8''" + encoded)
                .body(exportService.export());
    }
}
