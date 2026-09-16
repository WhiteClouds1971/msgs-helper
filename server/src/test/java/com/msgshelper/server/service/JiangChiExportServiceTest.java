package com.msgshelper.server.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import com.msgshelper.server.entity.JiangChiRecord;

/** 模板填充：数据有没有落到对的行、对列，样式与表头有没有被冲掉 */
class JiangChiExportServiceTest {

    /** 列表占位符 {.字段名} */
    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\.([A-Za-z0-9]+)}");

    /** 模板一共 37 列：7 个汇总列 + 10 个身份（位置）× 胜场 / 败场 / 胜率 */
    private static final int COLUMNS = 37;

    /** 只测「模板 + 填充」这一段，用不着数据库，mapper 传 null */
    private final JiangChiExportService service = new JiangChiExportService(null);

    @Test
    @DisplayName("按模板填出一份报表：说明与表头原样，数据从第三行往下长")
    void fillsTemplateFromThirdRow() throws Exception {
        JiangChiRecord guanyu = newRecord("关羽", "jiang-chi-1");
        guanyu.setLandlordWin(1);
        guanyu.setLandlordLose(1);      // 地主 1 胜 1 负 → 50%，这一档 2 场（全场最高）
        guanyu.setFarmerLose(2);        // 农民 0 胜 2 负 → 0%

        byte[] xlsx = service.fillTemplate(List.of(
                new JiangChiStatRow(guanyu).toMap(),
                new JiangChiStatRow(newRecord("张飞", "jiang-chi-2")).toMap()));

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(xlsx))) {
            Sheet sheet = workbook.getSheetAt(0);

            // 模板原有的两行没被动过：第一行升降级规则说明、第二行表头
            assertThat(text(sheet, 0, 0)).startsWith("若最高胜率总场数");
            assertThat(text(sheet, 1, 0)).isEqualTo("武将");
            assertThat(text(sheet, 1, 2)).isEqualTo("最高胜率总场数");
            assertThat(text(sheet, 1, COLUMNS - 1)).isEqualTo("四号位胜率");

            // 第一条数据落在模板的第三行（列表行）
            assertThat(text(sheet, 2, 0)).isEqualTo("关羽");
            assertThat(text(sheet, 2, 1)).isEqualTo("将池1");
            // 最高胜率总场数 = 胜率最高那一档（地主）自己的 1 + 1 场，不是全部加起来
            assertThat(number(sheet, 2, 2)).isEqualTo(2);
            assertThat(text(sheet, 2, 3)).isEqualTo("地主");
            assertThat(number(sheet, 2, 4)).isEqualTo(50);
            assertThat(text(sheet, 2, 5)).isEqualTo("农民");
            assertThat(number(sheet, 2, 6)).isEqualTo(0);
            assertThat(number(sheet, 2, 7)).isEqualTo(1);
            assertThat(number(sheet, 2, 8)).isEqualTo(1);
            assertThat(number(sheet, 2, 9)).isEqualTo(50);
            assertThat(number(sheet, 2, 10)).isEqualTo(0);
            assertThat(number(sheet, 2, 12)).isEqualTo(0);

            // 第二条接着往下长
            assertThat(text(sheet, 3, 0)).isEqualTo("张飞");
            assertThat(number(sheet, 3, 2)).isEqualTo(0);
            // 一场没打的档留的是空格子，不是 0
            assertThat(sheet.getRow(3).getCell(4).getCellType()).isEqualTo(CellType.BLANK);
            // 样式跟着模板那一行走：边框还在
            assertThat(sheet.getRow(3).getCell(0).getCellStyle().getBorderTop())
                    .isEqualTo(BorderStyle.THIN);

            // 表头下面就该只有这两行，没有多出来的空行
            assertThat(sheet.getLastRowNum()).isEqualTo(3);
        }
    }

    @Test
    @DisplayName("模板第三行的占位符，行数据里一个都不缺、一个都不多")
    void templateAndRowKeysMatch() throws Exception {
        Map<String, Object> row = new JiangChiStatRow(newRecord("关羽", "jiang-chi-1")).toMap();

        int checked = 0;
        Matcher matcher = PLACEHOLDER.matcher(templatePlaceholders());
        while (matcher.find()) {
            // 少一个 key，EasyExcel 那一列就会比别的列少错一行 —— 必须对得上
            assertThat(row).containsKey(matcher.group(1));
            checked++;
        }

        assertThat(checked).isEqualTo(COLUMNS);
        assertThat(row).hasSize(COLUMNS);
    }

    @Test
    @DisplayName("一条记录都没有：照样出一份只有说明与表头的报表，占位符不留痕")
    void emptyTableStillProducesWorkbook() throws Exception {
        byte[] xlsx = service.fillTemplate(List.of());

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(xlsx))) {
            Sheet sheet = workbook.getSheetAt(0);
            assertThat(text(sheet, 1, 0)).isEqualTo("武将");
            // 占位符已被抹掉，不会以 {.hero} 的样子留在表里
            for (int i = 0; i < COLUMNS; i++) {
                if (sheet.getRow(2) != null && sheet.getRow(2).getCell(i) != null
                        && sheet.getRow(2).getCell(i).getCellType() == CellType.STRING) {
                    assertThat(sheet.getRow(2).getCell(i).getStringCellValue()).doesNotContain("{.");
                }
            }
        }
    }

    /** 模板第三行（列表行）所有格子拼起来的文字 */
    private static String templatePlaceholders() throws Exception {
        try (InputStream template = new ClassPathResource(JiangChiExportService.TEMPLATE).getInputStream();
             Workbook workbook = WorkbookFactory.create(template)) {
            Row row = workbook.getSheetAt(0).getRow(2);
            StringBuilder text = new StringBuilder();
            for (int i = 0; i < row.getLastCellNum(); i++) {
                text.append(row.getCell(i).getStringCellValue());
            }
            return text.toString();
        }
    }

    private static String text(Sheet sheet, int rowIndex, int columnIndex) {
        return sheet.getRow(rowIndex).getCell(columnIndex).getStringCellValue();
    }

    private static double number(Sheet sheet, int rowIndex, int columnIndex) {
        return sheet.getRow(rowIndex).getCell(columnIndex).getNumericCellValue();
    }

    private static JiangChiRecord newRecord(String hero, String pool) {
        JiangChiRecord record = new JiangChiRecord();
        record.setHero(hero);
        record.setPool(pool);
        return record;
    }
}
