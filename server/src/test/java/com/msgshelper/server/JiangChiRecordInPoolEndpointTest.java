package com.msgshelper.server;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.msgshelper.server.entity.JiangChiRecord;
import com.msgshelper.server.mapper.JiangChiRecordMapper;

/**
 * 走真实链路记一局 / 只登记将池：HTTP → Controller → Service → 库。
 *
 * <p>验的是「是否还在将池中」这一列怎么被维护：本次记的那个将池标成「是」，
 * 该武将在别的将池下的记录全部清成「否」，两边的战绩各归各的。
 *
 * <p>整个类<b>带着事务跑</b>：造出来的武将随回滚一起消失，不会脏了本地那份开发数据
 * （这是唯一会写库的将池测试，其余几个都是只读的）。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class JiangChiRecordInPoolEndpointTest {

    /** 造出来的武将名 —— 库里本来不会有，跑完随事务回滚 */
    private static final String HERO = "单测武将-是否在将池";

    /** 老将池：先待在这儿 */
    private static final String OLD_POOL = "jiang-chi-4";

    /** 新将池：记一局 / 登记到这儿，标记就该跟着挪过来 */
    private static final String NEW_POOL = "jiang-chi-7";

    /** 给老记录按回去的时间戳：清理标记时若把 updated_at 也刷了，断言就会红 */
    private static final LocalDateTime BACKDATED = LocalDateTime.of(2020, 1, 2, 3, 4, 5);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JiangChiRecordMapper mapper;

    @Test
    @DisplayName("记一局：本次的将池标成「是」，别的将池清成「否」，老记录的最后更新时间不动")
    void marksThePoolOfThisGame() throws Exception {
        seedOldPool();

        record("""
                {"mode":"dou-di-zhu","pool":"%s","hero":"%s","role":"landlord","result":"win"}
                """.formatted(NEW_POOL, HERO));

        assertThat(inPool(NEW_POOL)).isTrue();
        assertThat(inPool(OLD_POOL)).isFalse();
        // 这一局记在哪个将池就加在哪个将池上
        assertThat(recordOf(NEW_POOL).getLandlordWin()).isEqualTo(1);
        // 老记录的时间戳没被这次清理带跑 —— updated_at 带 ON UPDATE CURRENT_TIMESTAMP，
        // 不显式赋一次的话它会跟着被刷成现在，「最后更新时间」就全成了「换将池的那天」
        assertThat(recordOf(OLD_POOL).getUpdatedAt()).isEqualTo(BACKDATED);
    }

    @Test
    @DisplayName("只登记将池（不填身份与对局）：照样换标记，两边的战绩一个数都不动")
    void registeringPoolOnlyAlsoMovesTheFlag() throws Exception {
        seedOldPool();
        record("""
                {"mode":"dou-di-zhu","pool":"%s","hero":"%s","role":"landlord","result":"win"}
                """.formatted(NEW_POOL, HERO));
        int winsBefore = recordOf(NEW_POOL).getLandlordWin();

        // 这就是页面上那句「只输入武将 + 将池，可以修改该武将所在的将池」
        record("""
                {"mode":"dou-di-zhu","pool":"%s","hero":"%s"}
                """.formatted(OLD_POOL, HERO));

        assertThat(inPool(OLD_POOL)).isTrue();
        assertThat(inPool(NEW_POOL)).isFalse();
        // 换将池不是搬记录：老将池的战绩原样留着，一个数都没动
        assertThat(recordOf(NEW_POOL).getLandlordWin()).isEqualTo(winsBefore);
        assertThat(recordOf(NEW_POOL).getLandlordLose()).isZero();
    }

    /** 先让这个武将在老将池下有一条记录，并把标记点在那儿、时间戳按回 {@link #BACKDATED} */
    private void seedOldPool() {
        mapper.ensureExists(OLD_POOL, HERO);
        mapper.markInPool(OLD_POOL, HERO);

        JiangChiRecord backdated = new JiangChiRecord();
        backdated.setId(recordOf(OLD_POOL).getId());
        backdated.setUpdatedAt(BACKDATED);
        mapper.updateById(backdated);
    }

    /** 发一条记录请求；请求体直接给 JSON 字面量，免得为一个 DTO 引 Jackson 序列化 */
    private void record(String body) throws Exception {
        mockMvc.perform(post("/jiang-chi/records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    private JiangChiRecord recordOf(String pool) {
        return mapper.selectOne(new LambdaQueryWrapper<JiangChiRecord>()
                .eq(JiangChiRecord::getPool, pool)
                .eq(JiangChiRecord::getHero, HERO));
    }

    /** 这个将池下那条记录是不是标着「还在将池中」 */
    private boolean inPool(String pool) {
        return Boolean.TRUE.equals(recordOf(pool).getInPool());
    }
}
