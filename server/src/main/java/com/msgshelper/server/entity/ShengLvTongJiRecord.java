package com.msgshelper.server.entity;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;

/**
 * 胜率统计 —— 一个武将在一个将池下的战绩，对应表 sheng_lv_tong_ji_record。
 *
 * <p>业务主键是 (pool, hero)，id 只是行标识。
 *
 * <p>这一串胜/败场在本类里只是映射：加减由
 * {@link com.msgshelper.server.mapper.ShengLvTongJiRecordMapper} 的 SQL 直接作用在列上
 * （{@code xxx_win = xxx_win + 1}），不在 Java 里读出来再写回去 —— 那样两条并发请求会互相覆盖。
 *
 * <p>createdAt / updatedAt 交给数据库的 DEFAULT / ON UPDATE 维护，插入时不写这两列。
 */
@Data
@TableName("sheng_lv_tong_ji_record")
public class ShengLvTongJiRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 将池 */
    private String pool;

    /** 武将 */
    private String hero;

    /**
     * 这个武将算不算待在这个将池里：记一局 / 登记一次就点亮，报表里「是否在将池中」写的就是它。
     *
     * <p>标记是「按 (将池, 武将) 行」算的 —— 将池之间互不排斥，一个武将可以同时在好几个
     * 池子里，每行各标各的、互不影响。这个标记只增不减：没有任何地方会自动把它清回 false
     * （历史遗留数据里那些 false 的行就是早先那套「换池即摘出」的逻辑留下的）。点亮见
     * {@link com.msgshelper.server.mapper.ShengLvTongJiRecordMapper#markInPool}。
     */
    private Boolean inPool;

    private Integer landlordWin;
    private Integer landlordLose;
    private Integer farmerWin;
    private Integer farmerLose;

    private Integer lordWin;
    private Integer lordLose;
    private Integer loyalistWin;
    private Integer loyalistLose;
    private Integer rebelWin;
    private Integer rebelLose;
    private Integer traitorWin;
    private Integer traitorLose;

    private Integer seat1Win;
    private Integer seat1Lose;
    private Integer seat2Win;
    private Integer seat2Lose;
    private Integer seat3Win;
    private Integer seat3Lose;
    private Integer seat4Win;
    private Integer seat4Lose;

    /** 创建日期 */
    private LocalDateTime createdAt;

    /** 更新日期 */
    private LocalDateTime updatedAt;
}
