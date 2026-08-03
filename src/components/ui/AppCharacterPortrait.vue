<script setup lang="ts">
import { ref, watch } from 'vue'
import AppAvatar from './AppAvatar.vue'

const props = withDefaults(
  defineProps<{
    name: string
    characterSrc?: string
    accentColor?: string
    size?: 'lg' | 'xl'
    role?: 'neutral' | 'crew' | 'imposter'
  }>(),
  {
    characterSrc: undefined,
    accentColor: 'var(--color-blue)',
    size: 'lg',
    role: 'neutral',
  },
)

type LoadState = 'loading' | 'loaded' | 'error'
const loadState = ref<LoadState>(props.characterSrc ? 'loading' : 'error')

watch(
  () => props.characterSrc,
  (src) => {
    loadState.value = src ? 'loading' : 'error'
  },
)

function onLoad() {
  loadState.value = 'loaded'
}

function onError() {
  loadState.value = 'error'
}
</script>

<template>
  <div class="portrait" :class="[`portrait--${size}`, `portrait--role-${role}`]">
    <div class="portrait__stage">
      <img
        v-if="characterSrc"
        v-show="loadState === 'loaded'"
        :src="characterSrc"
        :alt="name"
        class="portrait__image"
        @load="onLoad"
        @error="onError"
      />
      <div v-if="loadState === 'loading'" class="portrait__skeleton" aria-hidden="true" />
      <div v-if="loadState === 'error'" class="portrait__fallback">
        <AppAvatar :name="name" :accent-color="accentColor" size="xl" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.portrait {
  width: var(--portrait-size);
}

.portrait--lg {
  --portrait-size: 160px;
}

.portrait--xl {
  --portrait-size: 220px;
}

.portrait__stage {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    var(--glass-shadow-ambient),
    0 0 32px 4px var(--color-blue-glow);
}

.portrait--role-crew .portrait__stage {
  box-shadow:
    var(--glass-shadow-ambient),
    0 0 40px 6px var(--color-green-glow);
}

.portrait--role-imposter .portrait__stage {
  box-shadow:
    var(--glass-shadow-ambient),
    0 0 40px 6px var(--color-red-glow);
}

/* Farbstich passend zur Rolle, gemischt über das Bild - neutral bleibt unsichtbar (transparent) */
.portrait__stage::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, transparent 35%, var(--portrait-tint, transparent) 100%);
  mix-blend-mode: overlay;
}

.portrait--role-crew .portrait__stage {
  --portrait-tint: var(--color-green-alpha);
}

.portrait--role-imposter .portrait__stage {
  --portrait-tint: var(--color-red-alpha);
}

.portrait__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /*
   * Verlaufsmaske am unteren Rand: fängt harte Kanten ab, falls das
   * gelieferte Bild kein echtes Alpha-Cutout ist (z.B. schwarzer statt
   * transparenter Hintergrund) - blendet stattdessen weich in die Karte.
   */
  -webkit-mask-image: linear-gradient(to bottom, black 78%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 78%, transparent 100%);
}

.portrait__skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, var(--glass-bg) 30%, var(--glass-bg-strong) 50%, var(--glass-bg) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

.portrait__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Mindest-Absicherung Querformat: verhindert übermäßiges Scrollen auf kurzen Viewports */
@media (orientation: landscape) and (max-height: 500px) {
  .portrait--lg {
    --portrait-size: 110px;
  }

  .portrait--xl {
    --portrait-size: 140px;
  }
}
</style>
