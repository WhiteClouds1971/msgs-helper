-- 将池胜率统计：一个武将在一个将池下的战绩
--
-- 业务主键是 (pool, hero)，id 只是行标识（给前端表格 / 接口用）。
-- 一个武将可以在多个将池各留一条记录：换将池 = 在目标将池下新起一条，
-- 老将池的战绩原样留着（规则见 JiangChiRecordService）。
--
-- 这一串胜/败场按「模式 · 身份（位置）」列平铺，是为了让前端一眼能当表格看，
-- 代价是加一个模式要改表。目前只有斗地主 / 军争 / 团战三套，够用。
CREATE TABLE `jiang_chi_record`
(
    `id`   BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键，仅作行标识',
    `pool` VARCHAR(32) NOT NULL COMMENT '将池（前端 POOLS 的 value，如 jiang-chi-1）',
    `hero` VARCHAR(32) NOT NULL COMMENT '武将名',

    `landlord_win`  INT NOT NULL DEFAULT 0 COMMENT '斗地主 · 地主 胜场',
    `landlord_lose` INT NOT NULL DEFAULT 0 COMMENT '斗地主 · 地主 败场',
    `farmer_win`    INT NOT NULL DEFAULT 0 COMMENT '斗地主 · 农民 胜场',
    `farmer_lose`   INT NOT NULL DEFAULT 0 COMMENT '斗地主 · 农民 败场',

    `lord_win`      INT NOT NULL DEFAULT 0 COMMENT '军争 · 主公 胜场',
    `lord_lose`     INT NOT NULL DEFAULT 0 COMMENT '军争 · 主公 败场',
    `loyalist_win`  INT NOT NULL DEFAULT 0 COMMENT '军争 · 忠臣 胜场',
    `loyalist_lose` INT NOT NULL DEFAULT 0 COMMENT '军争 · 忠臣 败场',
    `rebel_win`     INT NOT NULL DEFAULT 0 COMMENT '军争 · 反贼 胜场',
    `rebel_lose`    INT NOT NULL DEFAULT 0 COMMENT '军争 · 反贼 败场',
    `traitor_win`   INT NOT NULL DEFAULT 0 COMMENT '军争 · 内奸 胜场',
    `traitor_lose`  INT NOT NULL DEFAULT 0 COMMENT '军争 · 内奸 败场',

    `seat1_win`     INT NOT NULL DEFAULT 0 COMMENT '团战 · 一号位 胜场',
    `seat1_lose`    INT NOT NULL DEFAULT 0 COMMENT '团战 · 一号位 败场',
    `seat2_win`     INT NOT NULL DEFAULT 0 COMMENT '团战 · 二号位 胜场',
    `seat2_lose`    INT NOT NULL DEFAULT 0 COMMENT '团战 · 二号位 败场',
    `seat3_win`     INT NOT NULL DEFAULT 0 COMMENT '团战 · 三号位 胜场',
    `seat3_lose`    INT NOT NULL DEFAULT 0 COMMENT '团战 · 三号位 败场',
    `seat4_win`     INT NOT NULL DEFAULT 0 COMMENT '团战 · 四号位 胜场',
    `seat4_lose`    INT NOT NULL DEFAULT 0 COMMENT '团战 · 四号位 败场',

    -- 插入时两者取同一个 CURRENT_TIMESTAMP，所以新记录的创建 / 更新日期天然相同
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建日期',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日期',

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_pool_hero` (`pool`, `hero`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='将池胜率统计：一个武将在一个将池下的战绩';
