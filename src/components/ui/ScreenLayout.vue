<script setup lang="ts"></script>

<template>
  <div class="screen">
    <div class="screen__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.screen {
  min-height: 100dvh;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: max(var(--space-5), env(safe-area-inset-top)) max(var(--space-4), env(safe-area-inset-right))
    max(var(--space-5), env(safe-area-inset-bottom)) max(var(--space-4), env(safe-area-inset-left));
}

.screen__content {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: auto 0;
}
</style>
