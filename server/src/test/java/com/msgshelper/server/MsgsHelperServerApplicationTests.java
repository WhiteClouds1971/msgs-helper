package com.msgshelper.server;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/** 上下文可启动即视为骨架正常：Web 容器 + 数据源（Hikari 建池时即连库）都已就绪 */
@SpringBootTest
class MsgsHelperServerApplicationTests {

    @Test
    void contextLoads() {
    }
}
