package com.msgshelper.server.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.msgshelper.server.entity.JiangChiRecord;

/** 导出报表每一行的算法：最高胜率总场数、各身份胜率、胜率最高 / 最低身份 */
class JiangChiStatRowTest {

    @Test
    @DisplayName("将池写成中文名；没登记过的将池原样带出去")
    void poolLabel() {
        assertThat(row(newRecord("关羽", "jiang-chi-3")).get("pool")).isEqualTo("将池3");
        assertThat(row(newRecord("关羽", "wang-zhan-2026")).get("pool")).isEqualTo("王战2026");
        assertThat(row(newRecord("关羽", "jiang-chi-x")).get("pool")).isEqualTo("jiang-chi-x");
    }

    @Test
    @DisplayName("最高胜率总场数 = 胜率最高那一档自己的场数，不是所有身份加起来")
    void bestRoleTotalCountsOnlyTheTopRole() {
        JiangChiRecord record = newRecord("关羽", "jiang-chi-1");
        record.setLandlordWin(3);               // 地主 3 胜 0 负 → 100%，这一档 3 场
        record.setFarmerWin(1);
        record.setFarmerLose(1);                // 农民 1 胜 1 负 → 50%，这一档 2 场
        record.setLordWin(2);
        record.setLordLose(2);                  // 主公 2 胜 2 负 → 50%，这一档 4 场

        Map<String, Object> row = row(record);
        assertThat(row.get("bestRole")).isEqualTo("地主");
        assertThat(row.get("bestRate")).isEqualTo(100.0);
        // 全部加起来是 9 场，但跟「地主 100%」这一组配对的只有地主自己的 3 场
        assertThat(row.get("bestRoleTotal")).isEqualTo(3);
    }

    @Test
    @DisplayName("最高胜率总场数跟着胜率走，不跟着场次多走")
    void bestRoleTotalFollowsRateNotVolume() {
        JiangChiRecord record = newRecord("关羽", "jiang-chi-1");
        record.setLandlordWin(5);
        record.setLandlordLose(5);              // 地主 10 场、50%
        record.setFarmerWin(2);                 // 农民 2 场、100%

        Map<String, Object> row = row(record);
        assertThat(row.get("bestRole")).isEqualTo("农民");
        assertThat(row.get("bestRoleTotal")).isEqualTo(2);
    }

    @Test
    @DisplayName("胜率 = 胜场 /（胜场 + 败场），保留两位小数")
    void rateIsWinOverPlayed() {
        JiangChiRecord record = newRecord("关羽", "jiang-chi-1");
        record.setLandlordWin(2);
        record.setLandlordLose(1);

        Map<String, Object> row = row(record);
        assertThat(row.get("landlordRate")).isEqualTo(66.67);
        assertThat(row.get("landlordWin")).isEqualTo(2);
        assertThat(row.get("landlordLose")).isEqualTo(1);
        assertThat(row.get("bestRoleTotal")).isEqualTo(3);
    }

    @Test
    @DisplayName("只打过一种身份时：它既是最高也是最低")
    void bestAndWorstWithOneRole() {
        JiangChiRecord record = newRecord("关羽", "jiang-chi-1");
        record.setLandlordWin(2);

        Map<String, Object> row = row(record);
        assertThat(row.get("bestRole")).isEqualTo("地主");
        assertThat(row.get("bestRate")).isEqualTo(100.0);
        assertThat(row.get("worstRole")).isEqualTo("地主");
        assertThat(row.get("worstRate")).isEqualTo(100.0);
    }

    @Test
    @DisplayName("没打过的身份不参与最高 / 最低，胜率一格留空")
    void unplayedRolesStayOut() {
        JiangChiRecord record = newRecord("关羽", "jiang-chi-1");
        record.setLandlordWin(1);
        record.setLandlordLose(1);
        record.setFarmerLose(2);

        Map<String, Object> row = row(record);
        assertThat(row.get("bestRole")).isEqualTo("地主");
        assertThat(row.get("bestRate")).isEqualTo(50.0);
        assertThat(row.get("bestRoleTotal")).isEqualTo(2);
        assertThat(row.get("worstRole")).isEqualTo("农民");
        assertThat(row.get("worstRate")).isEqualTo(0.0);
        // 军争 / 团战那几档一场没打：场次是 0，胜率留空（不是 0）
        assertThat(row.get("lordWin")).isEqualTo(0);
        assertThat(row.get("lordRate")).isNull();
    }

    @Test
    @DisplayName("一场没打：最高胜率总场数为 0，最高 / 最低身份与胜率都留空")
    void nothingPlayed() {
        Map<String, Object> row = row(newRecord("关羽", "jiang-chi-1"));
        assertThat(row.get("bestRoleTotal")).isEqualTo(0);
        assertThat(row.get("bestRole")).isNull();
        assertThat(row.get("bestRate")).isNull();
        assertThat(row.get("worstRole")).isNull();
        assertThat(row.get("worstRate")).isNull();
    }

    @Test
    @DisplayName("是否在将池中：在池写「是」，历史将池写「否」")
    void inPoolIsWrittenAsYesOrNo() {
        JiangChiRecord record = newRecord("关羽", "jiang-chi-1");
        // 列是 NOT NULL DEFAULT 0：还没落库的对象（null）按 0 算，与库里默认值一致
        assertThat(row(record).get("inPool")).isEqualTo("否");

        record.setInPool(true);
        assertThat(row(record).get("inPool")).isEqualTo("是");

        record.setInPool(false);
        assertThat(row(record).get("inPool")).isEqualTo("否");
    }

    @Test
    @DisplayName("最后更新时间：写成 yyyy-MM-dd HH:mm，没更新过就留空")
    void updatedAtIsFormattedToMinute() {
        JiangChiRecord record = newRecord("关羽", "jiang-chi-1");
        record.setUpdatedAt(LocalDateTime.of(2026, 9, 16, 17, 13, 45));

        // 秒不进报表：一局打完记的是日期与分钟，秒既没人看又白占一列宽度
        assertThat(row(record).get("updatedAt")).isEqualTo("2026-09-16 17:13");
        assertThat(row(newRecord("关羽", "jiang-chi-1")).get("updatedAt")).isNull();
    }

    @Test
    @DisplayName("胜率并列：取 RoleCounter 顺序靠前的那个（每次导出结果一致）")
    void tieKeepsTheEarlierRole() {
        JiangChiRecord record = newRecord("关羽", "jiang-chi-1");
        record.setLandlordWin(1);
        record.setLandlordLose(1);
        record.setFarmerWin(3);
        record.setFarmerLose(3);

        Map<String, Object> row = row(record);
        assertThat(row.get("bestRole")).isEqualTo("地主");
        assertThat(row.get("worstRole")).isEqualTo("地主");
        // 并列认了地主，场数也取地主那一档
        assertThat(row.get("bestRoleTotal")).isEqualTo(2);
    }

    /** 只填用得上的那几档，其余字段留 null —— RoleCounter 按 0 算（列本身 NOT NULL） */
    private static JiangChiRecord newRecord(String hero, String pool) {
        JiangChiRecord record = new JiangChiRecord();
        record.setHero(hero);
        record.setPool(pool);
        return record;
    }

    private static Map<String, Object> row(JiangChiRecord record) {
        return new JiangChiStatRow(record).toMap();
    }
}
