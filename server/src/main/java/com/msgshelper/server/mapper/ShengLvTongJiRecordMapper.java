package com.msgshelper.server.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.msgshelper.server.entity.ShengLvTongJiRecord;

public interface ShengLvTongJiRecordMapper extends BaseMapper<ShengLvTongJiRecord> {

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
    @Insert("INSERT INTO sheng_lv_tong_ji_record (pool, hero) VALUES (#{pool}, #{hero}) "
            + "ON DUPLICATE KEY UPDATE updated_at = NOW()")
    int ensureExists(@Param("pool") String pool, @Param("hero") String hero);

    /**
     * 把 (将池, 武将) 这一条标成「在池」。
     *
     * <p><b>只点这一条</b>：该武将在别的将池下的记录一律不动 —— 将池之间互不排斥，
     * 一个武将可以同时待在好几个池子里（斗地主1 一份、排位2 一份，各算各的战绩），
     * 进一个新池子不等于从老池子退出来。
     *
     * <p>这一列只由这里点亮，没有任何地方会把它清回 0：要拿掉某个池子的归属得直接改库
     * （历史遗留数据里那些 {@code in_pool = 0} 的行就是这么来的）。
     *
     * <p>不必再顺手压 {@code updated_at}：这条语句碰的就只有这一行，而它上面
     * {@link #ensureExists} 与 {@link #increaseCounter} 本来就会把更新日期推到现在。
     *
     * @param pool 这次记的将池 —— 该武将就此登记进它
     * @param hero 武将
     */
    @Update("UPDATE sheng_lv_tong_ji_record SET in_pool = 1 "
            + "WHERE pool = #{pool} AND hero = #{hero}")
    int markInPool(@Param("pool") String pool, @Param("hero") String hero);

    /**
     * 把 (将池, 武将) 这条的「在池」置为否 —— 把这个武将从这个将池里摘出去。
     *
     * <p>与 {@link #markInPool} 是两个方向，且都只动这一条：别的将池里该武将的归属不受影响
     * （将池之间互不排斥）。摘的是记录的归属，不是记录本身 —— 战绩照旧留着。
     *
     * <p>末尾 {@code updated_at = updated_at} 不是废话：{@code updated_at} 带
     * ON UPDATE CURRENT_TIMESTAMP，「在池」由 1 变 0 是一次真实的列变更，不显式赋一次的话
     * 时间戳会跟着被刷成现在 —— 报表里「最后更新时间」会变成「摘出去的那天」，
     * 而它该是「最后记那一局的时间」。显式赋值能压住自动更新。
     *
     * @param pool 从这个将池里摘出去
     * @param hero 武将
     * @return 影响行数（没有这条记录时是 0；是否「本来就不在池」由 service 先查一次判定，
     *         不靠这个数 —— Connector/J 默认按「匹配到的行数」报，本来就 0 也会报 1）
     */
    @Update("UPDATE sheng_lv_tong_ji_record SET in_pool = 0, updated_at = updated_at "
            + "WHERE pool = #{pool} AND hero = #{hero}")
    int markOutOfPool(@Param("pool") String pool, @Param("hero") String hero);

    /**
     * 某个身份（位置）的胜场或败场 +1，并把「更新日期」推到现在。
     *
     * <p>column 用 ${} 直接拼进 SQL 而不是走 #{}
     * —— 列名是标识符，预编译占位符替代不了。
     * 它只能来自 {@link com.msgshelper.server.service.RoleCounter} 这个白名单枚举，
     * 绝不允许把请求里的字符串透传进来，否则就是 SQL 注入。
     */
    @Update("UPDATE sheng_lv_tong_ji_record SET ${column} = ${column} + 1, updated_at = NOW() "
            + "WHERE pool = #{pool} AND hero = #{hero}")
    int increaseCounter(@Param("pool") String pool,
                        @Param("hero") String hero,
                        @Param("column") String column);

