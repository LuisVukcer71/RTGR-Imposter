<script setup lang="ts">
defineProps<{
  total: number
  current: number // 0-basiert
}>()
</script>

<template>
  <div class="progress-dots" role="progressbar" :aria-valuenow="current + 1" :aria-valuemax="total">
    <span
      v-for="i in total"
      :key="i"
      class="dot"
      :class="{ 'dot--done': i - 1 < current, 'dot--active': i - 1 === current }"
    />
  </div>
</template>

<style scoped>
.progress-dots {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: linear-gradient(180deg, var(--glass-bg-strong), var(--color-border));
  transition:
    width var(--duration-base) var(--ease-standard),
    background var(--duration-base) ease,
    box-shadow var(--duration-base) ease;
}

.dot--done {
  background: linear-gradient(180deg, var(--color-blue-light), var(--color-blue-dark));
  opacity: 0.6;
}

.dot--active {
  background: linear-gradient(180deg, var(--color-blue-light), var(--color-blue));
  width: 24px;
  border-radius: var(--radius-full);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    0 0 12px 1px var(--color-blue-glow);
  animation: pop 0.35s var(--ease-standard);
}
</style>
