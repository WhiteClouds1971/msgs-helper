package com.msgshelper.server.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.msgshelper.server.common.BizException;
import com.msgshelper.server.dto.ShengLvTongJiRecordRequest;
import com.msgshelper.server.entity.ShengLvTongJiRecord;
import com.msgshelper.server.mapper.ShengLvTongJiRecordMapper;

@Service
public class ShengLvTongJiRecordService {

    private final ShengLvTongJiRecordMapper mapper;

    public ShengLvTongJiRecordService(ShengLvTongJiRecordMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * 记一局，或只把武将登记进这个将池。
     *
     * <p>两种情况走的是同一条路径，只差最后一步：
     * <ol>
     *   <li>先确保 (将池, 武将) 这条在 —— 不在就建一条全 0 的，已在就把更新日期推到现在；</li>
     *   <li>把这一条标成「在池」（见 {@link ShengLvTongJiRecordMapper#markInPool}）
     *       —— 只点本次这条，该武将在别的将池下的记录一个都不动；</li>
     *   <li>带了身份和对局结果 → 对应的那一列 +1；没带 → 到此为止，只是登记进池。</li>
     * </ol>
     *
     * <p>将池之间互不排斥：同一个武将可以同时待在好几个池子里（斗地主1 一份、排位2 一份，
     * 战绩各算各的），记进新池子既不是搬家、也不会把它从老池子里摘出去。所以不填身份与对局
     * 的那条路（前端页面顶上写着的「只输入武将 + 将池……登记进这个将池」）只是「把这个武将
     * 记进这个池子」，不承担任何「换池」的语义。
     *
     * @throws BizException 必填项为空，或身份 / 对局结果只给了一个，或模式与身份对不上
     */
    @Transactional
    public ShengLvTongJiRecord record(ShengLvTongJiRecordRequest request) {
        String mode = requireText(request.mode(), "模式");
        String pool = requireText(request.pool(), "将池");
        String hero = requireText(request.hero(), "武将");

        String role = trimToNull(request.role());
        String result = trimToNull(request.result());
        // 身份和胜败是一体的：只给一个，说明前端漏传，宁可报错也不要猜
        if ((role == null) != (result == null)) {
            throw new BizException("身份（位置）与对局结果要么都填，要么都留空");
        }

        mapper.ensureExists(pool, hero);
        mapper.markInPool(pool, hero);

        if (role != null) {
            mapper.increaseCounter(pool, hero, RoleCounter.of(mode, role).columnOf(result));
        }

        return mapper.selectOne(new LambdaQueryWrapper<ShengLvTongJiRecord>()
                .eq(ShengLvTongJiRecord::getPool, pool)
                .eq(ShengLvTongJiRecord::getHero, hero));
    }

    /**
     * 撤回一局 —— 把 {@link #record} 记下的那一场减回去。
     *
     * <p>与 {@code record} 的差别只有两处，都是「撤回」这件事本身要求的：
     * <ol>
     *   <li>最后一步从 +1 变成 -1（见 {@code ShengLvTongJiRecordMapper#decreaseCounter}）；</li>
     *   <li>不碰 (将池, 武将) 那条的「在池」标记 —— 既不 {@code ensureExists} 也不 {@code markInPool}。
     *       撤回的是一条<b>历史</b>记录，而「这个武将在不在这个池子里」是之后可能又变过的事
     *       （库里的登记由用户自己维护），按历史把它改回去等于悄悄撤销后来的操作。</li>
     * </ol>
     *
     * <p>要撤回的是「哪一场」由调用方给全：模式 + 身份（位置）定到那一列，结果定到胜或败。
     * 三项缺一不可 —— 光有「武将 + 将池」减不掉任何东西（那种记录本来就不该出现在撤回列表里）。
     *
     * @return 该武将在这条将池下的最新全貌（前端想显示「3 胜 1 负」就不用再查一次）
     * @throws BizException 必填项为空，或模式与身份对不上，或结果不是 win / lose
     */
    @Transactional
    public ShengLvTongJiRecord undo(ShengLvTongJiRecordRequest request) {
        String mode = requireText(request.mode(), "模式");
        String pool = requireText(request.pool(), "将池");
        String hero = requireText(request.hero(), "武将");
        String role = requireText(request.role(), "身份（位置）");
        String result = requireText(request.result(), "对局结果");

        mapper.decreaseCounter(pool, hero, RoleCounter.of(mode, role).columnOf(result));

        return mapper.selectOne(new LambdaQueryWrapper<ShengLvTongJiRecord>()
                .eq(ShengLvTongJiRecord::getPool, pool)
                .eq(ShengLvTongJiRecord::getHero, hero));
    }

    /**
     * 把武将移出某个将池 —— 把 (将池, 武将) 这条的「在池」置为否。
     *
     * <p>与 {@link #record} 正好是两个方向：那边记一局 / 登记一次就把这个武将点亮进这个池子，
     * 这边把它摘出去。摘的是<b>归属</b>，不是记录：这一池的战绩原样留着、历史胜率照旧算，
     * 只是它不再算这个池子的在池武将（{@code in_pool = 1} 那类查询，如胜率榜，就不再列它）。
     *
     * <p>只动这一个池子：该武将在别的将池里的「在池」不受影响（将池之间互不排斥）。
     * 本来就不在池（或压根没这条记录）时不动库，直接报业务异常 —— 前端弹一句
     * 「本来就不在」比弹一句「已移出」诚实。
     *
     * @return 这条记录的最新全貌（在池已置否）
     * @throws BizException 将池 / 武将为空，或这条本来就不在池
     */
    @Transactional
    public ShengLvTongJiRecord outOfPool(ShengLvTongJiRecordRequest request) {
        String pool = requireText(request.pool(), "将池");
        String hero = requireText(request.hero(), "武将");

        // 先查再写（而不是看 UPDATE 的影响行数）：Connector/J 默认按「匹配到的行数」报数，
        // 本来就 0 也会报 1，判不出「本来就不在池」
        ShengLvTongJiRecord existing = mapper.selectOne(new LambdaQueryWrapper<ShengLvTongJiRecord>()
                .eq(ShengLvTongJiRecord::getPool, pool)
                .eq(ShengLvTongJiRecord::getHero, hero));
        if (existing == null || !Boolean.TRUE.equals(existing.getInPool())) {
            throw new BizException("「" + hero + "」本来就不在「" + PoolCatalog.labelOf(pool) + "」里");
        }

        mapper.markOutOfPool(pool, hero);
        existing.setInPool(false);
        return existing;
    }

    /**
     * 武将名单 —— 供前端搜索框做候选。
     *
     * <p>就是记录表里出现过的武将名去重（最近用过的排前面），没有单独的武将主数据表。
     */
    public List<String> listHeroes() {
        return mapper.listHeroes();
    }

    /** 必填项：空就报错，不空就去掉首尾空格（免得 "关羽 " 和 "关羽" 变成两条记录） */
    private static String requireText(String value, String label) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new BizException(label + "不能为空");
        }
        return trimmed;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
