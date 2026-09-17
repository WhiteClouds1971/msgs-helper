package com.msgshelper.server;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.msgshelper.server.entity.JiangChiRecord;
import com.msgshelper.server.mapper.JiangChiRecordMapper;
import com.msgshelper.server.service.RoleCounter;

/**
 * 走真实链路把「身份（位置）胜率」接口跑一遍：HTTP → Controller → 汇总 SQL → JSON。
 *
 * <p>期望值在 Java 里把记录表整个拉下来、<b>按将池分别</b>加一遍 —— 与 SQL 那句 SUM
 * 是两条互不相干的路，于是这条测试既验接口形状，也验那句动态拼列名的 SQL
 * 加的确实是每一列自己的数，且确实只算了问的那个将池。
 *
 * <p>要连着本地 MySQL（与 {@link MsgsHelperServerApplicationTests} 同一个前提，
 * 见 resources/application-dev.yml）。
 */
@SpringBootTest
@AutoConfigureMockMvc
class JiangChiRoleStatEndpointTest {

    /** 胜率保留两位小数（与导出报表同一套四舍五入） */
    private static final double RATE_SCALE = 10000.0;

    /** 库里不会有这个将池：一条记录都没有时将池也得能问，只是胜率全空 */
    private static final String UNKNOWN_POOL = "jiang-chi-not-exist";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JiangChiRecordMapper mapper;

    @Test
    @DisplayName("GET /jiang-chi/role-stats?pool=… 只算这个将池，分母是该将池该模式「每局唯一身份」的局长")
    void listsRoleRatesOfPool() throws Exception {
        Map<String, Map<RoleCounter, long[]>> expected = sumByHandByPool();
        assertThat(expected).isNotEmpty();

        for (Map.Entry<String, Map<RoleCounter, long[]>> entry : expected.entrySet()) {
            assertPool(entry.getKey(), entry.getValue());
        }
        // 空将池：条数照旧（模式 × 身份），只是局长为 0、胜率留空
        assertPool(UNKNOWN_POOL, emptySums());
    }

    @Test
    @DisplayName("不给将池：走统一响应体的业务失败（HTTP 200 + code != 0），不是 500")
    void poolIsRequired() throws Exception {
        MvcResult result = mockMvc.perform(get("/jiang-chi/role-stats"))
                .andExpect(status().isOk())
                .andReturn();

        // getContentAsString() 不给编码时按 ISO-8859-1 解，中文会变乱码 —— 必须点名 UTF-8
        JsonNode body = new ObjectMapper()
                .readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(body.path("code").asInt()).isNotZero();
        assertThat(body.path("message").asText()).contains("将池");
    }

    /** 一个将池的整份结果：逐条比对场数与胜率 */
    private void assertPool(String pool, Map<RoleCounter, long[]> expected) throws Exception {
        JsonNode data = fetch(pool);
        assertThat(data.isArray()).isTrue();
        // 模式 × 身份 一条不少，也不重复
        assertThat(data.size()).isEqualTo(RoleCounter.values().length);

        Set<String> seen = new HashSet<>();
        for (JsonNode node : data) {
            String mode = node.path("mode").asText();
            String role = node.path("role").asText();
            assertThat(seen.add(mode + "/" + role)).isTrue();

            RoleCounter counter = RoleCounter.of(mode, role);
            long win = expected.get(counter)[0];
            long lose = expected.get(counter)[1];
            long games = gamesOf(expected, mode);

            assertThat(node.path("win").asLong()).isEqualTo(win);
            assertThat(node.path("lose").asLong()).isEqualTo(lose);
            assertThat(node.path("games").asLong()).isEqualTo(games);

            JsonNode rate = node.path("rate");
            if (games == 0) {
                // 一局没打过：没有胜率可言，给 null（写 0% 会像是「打了全输」）
                assertThat(rate.isNull()).isTrue();
            } else {
                assertThat(rate.asDouble())
                        .isEqualTo(Math.round(win * RATE_SCALE / games) / 100.0);
            }
        }
    }

    private JsonNode fetch(String pool) throws Exception {
        MvcResult result = mockMvc.perform(get("/jiang-chi/role-stats").param("pool", pool))
                .andExpect(status().isOk())
                .andReturn();
        return new ObjectMapper()
                .readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .path("data");
    }

    /** 某将池下某模式打了多少局 = 该将池里「每局必然出现、且只出现一次」那个身份的胜场 + 败场 */
    private static long gamesOf(Map<RoleCounter, long[]> expected, String mode) {
        for (RoleCounter counter : RoleCounter.values()) {
            if (counter.perGame() && counter.mode().equals(mode)) {
                return expected.get(counter)[0] + expected.get(counter)[1];
            }
        }
        throw new AssertionError("这个模式没有「每局唯一身份」：" + mode);
    }

    /** 期望值：记录表全拉下来，按 {@link RoleCounter} 的两列在 Java 里自己按将池加一遍 */
    private Map<String, Map<RoleCounter, long[]>> sumByHandByPool() {
        Map<String, Map<RoleCounter, long[]>> byPool = new HashMap<>();
        for (JiangChiRecord record : mapper.selectList(null)) {
            Map<RoleCounter, long[]> sums =
                    byPool.computeIfAbsent(record.getPool(), pool -> emptySums());
            for (RoleCounter counter : RoleCounter.values()) {
                long[] counts = sums.get(counter);
                counts[0] += counter.win(record);
                counts[1] += counter.lose(record);
            }
        }
        return byPool;
    }

    private static Map<RoleCounter, long[]> emptySums() {
        Map<RoleCounter, long[]> sums = new HashMap<>();
        for (RoleCounter counter : RoleCounter.values()) {
            sums.put(counter, new long[2]);
        }
        return sums;
    }
}
