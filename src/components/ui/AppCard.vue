<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'success' | 'danger' | 'info'
  }>(),
  {
    tone: 'neutral',
  },
)
</script>

<template>
  <div class="app-card glass-surface" :class="`app-card--${tone}`">
    <slot />
  </div>
</template>

<style scoped>
.app-card {
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition:
    box-shadow var(--duration-base) ease,
    transform var(--duration-base) ease;
}

.app-card.app-card--success {
  box-shadow:
    var(--glass-shadow-ambient),
    var(--glass-shadow-contact),
    0 0 0 1px var(--color-green-alpha),
    0 0 36px 4px var(--color-green-glow);
}

.app-card.app-card--danger {
  box-shadow:
    var(--glass-shadow-ambient),
    var(--glass-shadow-contact),
    0 0 0 1px var(--color-red-alpha),
    0 0 36px 4px var(--color-red-glow);
}

.app-card.app-card--info {
  box-shadow:
    var(--glass-shadow-ambient),
    var(--glass-shadow-contact),
    0 0 0 1px var(--color-blue-alpha),
    0 0 36px 4px var(--color-blue-glow);
}
</style>
