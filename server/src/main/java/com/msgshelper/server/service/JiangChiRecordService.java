package com.msgshelper.server.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.msgshelper.server.common.BizException;
import com.msgshelper.server.dto.JiangChiRecordRequest;
import com.msgshelper.server.entity.JiangChiRecord;
import com.msgshelper.server.mapper.JiangChiRecordMapper;

@Service
public class JiangChiRecordService {

    private final JiangChiRecordMapper mapper;

    public JiangChiRecordService(JiangChiRecordMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * 记一局，或只登记武将所属将池。
     *
     * <p>两种情况走的是同一条路径，只差最后一步：
     * <ol>
     *   <li>先确保 (将池, 武将) 这条在 —— 不在就建一条全 0 的，已在就把更新日期推到现在；</li>
     *   <li>把「是否还在将池中」重新点一遍：本次这个将池为是，该武将其余记录全部为否；</li>
     *   <li>带了身份和对局结果 → 对应的那一列 +1；没带 → 到此为止，只是登记 / 刷新归属。</li>
     * </ol>
     *
     * <p>「武将换将池」不是搬记录，而是在目标将池下新起一条 —— 老将池的战绩原样留着，
     * 两个将池各算各的。所以第 2 步两个分支都要走：不填身份与对局的那条路
     * （前端页面顶上写着的「只输入武将 + 将池，可以修改该武将所在的将池」）
     * 正是换将池的入口，漏了它，报表上这个武将就会同时挂在两个将池里、或者哪个都不挂。
     *
     * @throws BizException 必填项为空，或身份 / 对局结果只给了一个，或模式与身份对不上
     */
    @Transactional
    public JiangChiRecord record(JiangChiRecordRequest request) {
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

        return mapper.selectOne(new LambdaQueryWrapper<JiangChiRecord>()
                .eq(JiangChiRecord::getPool, pool)
                .eq(JiangChiRecord::getHero, hero));
    }

    /**
     * 撤回一局 —— 把 {@link #record} 记下的那一场减回去。
     *
     * <p>与 {@code record} 的差别只有两处，都是「撤回」这件事本身要求的：
     * <ol>
     *   <li>最后一步从 +1 变成 -1（见 {@code JiangChiRecordMapper#decreaseCounter}）；</li>
     *   <li>不碰 (将池, 武将) 那条的归属 —— 既不 {@code ensureExists} 也不 {@code markInPool}。
     *       撤回的是一条<b>历史</b>记录，而武将现在待在哪个池子里是之后可能又改过的事，
     *       按历史把归属改回去等于悄悄撤销用户后来的操作。</li>
     * </ol>
     *
     * <p>要撤回的是「哪一场」由调用方给全：模式 + 身份（位置）定到那一列，结果定到胜或败。
     * 三项缺一不可 —— 光有「武将 + 将池」减不掉任何东西（那种记录本来就不该出现在撤回列表里）。
     *
     * @return 该武将在这条将池下的最新全貌（前端想显示「3 胜 1 负」就不用再查一次）
     * @throws BizException 必填项为空，或模式与身份对不上，或结果不是 win / lose
     */
    @Transactional
    public JiangChiRecord undo(JiangChiRecordRequest request) {
        String mode = requireText(request.mode(), "模式");
        String pool = requireText(request.pool(), "将池");
        String hero = requireText(request.hero(), "武将");
        String role = requireText(request.role(), "身份（位置）");
        String result = requireText(request.result(), "对局结果");

        mapper.decreaseCounter(pool, hero, RoleCounter.of(mode, role).columnOf(result));

        return mapper.selectOne(new LambdaQueryWrapper<JiangChiRecord>()
                .eq(JiangChiRecord::getPool, pool)
                .eq(JiangChiRecord::getHero, hero));
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
