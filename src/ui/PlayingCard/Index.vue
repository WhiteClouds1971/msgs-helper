<script setup>
  import { computed } from 'vue';

  /**
   * PlayingCard —— 单张牌面的展示（无业务耦合的基础 UI 组件）
   *
   * 只管把「一张牌」画出来：可选的花色 + 点数角标，加牌名本身。
   * 花色 / 点数给不给都行 —— 只给牌名就是一枚纯名签（基本牌、锦囊牌这类
   * 不需要认具体的牌），三样都给就是一张能对上实物的牌。
   *
   * 两种版式（variant）：
   *   · tile —— 竖向小方块：角标在上、牌名居中，用于成片铺开的牌池（一屏几十枚）
   *   · row  —— 横向一行：角标在左、牌名在右，用于一列一条的记录列表
   *
   * 三种状态都只是「加上一个类」，不带任何交互与自己的状态：
   *   · selected —— 选中（金描边 + 淡金底 + 金辉光）
   *   · hidden   —— 盖住牌面信息（斜纹底 + 居中一行「已隐藏」）；**尺寸不变**，
   *                 只是把牌名与角标 visibility: hidden —— 牌面常常是一排里的一枚，
   *                 盖住就缩一截会让整排跟着挪
   *   点击、左滑、长按一律归使用方（用 class 透传把自己的类挂上来即可）。
   *
   * 牌面本身是块级元素；要塞进 <button> 里（按钮里只允许短语内容）就传 as="span"，
   * 版式靠 display: flex 撑住，换标签不影响观感。
   *
   * 结构契约（供测试与使用方布局引用）：
   *   .playing-card            —— 根元素（--tile / --row 版式修饰符；is-selected / is-hidden 状态）
   *   .playing-card__mark      —— 角标（花色 + 点数同排；两样都没有则不渲染）
   *   .playing-card__pip       —— 花色字形（--is-ink 黑 / --is-red 红，随 suit.tone）
   *   .playing-card__rank      —— 点数
   *   .playing-card__name      —— 牌名
   *   .playing-card__veil      —— 盖牌时居中的那行字（绝对定位，盖在牌面上）
   */
  const props = defineProps({
    /** 牌名（如「火杀」） */
    name: { type: String, default: '' },
    /**
     * 花色：{ pip, label, tone }
     *   pip   —— 花色字形（如 '♠︎'），画在角标里
     *   label —— 花色的读法（如「黑桃」），只喂给读屏，不画出来
     *   tone  —— 'ink' 浓墨 | 'red' 朱砂（红桃、方片）
     * 不传就不画花色（只给点数也画，反之亦然）。
     */
    suit: { type: Object, default: null },
    /** 点数（'A' / '10' / 'K' …；数字或字符串都行，空值不画） */
    rank: { type: [String, Number], default: '' },
    /** 版式：tile 竖向小方块 | row 横向一行 */
    variant: {
      type: String,
      default: 'tile',
      validator: value => ['tile', 'row'].includes(value),
    },
    /** 选中态 */
    selected: { type: Boolean, default: false },
    /** 盖住牌面信息（只留牌背） */
    hidden: { type: Boolean, default: false },
    /** 根元素标签；要放进 <button> 时传 'span' */
    as: { type: String, default: 'div' },
  });

  /** 点数空值（'' / null / undefined）一律等于「没给」 */
  const rankText = computed(() =>
    props.rank === null || props.rank === undefined ? '' : String(props.rank),
  );

  const hasMark = computed(() => Boolean(props.suit?.pip) || rankText.value !== '');
</script>

<template>
  <component
    :is="as"
    class="playing-card"
    :class="[`playing-card--${variant}`, { 'is-selected': selected, 'is-hidden': hidden }]"
  >
    <span
      v-if="hasMark"
      class="playing-card__mark"
      :class="suit?.tone === 'red' ? 'is-red' : 'is-ink'"
    >
      <span
        v-if="suit?.pip"
        class="playing-card__pip"
        role="img"
        :aria-label="suit.label || '花色'"
      >{{ suit.pip }}</span>
      <span v-if="rankText" class="playing-card__rank">{{ rankText }}</span>
    </span>

    <span class="playing-card__name">{{ name }}</span>

    <!-- 盖牌不换内容、只把内容藏起来（visibility 不占位也不改尺寸）：
         牌面该多宽还是多宽，一列牌面里藏一张不会让整排跟着挪 -->
    <span
      v-if="hidden"
      class="playing-card__veil"
    >已隐藏</span>
  </component>
