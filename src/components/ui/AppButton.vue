<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  {
    variant: 'primary',
    disabled: false,
    type: 'button',
  },
)
</script>

<template>
  <button :type="type" class="app-button" :class="`app-button--${variant}`" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  appearance: none;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-5);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition:
    transform 0.15s ease,
    background-color 0.15s ease,
    opacity 0.15s ease;
  width: 100%;
}

.app-button:active:not(:disabled) {
  transform: scale(0.97);
}

.app-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.app-button--primary {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}

.app-button--primary:hover:not(:disabled) {
  background: var(--color-accent-strong);
}

.app-button--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.app-button--secondary:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.app-button--ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.app-button--ghost:hover:not(:disabled) {
  color: var(--color-text);
}
</style>
