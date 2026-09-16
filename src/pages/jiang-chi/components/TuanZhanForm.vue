<script setup>
  import Select from '@/ui/Select/Index.vue';

  /**
   * 团战 —— 模式专属表单
   *
   * 只放该模式比通用三行（模式 / 将池 / 武将）多出来的表单项。
   * 两个字段都是选填：不填也能记一条。
   * 两个字段的值由页面持有（见 ../Index.vue 的 role / result），组件只负责画字段：
   * 各模式的身份/位置值域不同，换模式时页面会清空它们，不带过去。
   * 行距由页面给（.jiang-chi__mode-form），组件自己不带样式。
   */
  const role = defineModel('role', { type: String, default: '' });
  const result = defineModel('result', { type: String, default: '' });

  /** 位置 —— value 是稳定标识（改 label 不影响已存数据），label 才是给人看的 */
  const ROLES = Object.freeze([
    { label: '一号位', value: '1' },
    { label: '二号位', value: '2' },
    { label: '三号位', value: '3' },
    { label: '四号位', value: '4' },
  ]);

  /** 对局结果 —— 三个模式共用同一套值域 */
  const RESULTS = Object.freeze([
    { label: '赢', value: 'win' },
    { label: '输', value: 'lose' },
  ]);
</script>

<template>
  <div class="mode-form mode-form--tuan-zhan">
    <Select
      v-model="role"
      label="位置"
      placeholder="请选择位置"
      :options="ROLES"
    />

    <Select
      v-model="result"
      label="对局"
      placeholder="请选择对局结果"
      :options="RESULTS"
    />
  </div>
</template>
