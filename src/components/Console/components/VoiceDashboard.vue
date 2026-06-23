<script setup>
import voiceOnIcon from '@/assets/icons/voice-on.svg?raw'
import playIcon from '@/assets/icons/play.svg?raw'
import repeatAllIcon from '@/assets/icons/repeat-all.svg?raw'
</script>

<template>
  <div class="voice-dashboard">
    <span class="voice-dashboard__icon" v-html="voiceOnIcon" />
    <span class="voice-dashboard__label">语音仪表</span>
    <span class="voice-dashboard__spacer" />
    <button class="voice-dashboard__btn" tabindex="-1">
      <span class="voice-dashboard__btn-icon" v-html="playIcon" />
    </button>
    <span class="voice-dashboard__icon voice-dashboard__icon--mode" v-html="repeatAllIcon" />
  </div>
</template>

<style scoped lang="less">
.voice-dashboard {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: var(--space-2);
  padding: 0 var(--space-1);
  user-select: none;
}

.voice-dashboard__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.3em;
  height: 1.3em;
  flex-shrink: 0;
  color: var(--text-tertiary);

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.voice-dashboard__label {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.voice-dashboard__spacer {
  flex: 1;
  min-width: 0;
}

.voice-dashboard__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2em;
  height: 2em;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: var(--bg-surface-hover);
  color: var(--text-secondary);
  cursor: default;
  padding: 0;
  transition: background var(--duration-fast) var(--ease-out);
}

.voice-dashboard__btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.9em;
  height: 0.9em;
  margin-left: 0.15em; // 播放三角形视觉居中

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.voice-dashboard__icon--mode {
  width: 1.5em;
  height: 1.5em;
}
</style>
