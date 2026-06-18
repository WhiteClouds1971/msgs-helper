<script setup></script>

<template>
  <div class="home">
    <h1>面杀辅助工具</h1>
    <p>项目框架已就绪</p>
  </div>
</template>

<style scoped>
  .home {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: var(--space-4);
  }

  .home h1 {
    font-size: var(--text-2xl);
    color: var(--accent-gold);
  }

  .home p {
    font-size: var(--text-base);
    color: var(--text-secondary);
  }
</style>
