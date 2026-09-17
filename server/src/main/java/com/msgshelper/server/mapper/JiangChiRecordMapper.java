package com.msgshelper.server.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.msgshelper.server.entity.JiangChiRecord;

public interface JiangChiRecordMapper extends BaseMapper<JiangChiRecord> {

    /**
     * 确保 (将池, 武将) 这条记录在。
     *
     * <p>不在 → 插一条，各胜/败场取列默认值 0，创建日期与更新日期同为当前时刻。
     * 已在 → 只把「更新日期」推到现在，胜败场一律不动。
     *
     * <p>用 ON DUPLICATE KEY UPDATE 一条语句解决，并发请求同时打过来也不会撞唯一键。
     *
     * @return 影响行数（插入算 1，命中重复键更新算 2）
     */
    @Insert("INSERT INTO jiang_chi_record (pool, hero) VALUES (#{pool}, #{hero}) "
            + "ON DUPLICATE KEY UPDATE updated_at = NOW()")
    int ensureExists(@Param("pool") String pool, @Param("hero") String hero);

    /**
     * 某个身份（位置）的胜场或败场 +1，并把「更新日期」推到现在。
     *
     * <p>column 用 ${} 直接拼进 SQL 而不是走 #{}
     * —— 列名是标识符，预编译占位符替代不了。
     * 它只能来自 {@link com.msgshelper.server.service.RoleCounter} 这个白名单枚举，
     * 绝不允许把请求里的字符串透传进来，否则就是 SQL 注入。
     */
    @Update("UPDATE jiang_chi_record SET ${column} = ${column} + 1, updated_at = NOW() "
            + "WHERE pool = #{pool} AND hero = #{hero}")
    int increaseCounter(@Param("pool") String pool,
                        @Param("hero") String hero,
                        @Param("column") String column);

    /**
     * 某个将池下按身份（位置）汇总胜败场 —— 「身份（位置）胜率」的数据源
     * （见 {@link com.msgshelper.server.service.JiangChiRoleStatService}）。
     *
     * <p>一条 SQL 把所有身份的两列一起加起来，按将池过滤、不按武将：选项后面那个数是
     * 「这个将池里这个身份打得怎么样」——换将池就换一套数，同一将池里各武将的战绩合在一起看。
     *
     * <p>没有 GROUP BY，所以永远只回一行，将池下一条记录都没有也一样
     * （SUM 得 NULL，被 COALESCE 兜成 0）。
     *
     * <p>列名同样用 ${} 拼，但只认调用方从 {@link com.msgshelper.server.service.RoleCounter}
     * 取来的白名单前缀（与 {@link #increaseCounter} 同一套信任模型），绝不接受外部字符串。
     *
     * @param pool     将池，取前端 POOLS 的 value
     * @param prefixes 身份（位置）的列前缀，如 landlord / seat1 —— 传
     *                 {@link com.msgshelper.server.service.RoleCounter#columnPrefixes()}
     * @return 一行数据：key 是 {@code <前缀>_win} / {@code <前缀>_lose}，
     *         值是数值（SUM 出来通常是 BigDecimal，没数据时是 0）—— 取值时按 Number 收，别认死类型
     */
    @Select("<script>"
            + " SELECT "
            + " <foreach item='prefix' collection='prefixes' separator=','>"
            + " COALESCE(SUM(${prefix}_win), 0) AS ${prefix}_win,"
            + " COALESCE(SUM(${prefix}_lose), 0) AS ${prefix}_lose"
            + " </foreach>"
            + " FROM jiang_chi_record"
            + " WHERE pool = #{pool}"
            + "</script>")
    Map<String, Object> sumCounters(@Param("pool") String pool,
                                    @Param("prefixes") List<String> prefixes);

    /**
     * 武将名单 —— 记录表里出现过的武将名，去重。
     *
     * <p>没有单独的武将主数据表：记一局就自然多一个武将，名单跟着记录长。
     *
     * <p>按「最后一次记录的时间」倒序，而不是字典序 —— 前端搜索框只取前若干条，
     * 得让常用的武将浮上来，否则截断掉的就是随机一批。
     *
     * @return 武将名，最近用过的排前面
     */
    @Select("SELECT hero FROM jiang_chi_record GROUP BY hero ORDER BY MAX(updated_at) DESC")
    List<String> listHeroes();
}
