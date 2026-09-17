<script setup>
  import { computed } from 'vue';
  import RadioGroup from '@/ui/RadioGroup/Index.vue';
  import { rolesOf } from '../modes.js';

  /**
   * 斗地主 —— 模式专属表单
   *
   * 只放该模式比通用三行（模式 / 将池 / 武将）多出来的表单项。
   * 两个字段都是选填：不填也能记一条。
   * 两个字段的值由页面持有（见 ../Index.vue 的 role / result），组件只负责画字段：
   * 各模式的身份/位置值域不同，换模式时页面会清空它们，不带过去。
   * 行距由页面给（.jiang-chi__mode-form），组件自己不带样式。
   */
  const role = defineModel('role', { type: String, default: '' });
  const result = defineModel('result', { type: String, default: '' });

  /**
   * 各身份的胜率文字（如 58.33%），按 role 的 value 给 —— 页面拉完后端汇总整理好的
   * （见 ../Index.vue 的 roleRates 与 ../rates.js）。拉不到时是空对象，
   * 选项上就只显示身份名，不留空位。
   */
  const props = defineProps({
    rates: { type: Object, default: () => ({}) },
  });

  /** 身份（位置）—— 值域是公共常量（见 ../modes.js），与后端 RoleCounter 同一套标识 */
  const ROLES = rolesOf('dou-di-zhu');

  /** 身份选项带上胜率：@/ui/RadioGroup 把 hint（胜率）画在身份名下面一行 */
  const roleOptions = computed(() =>
    ROLES.map(option => ({ ...option, hint: props.rates[option.value] }))
  );

  /** 对局结果 —— 三个模式共用同一套值域 */
  const RESULTS = Object.freeze([
    { label: '赢', value: 'win' },
    { label: '输', value: 'lose' },
  ]);
</script>

<template>
  <div class="mode-form mode-form--dou-di-zhu">
    <RadioGroup v-model="role" label="身份" :options="roleOptions" />

    <RadioGroup v-model="result" label="对局" :options="RESULTS" />
  </div>
</template>
