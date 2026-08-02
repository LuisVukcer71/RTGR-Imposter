<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isImposter: boolean
  categoryName: string
  word: string
}>()

const emit = defineEmits<{ continue: [] }>()

const flipped = ref(false)

function flip() {
  flipped.value = true
}
</script>

<template>
  <div class="role">
    <button v-if="!flipped" type="button" class="role__card role__card--back" @click="flip">
      <span class="role__back-symbol">?</span>
      <span class="role__back-label">Tippen zum Aufdecken</span>
    </button>

    <div v-else class="role__card role__card--front" :class="{ 'role__card--imposter': props.isImposter }">
      <template v-if="props.isImposter">
        <p class="role__eyebrow">Achtung</p>
        <h2 class="role__imposter-title">Du bist der Impostor</h2>
        <p class="role__hint">Du kennst das Wort nicht. Hör gut zu und tu so, als wüsstest du es.</p>
      </template>
      <template v-else>
        <p class="role__eyebrow">{{ categoryName }}</p>
        <h2 class="role__word">{{ word }}</h2>
        <p class="role__hint">Merk dir das Wort, sag es aber nicht laut.</p>
      </template>
    </div>

    <button v-if="flipped" type="button" class="role__continue" @click="emit('continue')">Weiter geben</button>
  </div>
</template>

<style scoped>
.role {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.role__card {
  width: 100%;
  min-height: 280px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-2);
  padding: var(--space-5);
  border: none;
  cursor: pointer;
}

.role__card--back {
  background: var(--color-surface);
  border: 2px dashed var(--color-border);
  color: var(--color-text-muted);
}

.role__back-symbol {
  font-size: 3.5rem;
  color: var(--color-accent);
}

.role__back-label {
  font-size: 0.95rem;
}

.role__card--front {
  background: var(--color-bg-elevated);
  cursor: default;
  box-shadow: var(--shadow-card);
}

.role__card--imposter {
  background: linear-gradient(160deg, var(--color-bg-elevated), #3a1f2b);
}

.role__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  color: var(--color-accent);
}

.role__word {
  margin: 0;
  font-size: 2.2rem;
}

.role__imposter-title {
  margin: 0;
  font-size: 1.8rem;
  color: var(--color-danger);
}

.role__hint {
  margin: 0;
  color: var(--color-text-muted);
  max-width: 32ch;
}

.role__continue {
  width: 100%;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  padding: var(--space-3) var(--space-5);
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
