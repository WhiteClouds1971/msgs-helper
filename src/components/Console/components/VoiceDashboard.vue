<script setup>
import { ref, computed } from 'vue'
import voiceOnIcon from '@/assets/icons/voice-on.svg?raw'
import voiceOffIcon from '@/assets/icons/voice-off.svg?raw'
import playIcon from '@/assets/icons/play.svg?raw'
import pauseIcon from '@/assets/icons/pause.svg?raw'
import repeatAllIcon from '@/assets/icons/repeat-all.svg?raw'
import shuffleIcon from '@/assets/icons/shuffle.svg?raw'
import repeatSingleIcon from '@/assets/icons/repeat-single.svg?raw'

const isMuted = ref(false)
const isPlaying = ref(false)
const playMode = ref('sequence')

const voiceIcon = computed(() => (isMuted.value ? voiceOffIcon : voiceOnIcon))
const playPauseIcon = computed(() => (isPlaying.value ? pauseIcon : playIcon))

const modes = ['sequence', 'random', 'single']
const modeIcons = {
  sequence: repeatAllIcon,
  random: shuffleIcon,
  single: repeatSingleIcon,
}
const modeIcon = computed(() => modeIcons[playMode.value])

function toggleMute() {
  isMuted.value = !isMuted.value
}

function togglePlayPause() {
  isPlaying.value = !isPlaying.value
}

function cyclePlayMode() {
  const idx = modes.indexOf(playMode.value)
  playMode.value = modes[(idx + 1) % modes.length]
}
</script>

<template>
  <div class="voice-dashboard">
    <span
      class="voice-dashboard__icon"
      :class="{ 'is-muted': isMuted }"
      v-html="voiceIcon"
      @click.stop="toggleMute"
    />
    <span class="voice-dashboard__label">语音仪表</span>
    <span class="voice-dashboard__spacer" />
    <button
      class="voice-dashboard__btn"
      :class="{ 'is-playing': isPlaying }"
      @click.stop="togglePlayPause"
    >
      <span class="voice-dashboard__btn-icon" v-html="playPauseIcon" />
    </button>
    <span
      class="voice-dashboard__icon voice-dashboard__icon--mode"
      v-html="modeIcon"
      @click.stop="cyclePlayMode"
    />
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
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast) var(--ease-out);

  &:hover {
    color: var(--text-secondary);
  }

  &.is-muted {
    color: var(--accent-red);
  }

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
  cursor: pointer;
  padding: 0;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--accent-gold-bg);
  }

  &.is-playing {
    background: var(--accent-gold-dark);
    color: var(--text-inverse);
    box-shadow: var(--shadow-glow-gold);
  }
}

.voice-dashboard__btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.3em;
  height: 1.3em;

  :deep(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.voice-dashboard__icon--mode {
  width: 1.5em;
  height: 1.5em;
  cursor: pointer;
}
</style>
