-- 将池胜率统计：多一列「是否还在将池中」
--
-- 一个武将可以在多个将池下各留一条记录（换将池 = 在目标将池下新起一条，见 JiangChiRecordService），
-- 但任一时刻它只待在一个将池里。这一列就是那个「现在待哪儿」的标记：
-- 同一武将的记录里最多只有一条是 1，其余都是 0。
--
-- 日常维护它的地方只有一处：JiangChiRecordService.record()（记一局、只登记将池两条路都走它），
-- 落库语句见 JiangChiRecordMapper.markInPool。
--
-- 加这一列是为了导出报表：报表里「将池」一列只说明这条战绩属于哪个将池，
-- 分不出哪个才是武将当下待着的那个池子。
ALTER TABLE `jiang_chi_record`
    ADD COLUMN `in_pool` TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '是否还在将池中：1 = 该武将当前所属（同一武将只有一条为 1），0 = 历史将池' AFTER `hero`;

-- 存量数据补标记：按武将名分组，更新日期最大的那条算「当前将池」。
-- 加列时整列都取默认值 0，所以这里只用把每组的那一条点成 1，本组其余的原样是 0。
--
-- 更新日期撞车（同一秒里连着记两局，DATETIME 只到秒）时按 id 取大的 —— 后落库的那条，
-- 与 ensureExists 里 ON DUPLICATE KEY UPDATE 的先后关系一致，每次跑结果都一样。
--
-- 末尾那句 `updated_at` = `updated_at` 不是废话：updated_at 带 ON UPDATE CURRENT_TIMESTAMP，
-- 这一列的值确实变了，不显式赋一次的话它会跟着被刷成当前时刻，
-- 报表里「最后更新时间」一列就会集体变成「跑迁移的那天」。显式赋值能压住自动更新。
UPDATE `jiang_chi_record` AS `target`
    JOIN (SELECT `id`
          FROM (SELECT `id`,
                       ROW_NUMBER() OVER (PARTITION BY `hero` ORDER BY `updated_at` DESC, `id` DESC) AS `rank_in_hero`
                FROM `jiang_chi_record`) AS `ranked`
          WHERE `ranked`.`rank_in_hero` = 1) AS `current_pool`
    ON `current_pool`.`id` = `target`.`id`
SET `target`.`in_pool` = 1,
    `target`.`updated_at` = `target`.`updated_at`;
