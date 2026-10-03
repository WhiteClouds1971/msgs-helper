package com.msgshelper.server;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.msgshelper.server.entity.ShengLvTongJiRecord;
import com.msgshelper.server.mapper.ShengLvTongJiRecordMapper;

/**
 * 走真实链路把武将移出将池：HTTP → Controller → Service → 库。
 *
 * <p>验三件事：这条的「在池」置成否；战绩与「最后更新时间」一个字段都不动
 * （时间戳带 ON UPDATE，碰它一下就会刷成现在）；同一武将在别的将池里照旧在池。
 *
 * <p>整个类<b>带着事务跑</b>：造出来的武将随回滚一起消失，不会脏了本地那份开发数据。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ShengLvTongJiOutOfPoolEndpointTest {

    /** 造出来的武将名 —— 库里本来不会有，跑完随事务回滚 */
    private static final String HERO = "单测武将-移出将池";

    /** 要摘出去的那个将池 */
    private static final String POOL = "dou-di-zhu-1";

    /** 同一武将待着的另一个将池：摘一个不该动它 */
    private static final String OTHER_POOL = "pai-wei-2";

    /** 给记录按回去的时间戳：摘出池时若把 updated_at 也刷了，断言就会红 */
    private static final LocalDateTime BACKDATED = LocalDateTime.of(2020, 1, 2, 3, 4, 5);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ShengLvTongJiRecordMapper mapper;

    @Test
    @DisplayName("移出将池：这一条置「否」，战绩与最后更新时间一个字段都不动")
    void takesTheHeroOutOfThePool() throws Exception {
        seedInPool(POOL);

        JsonNode data = outOfPool(POOL).path("data");

        assertThat(recordOf(POOL).getInPool()).isFalse();
        // 摘的是归属不是记录：战绩原样留着，导出报表里还看得到它
        assertThat(recordOf(POOL).getLandlordWin()).isEqualTo(1);
        // 时间戳没被这次摘出带跑 —— updated_at 带 ON UPDATE CURRENT_TIMESTAMP，
        // 不显式压一次的话，「最后更新时间」会变成「摘出去的那天」
        assertThat(recordOf(POOL).getUpdatedAt()).isEqualTo(BACKDATED);
        // 回给前端的就是这条记录的最新全貌
        assertThat(data.path("hero").asText()).isEqualTo(HERO);
        assertThat(data.path("inPool").asBoolean()).isFalse();
    }

    @Test
    @DisplayName("只动这一个池子：同一武将在别的将池里照旧在池")
    void leavesOtherPoolsAlone() throws Exception {
        seedInPool(POOL);
        seedInPool(OTHER_POOL);

        outOfPool(POOL);

        assertThat(recordOf(POOL).getInPool()).isFalse();
        assertThat(recordOf(OTHER_POOL).getInPool()).isTrue();
    }

    @Test
    @DisplayName("本来就不在池：走统一响应体的业务失败（HTTP 200 + code != 0），不是 500")
    void alreadyOutOfPoolIsABusinessFailure() throws Exception {
        // 有这条记录，但没点亮（in_pool 列默认 0）
        mapper.ensureExists(POOL, HERO);

        JsonNode body = outOfPool(POOL);

        assertThat(body.path("code").asInt()).isNotZero();
        assertThat(body.path("message").asText()).contains("本来就不在");
        assertThat(recordOf(POOL).getInPool()).isFalse();
    }

    @Test
    @DisplayName("不给将池 / 不给武将：都是走统一响应体的业务失败，且不写库")
    void poolAndHeroAreRequired() throws Exception {
        assertThat(outOfPool("", HERO).path("message").asText()).contains("将池");
        assertThat(outOfPool(POOL, "").path("message").asText()).contains("武将");
    }

    /** (将池, 武将) 那条：建起来、点亮、记 1 胜，再把时间戳按回 {@link #BACKDATED} */
    private void seedInPool(String pool) {
        mapper.ensureExists(pool, HERO);
        mapper.markInPool(pool, HERO);
        mapper.increaseCounter(pool, HERO, "landlord_win");

        ShengLvTongJiRecord backdated = new ShengLvTongJiRecord();
        backdated.setId(recordOf(pool).getId());
        backdated.setUpdatedAt(BACKDATED);
        mapper.updateById(backdated);
    }

    private JsonNode outOfPool(String pool) throws Exception {
        return outOfPool(pool, HERO);
    }

    /** 发一条移出请求；请求体直接给 JSON 字面量，免得为一个 DTO 引 Jackson 序列化 */
    private JsonNode outOfPool(String pool, String hero) throws Exception {
        MvcResult result = mockMvc.perform(post("/sheng-lv-tong-ji/records/out-of-pool")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"pool":"%s","hero":"%s"}
                                """.formatted(pool, hero)))
                .andExpect(status().isOk())
                .andReturn();

        // getContentAsString() 不给编码时按 ISO-8859-1 解，中文会变乱码 —— 必须点名 UTF-8
        return new ObjectMapper()
                .readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private ShengLvTongJiRecord recordOf(String pool) {
        return mapper.selectOne(new LambdaQueryWrapper<ShengLvTongJiRecord>()
                .eq(ShengLvTongJiRecord::getPool, pool)
                .eq(ShengLvTongJiRecord::getHero, HERO));
    }
}
