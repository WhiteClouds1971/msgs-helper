<script setup>
const colors = [
  { label: '古铜金', value: 'var(--accent-gold)' },
  { label: '朱砂红', value: 'var(--accent-red)' },
  { label: '正文', value: 'var(--text-primary)' },
  { label: '青铜锈', value: 'var(--accent-green)' },
]

const sizes = [16, 24, 32, 48]

const icons = [
  {
    name: '印章 seal-stamp',
    desc: '身份标识 / 命令令牌',
    svg: `<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M 10,3 L 12,1 L 14,3"/><rect x="6" y="6" width="12" height="12" rx="0.5"/><path d="M 8.5,8.5 L 8.5,15.5"/><line x1="7" y1="9.5" x2="10" y2="9.5"/><line x1="7" y1="11.5" x2="10" y2="11.5"/><line x1="8" y1="13.5" x2="9" y2="13.5"/><path d="M 12,8 L 15.5,8 L 15.5,15.5 L 12,15.5"/><line x1="12" y1="11.5" x2="15.5" y2="11.5"/><line x1="13.75" y1="8" x2="13.75" y2="11.5"/>`,
  },
  {
    name: '祥云纹 cloud-xiangyun',
    desc: '装饰纹样 / 气运标记',
    svg: `<path d="M 12,3 A 5,5 0 0,1 19,6 A 4,4 0 0,1 16,12"/><path d="M 16,12 A 3,3 0 0,0 11,10 A 3,3 0 0,0 9,14"/><path d="M 9,14 Q 12,11 13,14 Q 12,17 9,20"/><path d="M 8,17 Q 6,16 5,18 Q 6,20 8,19"/>`,
  },
  {
    name: '折扇 folding-fan',
    desc: '角色道具 / 阶段标记',
    svg: `<path d="M 4,16 A 11,11 0 0,1 20,16"/><path d="M 6,14 A 9,9 0 0,1 18,14"/><line x1="12" y1="20" x2="5.5" y2="15"/><line x1="12" y1="20" x2="8.5" y2="14"/><line x1="12" y1="20" x2="12" y2="13.5"/><line x1="12" y1="20" x2="15.5" y2="14"/><line x1="12" y1="20" x2="18.5" y2="15"/><circle cx="12" cy="20" r="1.5" fill="currentColor"/><path d="M 7,15.5 A 10,10 0 0,1 17,15.5"/>`,
  },
  {
    name: '勾玉 magatama',
    desc: '血量标记 / 三国杀体力',
    svg: `<path d="M 9,3 A 5.5,5.5 0 1,0 5,11 Q 3,18 10,21 Q 6,16 7,12 A 3,3 0 0,1 9,3 Z"/><circle cx="8.5" cy="5.5" r="1"/><path d="M 8,4 L 8,1.5"/>`,
  },
  {
    name: '兜鍪 armor-helmet',
    desc: '防御 / 中式头盔',
    svg: `<path d="M 8,10 Q 12,2 16,10"/><path d="M 4,10 L 20,10"/><path d="M 4,10 Q 3,9 4,8"/><path d="M 20,10 Q 21,9 20,8"/><path d="M 5,10 L 6,16 Q 6,18 5,18"/><path d="M 19,10 L 18,16 Q 18,18 19,18"/><path d="M 12,3 L 12,1"/><path d="M 10,3 L 8,1"/><path d="M 14,3 L 16,1"/><circle cx="12" cy="6" r="1.2"/>`,
  },
  {
    name: '团龙纹 dragon-emblem',
    desc: '势力标记 / 圆形徽章背景',
    svg: `<circle cx="12" cy="12" r="10"/><path d="M 12,3 Q 18,4 20,9 Q 21,14 16,17 Q 12,20 8,18 Q 3,15 5,10 Q 6,6 12,5"/><path d="M 7,8 L 10,9"/><path d="M 10,9 L 9,6 M 10,9 L 11.5,6.5"/><circle cx="8.5" cy="8.5" r="0.7" fill="currentColor"/><path d="M 7,9 Q 5,8 4,10"/><line x1="17" y1="8" x2="19" y2="6.5"/><line x1="19" y1="11" x2="21" y2="10"/><line x1="18" y1="15" x2="20" y2="16.5"/><line x1="14" y1="18.5" x2="15" y2="21"/><line x1="9" y1="19.5" x2="8" y2="22"/><path d="M 16,16 L 18,15 M 17,17 L 19,17"/><path d="M 8,18 Q 5,19 4,16"/><circle cx="12" cy="11" r="1.8"/><path d="M 12,9 L 12,7.5"/><path d="M 14.5,11 L 16,10.5"/><path d="M 9.5,11 L 8,10.5"/>`,
  },
]
</script>

<template>
  <div class="preview">
    <h2>AI 手绘国风图标 — 预览</h2>

    <div
      v-for="icon in icons"
      :key="icon.name"
      class="icon-card"
    >
      <h3>{{ icon.name }}</h3>
      <p class="desc">
        {{ icon.desc }}
      </p>

      <div class="icon-grid">
        <div
          v-for="color in colors"
          :key="color.label"
          class="color-row"
        >
          <span class="color-label">{{ color.label }}</span>
          <span
            v-for="size in sizes"
            :key="size"
            class="icon-wrap"
            :style="{ color: color.value }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              :width="size"
              :height="size"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              v-html="icon.svg"
            />
            <small>{{ size }}px</small>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview {
  font-family: var(--font-body);
  color: var(--text-primary);
  padding: var(--space-6);
  max-width: var(--max-width);
  margin: 0 auto;
}

h2 {
  font-family: var(--font-display);
  color: var(--accent-gold);
  margin-bottom: var(--space-6);
}

.icon-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

h3 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  margin: 0 0 var(--space-1) 0;
}

.desc {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin: 0 0 var(--space-4) 0;
}

.icon-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.color-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.color-label {
  width: 48px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.icon-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 52px;
}

.icon-wrap small {
  font-size: 0.6rem;
  color: var(--text-tertiary);
}
</style>
