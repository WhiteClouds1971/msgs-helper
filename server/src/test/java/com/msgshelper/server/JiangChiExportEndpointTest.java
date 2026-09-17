package com.msgshelper.server;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.ByteArrayInputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.msgshelper.server.entity.JiangChiRecord;
import com.msgshelper.server.mapper.JiangChiRecordMapper;

/**
 * 走真实链路把导出接口跑一遍：HTTP → Controller → 查库 → 填模板 → 文件流。
 *
 * <p>要连着本地 MySQL（与 {@link MsgsHelperServerApplicationTests} 同一个前提，
 * 见 resources/application-dev.yml）。
 */
@SpringBootTest
@AutoConfigureMockMvc
class JiangChiExportEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JiangChiRecordMapper mapper;

    @Test
    @DisplayName("GET /jiang-chi/export 回的是一份能打开的 xlsx，每条记录一行")
    void exportsWorkbook() throws Exception {
        MvcResult result = mockMvc.perform(get("/jiang-chi/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotEmpty();

        // 导出与 service 用的是同一个排序，所以第 i 条数据就在第 i 行
        List<JiangChiRecord> records = mapper.selectList(Wrappers.<JiangChiRecord>lambdaQuery()
                .orderByAsc(JiangChiRecord::getPool)
                .orderByAsc(JiangChiRecord::getHero));

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(body))) {
            Sheet sheet = workbook.getSheetAt(0);

            // 表头没被数据顶掉：第一行说明、第二行表头
            assertThat(sheet.getRow(0).getCell(0).getStringCellValue()).startsWith("若最高胜率总场数");
            assertThat(sheet.getRow(1).getCell(0).getStringCellValue()).isEqualTo("武将");
            assertThat(sheet.getRow(1).getCell(1).getStringCellValue()).isEqualTo("将池");
            assertThat(sheet.getRow(1).getCell(2).getStringCellValue()).isEqualTo("是否在将池中");
            assertThat(sheet.getRow(1).getCell(3).getStringCellValue()).isEqualTo("最高胜率总场数");
            assertThat(sheet.getRow(1).getCell(37).getStringCellValue()).isEqualTo("四号位胜率");
            assertThat(sheet.getRow(1).getCell(38).getStringCellValue()).isEqualTo("最后更新时间");

            // 「是否在将池中」这一列每个武将只能有一个「是」—— 它标的是武将现在待在哪个池子里
            Map<String, Integer> inPoolCount = new HashMap<>();

            for (int i = 0; i < records.size(); i++) {
                Row row = sheet.getRow(2 + i);
                JiangChiRecord record = records.get(i);
                assertThat(row.getCell(0).getStringCellValue()).isEqualTo(record.getHero());
                assertThat(row.getCell(2).getStringCellValue())
                        .isEqualTo(Boolean.TRUE.equals(record.getInPool()) ? "是" : "否");
                assertThat(row.getCell(3).getNumericCellValue()).isGreaterThanOrEqualTo(0);
                // 库里的 updated_at 是 NOT NULL，导出的每一行这一列都不该是空的，
                // 且是「到分钟」的写法（不是 Excel 那串日期序列号）
                assertThat(row.getCell(38).getStringCellValue())
                        .matches("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}");

                if ("是".equals(row.getCell(2).getStringCellValue())) {
                    inPoolCount.merge(record.getHero(), 1, Integer::sum);
                }
            }

            assertThat(inPoolCount.values()).isNotEmpty().allMatch(count -> count == 1);
        }
    }
}
