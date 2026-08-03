<script setup lang="ts">
import AppCharacterPortrait from '@/components/ui/AppCharacterPortrait.vue'
import AppButton from '@/components/ui/AppButton.vue'

defineProps<{
  eyebrow: string
  playerName: string
  characterSrc?: string
  accentColor?: string
  hint: string
  buttonLabel: string
}>()

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <div class="handoff">
    <p class="handoff__eyebrow">{{ eyebrow }}</p>

    <div class="handoff__portrait">
      <AppCharacterPortrait :name="playerName" :character-src="characterSrc" :accent-color="accentColor" size="xl" />
    </div>

    <h2 class="handoff__name">{{ playerName }}</h2>
    <p class="handoff__hint">{{ hint }}</p>

    <div class="handoff__cta">
      <AppButton @click="emit('confirm')">{{ buttonLabel }}</AppButton>
    </div>
  </div>
</template>

<style scoped>
.handoff {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-4);
}

.handoff__eyebrow {
  margin: 0;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  animation: slide-up-fade var(--duration-base) var(--ease-standard) both;
}

.handoff__portrait {
  margin: var(--space-2) 0;
  animation: scale-in var(--duration-slow) var(--ease-spring) 60ms both;
}

.handoff__name {
  margin: 0;
  font-size: 2rem;
  color: var(--color-text);
  animation: slide-up-fade var(--duration-base) var(--ease-standard) 120ms both;
}

.handoff__hint {
  margin: 0;
  color: var(--color-text-muted);
  max-width: 30ch;
  animation: slide-up-fade var(--duration-base) var(--ease-standard) 180ms both;
}

.handoff__cta {
  width: 100%;
  margin-top: var(--space-3);
  animation: scale-in var(--duration-base) var(--ease-standard) 240ms both;
}
</style>
