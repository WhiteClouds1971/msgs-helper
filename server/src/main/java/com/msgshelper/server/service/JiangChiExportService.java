package com.msgshelper.server.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.ExcelWriter;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.msgshelper.server.entity.JiangChiRecord;
import com.msgshelper.server.mapper.JiangChiRecordMapper;

/**
 * 武将胜率统计 Excel 导出 —— 把记录表全量填进 resources/template 下的模板。
 *
 * <p>用 EasyExcel 的「模板填充」而不是自己拼表头：样式（表头底色、边框、列宽、第一行的
 * 升降级规则说明）都留在模板里，改版式不用碰 Java。
 *
 * <p><b>模板与数据的约定</b>：模板第一行是规则说明（合并单元格），第二行是表头，
 * 第三行是<b>列表行</b> —— 里面全是 {@code {.字段}} 形式（列表占位符，点号开头）的占位符，
 * EasyExcel 照着这一行的样式按数据条数往下复制。字段名见 {@link JiangChiStatRow#toMap()}，
 * 加一列 = 模板加一个占位符 + 那边多 put 一个 key，两边必须同时改。
 */
@Service
public class JiangChiExportService {

    /** 模板路径（classpath，中文名照抄）；包内可见是给单测读占位符用的 */
    static final String TEMPLATE = "template/武将胜率统计模版.xlsx";

    private final JiangChiRecordMapper mapper;

    public JiangChiExportService(JiangChiRecordMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * 导出全量武将胜率统计。
     *
     * <p>不加筛选：模板里「将池」本身就是一列，一个武将在一个将池下是一条记录，
     * 整张表正好是一份完整报表。顺序按将池、武将排，同一份数据每次导出的行序都一样。
     */
    public byte[] export() {
        List<JiangChiRecord> records = mapper.selectList(Wrappers.<JiangChiRecord>lambdaQuery()
                .orderByAsc(JiangChiRecord::getPool)
                .orderByAsc(JiangChiRecord::getHero));
        List<Map<String, Object>> rows = records.stream()
                .map(record -> new JiangChiStatRow(record).toMap())
                .toList();
        return fillTemplate(rows);
    }

    /**
     * 把行数据填进模板，返回整个 xlsx 的字节（直接当响应体回给前端）。
     *
     * <p>包内可见是为了单测：喂几行假数据就能跑通「模板 + 填充」这一段，不用起数据库。
     * 空列表也能跑：EasyExcel 会把占位符抹掉，出去的就是一份只有说明与表头的空报表。
     */
    byte[] fillTemplate(List<Map<String, Object>> rows) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (InputStream template = new ClassPathResource(TEMPLATE).getInputStream();
             ExcelWriter writer = EasyExcel.write(out).withTemplate(template).build()) {
            writer.fill(rows, EasyExcel.writerSheet().build());
        } catch (IOException e) {
            // 模板跟着 jar 走，读不到基本是打包时漏了 resources/template —— 属于部署事故，别吞
            throw new UncheckedIOException("读取 Excel 模板失败：" + TEMPLATE, e);
        }
        return out.toByteArray();
    }
}
