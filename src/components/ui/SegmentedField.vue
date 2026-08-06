<script setup lang="ts">
/**
 * Auswahl aus wenigen gleichrangigen Optionen (Impostor-Anzahl, Timer-Presets).
 * Bewusst ohne stillen Standardwert: solange `modelValue` `null` ist, ist
 * nichts markiert und der Aufrufer blockiert den Weiter-Button.
 */
defineProps<{
  options: Array<{ value: number; label: string; badge?: string }>
  groupLabel: string
  disabled?: boolean
}>()

const model = defineModel<number | null>({ required: true })
</script>

<template>
  <div class="seg" role="radiogroup" :aria-label="groupLabel">
    <button
      v-for="option in options"
      :key="option.value"
      class="seg__item"
      :class="{ 'is-on': model === option.value }"
      type="button"
      role="radio"
      :aria-checked="model === option.value"
      :disabled="disabled"
      @click="model = option.value"
    >
      <span>{{ option.label }}</span>
      <span v-if="option.badge" class="seg__badge">{{ option.badge }}</span>
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.seg__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  min-width: var(--touch);
  min-height: var(--touch);
  padding: var(--s-2) var(--s-4);
  font-weight: 650;
  color: var(--c-text-muted);
  background: var(--c-surface-2);
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
  transition:
    color var(--t-fast) var(--e-out),
    background-color var(--t-fast) var(--e-out),
    border-color var(--t-fast) var(--e-out),
    transform var(--t-fast) var(--e-out);
}

.seg__item:active:not(:disabled) {
  transform: scale(0.96);
}

.seg__item.is-on {
  color: #04120f;
  background: linear-gradient(150deg, var(--c-accent) 0%, var(--c-accent-deep) 100%);
  border-color: var(--c-accent);
  box-shadow: 0 6px 18px var(--c-accent-glow);
}

.seg__item:disabled {
  opacity: 0.45;
}

.seg__badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.85;
}
</style>
