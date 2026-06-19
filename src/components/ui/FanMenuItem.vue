<script setup>
defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
})

defineEmits(['select'])
</script>

<template>
  <button
    class="fan-menu-item"
    @click="$emit('select')"
  >
    <span class="fan-menu-item__icon">{{ icon }}</span>
    <span class="fan-menu-item__label">{{ label }}</span>
  </button>
</template>

<style scoped lang="less">
.fan-menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-width: 44px;
  min-height: 44px;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  cursor: pointer;
  border: none;
  transition: background-color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--accent-gold-bg);
  }
}

.fan-menu-item__icon {
  font-size: var(--text-xl);
  line-height: 1;
}

.fan-menu-item__label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>
