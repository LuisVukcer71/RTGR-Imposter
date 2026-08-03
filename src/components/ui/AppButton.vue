<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
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

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

const ripples = ref<Ripple[]>([])
let rippleId = 0

function spawnRipple(event: PointerEvent) {
  if (props.disabled) return

  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const id = rippleId++

  ripples.value.push({
    id,
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    size,
  })

  window.setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 500)
}
</script>

<template>
  <button
    :type="type"
    class="app-button glass-surface glass-surface--interactive"
    :class="`app-button--${variant}`"
    :disabled="disabled"
    @pointerdown="spawnRipple"
  >
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="app-button__ripple"
      :style="{
        left: `${ripple.x}px`,
        top: `${ripple.y}px`,
        width: `${ripple.size}px`,
        height: `${ripple.size}px`,
      }"
    />
    <span class="app-button__content"><slot /></span>
  </button>
</template>

<style scoped>
.app-button {
  overflow: hidden;
  appearance: none;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-5);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-text);
  width: 100%;
}

.app-button__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.app-button__ripple {
  position: absolute;
  border-radius: 50%;
  background: var(--app-button-ripple-color, rgba(255, 255, 255, 0.5));
  animation: ripple-expand 0.5s ease-out forwards;
  pointer-events: none;
}

.app-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.app-button.app-button--primary {
  --app-button-ripple-color: rgba(255, 255, 255, 0.55);
  background:
    linear-gradient(135deg, var(--color-blue-alpha), transparent 65%),
    var(--glass-bg-strong);
  box-shadow:
    var(--glass-shadow-ambient),
    var(--glass-shadow-contact),
    0 0 24px 2px var(--color-blue-glow);
}

.app-button.app-button--primary:hover:not(:disabled) {
  background:
    linear-gradient(135deg, var(--color-blue-glow), transparent 70%),
    var(--glass-bg-strong);
}

.app-button.app-button--secondary {
  --app-button-ripple-color: rgba(255, 255, 255, 0.3);
  color: var(--color-text);
}

.app-button.app-button--ghost {
  --app-button-ripple-color: rgba(255, 255, 255, 0.2);
  background: transparent;
  box-shadow: none;
  color: var(--color-text-muted);
}

.app-button.app-button--ghost::before,
.app-button.app-button--ghost::after {
  display: none;
}

.app-button.app-button--ghost:hover:not(:disabled) {
  color: var(--color-text);
}
</style>
