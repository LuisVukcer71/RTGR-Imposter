<script setup lang="ts"></script>

<template>
  <div class="app-card">
    <slot />
  </div>
</template>

<style scoped>
.app-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}
</style>
