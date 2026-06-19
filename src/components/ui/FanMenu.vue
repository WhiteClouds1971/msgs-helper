<script setup>
import { ref, watch, nextTick } from 'vue'
import FanMenuItem from './FanMenuItem.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  anchorX: { type: Number, default: 0 },
  anchorY: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'select'])

const isOpen = ref(false)

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      nextTick(() => {
        isOpen.value = true
      })
    } else {
      isOpen.value = false
    }
  },
  { immediate: true },
)

const items = [
  { icon: '🎙️', label: '语音', value: 'voice' },
  { icon: '🔍', label: '搜索', value: 'search' },
  { icon: '⚙️', label: '设置', value: 'settings' },
]

const angles = [-45, 0, 45]

function getItemStyle(index) {
  const angle = angles[index]
  return {
    transform: `rotate(${angle}deg) translateY(-80px) rotate(-${angle}deg)`,
  }
}

function close() {
  emit('update:modelValue', false)
}

function handleSelect(value) {
  emit('select', value)
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fan-overlay">
      <div
        v-if="modelValue"
        class="fan-menu-overlay"
        @click.self="close"
      >
        <div
          class="fan-menu"
          :class="{ 'is-open': isOpen }"
          :style="{ left: anchorX + 'px', top: anchorY + 'px' }"
        >
          <div
            v-for="(item, index) in items"
            :key="item.value"
            class="fan-menu__item-wrapper"
            :style="getItemStyle(index)"
          >
            <span class="fan-menu__item-inner">
              <FanMenuItem
                :icon="item.icon"
                :label="item.label"
                @select="handleSelect(item.value)"
              />
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="less">
/* === Overlay === */
.fan-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--bg-overlay);
}

/* === Transition: overlay fade === */
.fan-overlay-enter-active {
  transition: opacity var(--duration-normal) var(--ease-enter);
}

.fan-overlay-enter-from {
  opacity: 0;
}

.fan-overlay-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.fan-overlay-leave-to {
  opacity: 0;
}

/* === Fan container === */
.fan-menu {
  position: absolute;
  /* left / top set via inline style */
}

/* === Item wrapper: handles rotation positioning === */
.fan-menu__item-wrapper {
  position: absolute;
  /* transform set via inline style (rotate + translate) */
}

/* === Item inner: handles scale + opacity animation === */
.fan-menu__item-inner {
  display: block;
  opacity: 0;
  transform: scale(0);
  transition:
    opacity var(--duration-normal) var(--ease-enter),
    transform var(--duration-normal) var(--ease-enter);

  .fan-menu.is-open & {
    opacity: 1;
    transform: scale(1);
  }
}

/* Stagger: fan out from center → left → right */
.fan-menu__item-wrapper:nth-child(1) .fan-menu__item-inner {
  transition-delay: 0ms;
}

.fan-menu__item-wrapper:nth-child(2) .fan-menu__item-inner {
  transition-delay: 50ms;
}

.fan-menu__item-wrapper:nth-child(3) .fan-menu__item-inner {
  transition-delay: 100ms;
}

/* === Reduced motion === */
@media (prefers-reduced-motion: reduce) {
  .fan-overlay-enter-active,
  .fan-overlay-leave-active {
    transition: none;
  }

  .fan-menu__item-inner {
    transition: none;
  }
}
</style>