    /**
     * 某个身份（位置）的胜场或败场 -1，并把「更新日期」推到现在 —— 撤回上一条记录用。
     *
     * <p>与 {@link #increaseCounter} 是同一条语句的两个方向，列名的信任模型也一样
     * （只认 {@link com.msgshelper.server.service.RoleCounter} 这个白名单枚举）。
     *
     * <p>用 {@code GREATEST(..., 0)} 兜底：撤回的是「前端历史里的那一条」，
     * 万一数据被别处改过（或同一局被撤了两次），宁可停在 0 也不要在列里留下负数 ——
     * 负数会顺着导出报表与胜率一路算下去，比「这次撤回没生效」难收拾得多。
     *
     * <p>注意这里<b>不</b>碰 {@code in_pool}：撤回一局战绩不该顺手把武将的将池归属改回去
     * （那条记录可能是用户后来主动换的池子，见 {@link #markInPool}）。
     */
    @Update("UPDATE sheng_lv_tong_ji_record SET ${column} = GREATEST(${column} - 1, 0), updated_at = NOW() "
            + "WHERE pool = #{pool} AND hero = #{hero}")
    int decreaseCounter(@Param("pool") String pool,
                        @Param("hero") String hero,
                        @Param("column") String column);

    /**
     * 某个将池下按身份（位置）汇总胜败场 —— 「身份（位置）胜率」的数据源
     * （见 {@link com.msgshelper.server.service.ShengLvTongJiRoleStatService}）。
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
            + " FROM sheng_lv_tong_ji_record"
            + " WHERE pool = #{pool}"
            + "</script>")
    Map<String, Object> sumCounters(@Param("pool") String pool,
                                    @Param("prefixes") List<String> prefixes);

    /**
     * 某个将池 + 某个身份（位置）下，各武将的战绩 —— 胜率榜的数据源
     * （见 {@link com.msgshelper.server.service.ShengLvTongJiHeroStatService}）。
     *
     * <p>一个武将一行，只数它在这<b>一个身份</b>上的胜败场：同一行的地主场次不会混进农民那档，
     * 换个身份就是另一套数 —— 与 {@link #sumCounters} 同一套口径，只是这边按武将分组。
     *
     * <p><b>只算标着「在池」的武将</b>（{@code in_pool = 1}）：没标在池的行留着是给导出报表对账用的
     * （见 {@link com.msgshelper.server.entity.ShengLvTongJiRecord#getInPool}），不该混进这份战力表。
     * 记录一局就会把该武将标进这个池子，所以这一条过滤挡下的是早先那套「换池即摘出」留下的旧数据。
     *
     * <p>排序：胜率高的在前，场数多的次之（同为 100% 时，打了 10 场的排在 1 场的前面），
     * 再并列就按武将名 —— 同一份数据每次查出来顺序都一样。一场没打的武将被
     * {@code HAVING} 挡在外面（0 场没有胜率可言，塞进去就是一行空胜率）。
     *
     * <p>列名同样用 ${} 拼，但只认调用方从 {@link com.msgshelper.server.service.RoleCounter}
     * 取来的白名单列名（与 {@link #increaseCounter} 同一套信任模型），绝不接受外部字符串。
     *
     * @param pool       将池，取前端 POOLS 的 value
     * @param winColumn  胜场列名，如 landlord_win —— 取
     *                   {@link com.msgshelper.server.service.RoleCounter#columnOf}
     * @param loseColumn 败场列名，同上
     * @param limit      最多回几条；<b>null = 不截断，该池该身份下的武将一个不落</b>
     *                   （口径已被将池与身份框住，条数最多就是该将池的武将数）
     * @return 一行一个武将：key 是 {@code hero} / {@code win_count} / {@code lose_count}，
     *         值是数值（SUM 出来通常是 BigDecimal）—— 取值时按 Number 收，别认死类型
     */
    @Select("<script>"
            + " SELECT hero,"
            + " COALESCE(SUM(${winColumn}), 0) AS win_count,"
            + " COALESCE(SUM(${loseColumn}), 0) AS lose_count"
            + " FROM sheng_lv_tong_ji_record"
            + " WHERE pool = #{pool} AND in_pool = 1"
            + " GROUP BY hero"
            + " HAVING SUM(${winColumn}) + SUM(${loseColumn}) > 0"
            + " ORDER BY SUM(${winColumn}) / SUM(${winColumn} + ${loseColumn}) DESC,"
            + " SUM(${winColumn} + ${loseColumn}) DESC,"
            + " hero ASC"
            + " <if test='limit != null'> LIMIT #{limit} </if>"
            + "</script>")
    List<Map<String, Object>> heroStats(@Param("pool") String pool,
                                        @Param("winColumn") String winColumn,
                                        @Param("loseColumn") String loseColumn,
                                        @Param("limit") Integer limit);

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
    @Select("SELECT hero FROM sheng_lv_tong_ji_record GROUP BY hero ORDER BY MAX(updated_at) DESC")
    List<String> listHeroes();
}
