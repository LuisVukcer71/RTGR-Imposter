<script setup lang="ts">
import { ref } from 'vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppCharacterPortrait from '@/components/ui/AppCharacterPortrait.vue'

const props = defineProps<{
  isImposter: boolean
  categoryName: string
  word: string
  hint: string
  playerName: string
  avatarSrc?: string
  characterSrc?: string
  accentColor?: string
}>()

const emit = defineEmits<{ continue: [] }>()

const flipped = ref(false)

function flip() {
  if (flipped.value) return
  flipped.value = true
}
</script>

<template>
  <div class="role">
    <div
      class="role-flip"
      :class="{ 'role-flip--flipped': flipped }"
      role="button"
      tabindex="0"
      :aria-pressed="flipped"
      aria-label="Rolle aufdecken"
      @click="flip"
      @keydown.enter="flip"
      @keydown.space.prevent="flip"
    >
      <div class="role-flip__inner">
        <div class="role-flip__face role-flip__face--back glass-surface">
          <AppAvatar :name="playerName" :avatar-src="avatarSrc" :accent-color="accentColor" size="md" />
          <span class="role-flip__symbol">?</span>
          <span class="role-flip__back-label">Tippen zum Aufdecken</span>
        </div>

        <div
          class="role-flip__face role-flip__face--front glass-surface"
          :class="props.isImposter ? 'role-flip__face--danger' : 'role-flip__face--success'"
        >
          <AppCharacterPortrait
            :name="playerName"
            :character-src="characterSrc"
            :accent-color="accentColor"
            size="lg"
            :role="props.isImposter ? 'imposter' : 'crew'"
          />

          <template v-if="props.isImposter">
            <p class="role-flip__eyebrow role-flip__eyebrow--danger">Achtung</p>
            <h2 class="role-flip__imposter-title">Du bist der Impostor</h2>
            <div class="role-flip__hint-box">
              <p class="role-flip__hint-label">Hinweis</p>
              <p class="role-flip__hint-text">{{ hint }}</p>
            </div>
            <p class="role-flip__hint">Nutze den Hinweis, um mitzureden - ohne das Wort zu verraten.</p>
          </template>
          <template v-else>
            <p class="role-flip__eyebrow role-flip__eyebrow--success">{{ categoryName }}</p>
            <h2 class="role-flip__word">{{ word }}</h2>
            <p class="role-flip__hint">Merk dir das Wort, sag es aber nicht laut.</p>
          </template>
        </div>
      </div>
    </div>

    <Transition name="fade-slide-up">
      <button
        v-if="flipped"
        type="button"
        class="role__continue glass-surface glass-surface--interactive"
        @click="emit('continue')"
      >
        Weiter geben
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.role {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  animation: scale-in var(--duration-base) var(--ease-standard) both;
}

.role-flip {
  width: 100%;
  min-height: 480px;
  perspective: 1400px;
  cursor: pointer;
}

.role-flip--flipped {
  cursor: default;
}

.role-flip:focus-visible .role-flip__inner {
  outline: 2px solid var(--color-blue-light);
  outline-offset: 6px;
  border-radius: var(--radius-lg);
}

.role-flip__inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 480px;
  transform-style: preserve-3d;
  transition: transform var(--duration-slow) var(--ease-emphasized);
}

.role-flip--flipped .role-flip__inner {
  transform: rotateY(180deg);
}

.role-flip__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-2);
  padding: var(--space-5);
  overflow-y: auto;
}

.role-flip__face--back {
  color: var(--color-text-muted);
  --pulse-color: var(--color-blue-glow);
  animation: pulse-glow 2.4s ease-in-out infinite;
}

.role-flip__symbol {
  font-size: 2.6rem;
  color: var(--color-blue);
  margin-top: var(--space-2);
}

.role-flip__back-label {
  font-size: 0.95rem;
}

.role-flip__face--front {
  transform: rotateY(180deg);
}

.role-flip__face.role-flip__face--success {
  box-shadow:
    var(--glass-shadow-ambient),
    var(--glass-shadow-contact),
    0 0 0 1px var(--color-green-alpha),
    0 0 40px 6px var(--color-green-glow);
}

.role-flip__face.role-flip__face--danger {
  box-shadow:
    var(--glass-shadow-ambient),
    var(--glass-shadow-contact),
    0 0 0 1px var(--color-red-alpha),
    0 0 40px 6px var(--color-red-glow);
}

.role-flip__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
}

.role-flip__eyebrow--success {
  color: var(--color-green-light);
}

.role-flip__eyebrow--danger {
  color: var(--color-red-light);
}

.role-flip__word {
  margin: 0;
  font-size: 2.2rem;
  color: var(--color-text);
}

.role-flip__imposter-title {
  margin: 0;
  font-size: 1.8rem;
  color: var(--color-red-light);
}

.role-flip__hint-box {
  border: 1px dashed var(--color-red-alpha);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--glass-bg);
  max-width: 30ch;
}

.role-flip__hint-label {
  margin: 0 0 var(--space-1);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.75rem;
  color: var(--color-red-light);
}

.role-flip__hint-text {
  margin: 0;
  font-style: italic;
  color: var(--color-text);
  font-size: 1rem;
}

.role-flip__hint {
  margin: 0;
  color: var(--color-text-muted);
  max-width: 32ch;
}

.role__continue {
  width: 100%;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-5);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
  cursor: pointer;
  background:
    linear-gradient(135deg, var(--color-blue-alpha), transparent 65%),
    var(--glass-bg-strong);
  box-shadow:
    var(--glass-shadow-ambient),
    var(--glass-shadow-contact),
    0 0 24px 2px var(--color-blue-glow);
}

.fade-slide-up-enter-active {
  transition:
    opacity var(--duration-base) ease,
    transform var(--duration-base) var(--ease-standard);
}

.fade-slide-up-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

.fade-slide-up-leave-active {
  transition: opacity var(--duration-fast) ease;
}

.fade-slide-up-leave-to {
  opacity: 0;
}

/* Mindest-Absicherung Querformat: verhindert übermäßiges Scrollen auf kurzen Viewports */
@media (orientation: landscape) and (max-height: 500px) {
  .role-flip,
  .role-flip__inner {
    min-height: 260px;
  }
}
</style>
