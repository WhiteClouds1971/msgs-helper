package com.msgshelper.server;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.msgshelper.server.mapper")
public class MsgsHelperServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsgsHelperServerApplication.class, args);
    }
}
