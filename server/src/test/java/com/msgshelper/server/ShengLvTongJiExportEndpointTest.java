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
import com.msgshelper.server.entity.ShengLvTongJiRecord;
import com.msgshelper.server.mapper.ShengLvTongJiRecordMapper;

/**
 * 走真实链路把导出接口跑一遍：HTTP → Controller → 查库 → 填模板 → 文件流。
 *
 * <p>要连着本地 MySQL（与 {@link MsgsHelperServerApplicationTests} 同一个前提，
 * 见 resources/application-dev.yml）。
 */
@SpringBootTest
@AutoConfigureMockMvc
class ShengLvTongJiExportEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ShengLvTongJiRecordMapper mapper;

    @Test
    @DisplayName("GET /sheng-lv-tong-ji/export 回的是一份能打开的 xlsx，每条记录一行")
    void exportsWorkbook() throws Exception {
        MvcResult result = mockMvc.perform(get("/sheng-lv-tong-ji/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotEmpty();

        // 导出与 service 用的是同一个排序，所以第 i 条数据就在第 i 行
        List<ShengLvTongJiRecord> records = mapper.selectList(Wrappers.<ShengLvTongJiRecord>lambdaQuery()
                .orderByAsc(ShengLvTongJiRecord::getPool)
                .orderByAsc(ShengLvTongJiRecord::getHero));

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(body))) {
            Sheet sheet = workbook.getSheetAt(0);

            // 表头没被数据顶掉：第一行说明、第二行表头
            assertThat(sheet.getRow(0).getCell(0).getStringCellValue()).startsWith("武将将池划分遵循以下原则");
            assertThat(sheet.getRow(1).getCell(0).getStringCellValue()).isEqualTo("武将");
            assertThat(sheet.getRow(1).getCell(1).getStringCellValue()).isEqualTo("将池");
            assertThat(sheet.getRow(1).getCell(2).getStringCellValue()).isEqualTo("最高胜率总场数");
            assertThat(sheet.getRow(1).getCell(3).getStringCellValue()).isEqualTo("胜率最高身份/位置");
            assertThat(sheet.getRow(1).getCell(36).getStringCellValue()).isEqualTo("四号位胜率");
            // 最后两列：是否在将池中 / 最后更新时间
            assertThat(sheet.getRow(1).getCell(37).getStringCellValue()).isEqualTo("是否在将池中");
            assertThat(sheet.getRow(1).getCell(38).getStringCellValue()).isEqualTo("最后更新时间");

            // 「是否在将池中」只照库里那条记录自己写：将池之间互不排斥，一个武将可以同时
            // 在好几个池子里，所以不再有「每个武将只能有一个是」这条不变量（逐行的比对见下）
            for (int i = 0; i < records.size(); i++) {
                Row row = sheet.getRow(2 + i);
                ShengLvTongJiRecord record = records.get(i);
                assertThat(row.getCell(0).getStringCellValue()).isEqualTo(record.getHero());
                // 「是否在将池中」在倒数第二列（38 是最后更新时间）
                assertThat(row.getCell(37).getStringCellValue())
                        .isEqualTo(Boolean.TRUE.equals(record.getInPool()) ? "是" : "否");
                assertThat(row.getCell(2).getNumericCellValue()).isGreaterThanOrEqualTo(0);
                // 库里的 updated_at 是 NOT NULL，导出的每一行这一列都不该是空的，
                // 且是「到分钟」的写法（不是 Excel 那串日期序列号）
                assertThat(row.getCell(38).getStringCellValue())
                        .matches("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}");
            }
        }
    }
}
