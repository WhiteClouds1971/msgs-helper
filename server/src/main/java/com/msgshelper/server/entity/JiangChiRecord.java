package com.msgshelper.server.entity;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;

/**
 * 将池胜率统计 —— 一个武将在一个将池下的战绩，对应表 jiang_chi_record。
 *
 * <p>业务主键是 (pool, hero)，id 只是行标识。
 *
 * <p>这一串胜/败场在本类里只是映射：加减由
 * {@link com.msgshelper.server.mapper.JiangChiRecordMapper} 的 SQL 直接作用在列上
 * （{@code xxx_win = xxx_win + 1}），不在 Java 里读出来再写回去 —— 那样两条并发请求会互相覆盖。
 *
 * <p>createdAt / updatedAt 交给数据库的 DEFAULT / ON UPDATE 维护，插入时不写这两列。
 */
@Data
@TableName("jiang_chi_record")
public class JiangChiRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 将池 */
    private String pool;

    /** 武将 */
    private String hero;

    /**
     * 是否还在将池中：该武将当前待着的将池为 true，其余（历史将池）都是 false。
     *
     * <p>一个武将可以在多个将池下各留一条记录，但任一时刻只待在一个池子里，
     * 所以这个标记是「按武将」算的、不是「按 (将池, 武将) 行」算的 ——
     * 同一武将的记录里最多只有一条为 true。维护它的地方见
     * {@link com.msgshelper.server.mapper.JiangChiRecordMapper#markInPool}。
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