</template>

<style scoped lang="less">
  /* ================================================================
   牌面基座 —— 与 @/ui/SkillCard / @/ui/Collapse 同一个漆器面
   ================================================================ */
  .playing-card {
    position: relative;
    display: flex;
    min-width: 0;
    color: var(--text-primary);
    background-color: var(--bg-surface);
    background-image: var(--card-lacquer-gradient);
    border: var(--border-thin) solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    /* transform 列进来是为了让使用方能挂按压缩放；主动画只走这两个属性 */
    transition:
      transform var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out),
      background-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);
  }

  /* ================================================================
   tile —— 竖向小方块：角标在上、牌名居中
   高度取 --control-height（与 @/ui/RadioGroup 的选项同一档）：
   成片铺开时一屏能放下几十枚，牌池这种要一眼扫过去的场面，紧凑比宽绰管用
   ================================================================ */
  .playing-card--tile {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    min-height: var(--control-height);
    /* 上下不留内边距（名字本就居中，不靠它撑），左右各 4px 免得长名贴到边框上；
       两行的长名（33.6px）也仍在这条下线上，整片格子行高齐平 */
    padding: 0 var(--space-1);
    text-align: center;
  }

  /* ================================================================
   row —— 横向一行：角标在左、牌名在右
   宽度随内容（不铺满父级），一条一条挨着排就是一枚枚小牌签
   ================================================================ */
  .playing-card--row {
    /* 内容居中：牌签本来就贴着内容（居中不显），被拉宽时（如弹框里的预览）
       角标与牌名仍是一组居中的牌面，而不是孤零零贴在左边 */
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: var(--control-height);
    padding: var(--space-1) var(--space-2);
  }

  /* 角标：花色与点数同排（「♠ 10」），不折行 */
  .playing-card__mark {
    flex: none;
    display: inline-flex;
    align-items: baseline;
    gap: 1px;
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: 1;
    letter-spacing: 0.02em;
    font-variant-numeric: var(--font-nums);
  }

  /* 花色随牌色分两路：黑桃梅花是墨色，红桃方片是朱砂（设计系统 §2.1） */
  .playing-card__mark.is-ink {
    color: var(--text-primary);
  }

  .playing-card__mark.is-red {
    color: var(--accent-red);
  }

  /* 花色字形（♠ ♥ ♣ ♦）—— 牌桌上的通用记号，不是 emoji：
     font-variant-emoji 把可变现的字形钉在文字表现上，免得落成彩色 emoji */
  .playing-card__pip {
    font-size: var(--text-sm);
    line-height: 1;
    font-variant-emoji: text;
  }

  /* 牌名：窄处折行（青龙偃月刀、爪黄飞雷+1 都得放得下），不撑破所在格 */
  .playing-card--tile .playing-card__name {
    font-size: var(--text-xs);
    line-height: 1.3;
    letter-spacing: 0.02em;
    overflow-wrap: anywhere;
  }

  .playing-card--row .playing-card__name {
    min-width: 0;
    font-size: var(--text-sm);
    line-height: 1.3;
    letter-spacing: 0.02em;
    overflow-wrap: anywhere;
  }

  /* ================================================================
   状态 —— 选中 / 盖牌（都只加类，交互归使用方）
   ================================================================ */
  .playing-card.is-selected {
    border-color: var(--accent-gold);
    background-color: var(--accent-gold-bg);
    box-shadow: var(--shadow-glow-gold);
  }

  /* 盖牌：斜纹底代替牌面；牌名与角标原地藏着（保住尺寸与排布） */
  .playing-card.is-hidden {
    background-image: repeating-linear-gradient(
      135deg,
      transparent 0 5px,
      var(--accent-gold-bg) 5px 10px
    );
    box-shadow: none;
  }

  .playing-card.is-hidden > .playing-card__mark,
  .playing-card.is-hidden > .playing-card__name {
    visibility: hidden;
  }

  /* 那行「已隐藏」压在牌面正中，不参与排布 */
  .playing-card__veil {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xs);
    line-height: 1.3;
    letter-spacing: 0.08em;
    color: var(--text-secondary);
  }
</style>
