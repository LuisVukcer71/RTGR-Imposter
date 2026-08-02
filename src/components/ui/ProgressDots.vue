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
  border-radius: 50%;
  background: var(--color-border);
  transition: all 0.2s ease;
}

.dot--done {
  background: var(--color-accent);
  opacity: 0.6;
}

.dot--active {
  background: var(--color-accent);
  width: 22px;
  border-radius: 5px;
}
</style>
