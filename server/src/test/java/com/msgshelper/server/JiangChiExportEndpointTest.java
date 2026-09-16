package com.msgshelper.server;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.ByteArrayInputStream;
import java.util.List;

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
            assertThat(sheet.getRow(1).getCell(2).getStringCellValue()).isEqualTo("最高胜率总场数");
            assertThat(sheet.getRow(1).getCell(36).getStringCellValue()).isEqualTo("四号位胜率");

            for (int i = 0; i < records.size(); i++) {
                Row row = sheet.getRow(2 + i);
                assertThat(row.getCell(0).getStringCellValue()).isEqualTo(records.get(i).getHero());
                assertThat(row.getCell(2).getNumericCellValue()).isGreaterThanOrEqualTo(0);
            }
        }
    }
}
