<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SpySilhouette from '@/components/art/SpySilhouette.vue'
import AppButton from '@/components/ui/AppButton.vue'
import StatusNote from '@/components/ui/StatusNote.vue'
import { t } from '@/i18n'
import { useImpostorStore } from '@/stores/impostor'

/**
 * Auflösung: kurze, dramatische Enthüllung der Impostor – danach die drei
 * Anschlussoptionen aus dem Auftrag.
 */
const store = useImpostorStore()
const router = useRouter()

const round = computed(() => store.round)
const names = computed(() => store.impostorNames)

onMounted(() => {
  if (!round.value) void router.replace({ name: 'impostor-setup' })
})

function again() {
  if (store.createRound()) void router.replace({ name: 'impostor-reveal' })
}

function changeSettings() {
  store.abandonRound()
  void router.replace({ name: 'impostor-setup' })
}

function home() {
  store.abandonRound()
  void router.replace({ name: 'home' })
}
</script>

<template>
  <main v-if="round" class="page result">
    <div class="result__art" aria-hidden="true"><SpySilhouette /></div>

    <p class="result__label">
      {{ names.length > 1 ? t('impostor.result.wereImpostors') : t('impostor.result.wasImpostor') }}
    </p>

    <ul class="result__names">
      <li
        v-for="(name, index) in names"
        :key="name"
        class="result__name"
        :style="{ animationDelay: `${index * 140}ms` }"
      >
        {{ name }}
      </li>
    </ul>

    <div class="result__term">
      <p class="result__termLabel">{{ t('impostor.result.term') }}</p>
      <p class="result__termValue">{{ round.term.displayTerm }}</p>
      <p v-if="round.config.hintsEnabled" class="result__hint">
        {{ t('impostor.result.hint') }}: {{ round.term.hintTerm }}
      </p>
    </div>

    <StatusNote v-if="store.lastPoolExhausted" tone="info" icon="refresh">
      {{ t('impostor.result.poolExhausted') }}
    </StatusNote>

    <div class="result__actions">
      <AppButton size="lg" block @click="again">{{ t('impostor.result.again') }}</AppButton>
      <AppButton variant="secondary" block @click="changeSettings">
        {{ t('impostor.result.settings') }}
      </AppButton>
      <AppButton variant="ghost" block @click="home">{{ t('impostor.result.home') }}</AppButton>
    </div>
  </main>
</template>

<style scoped>
.result {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.result__art {
  width: 116px;
  height: 116px;
  opacity: 0.9;
  animation: rise var(--t-slow) var(--e-out);
}

.result__label {
  font-size: var(--fs-sm);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-text-dim);
}

.result__names {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.result__name {
  font-size: var(--fs-3xl);
  font-weight: 900;
  color: #ff5b4f;
  text-shadow: 0 0 30px var(--c-danger-glow);
  overflow-wrap: anywhere;
  animation: slam var(--t-slow) var(--e-spring) both;
}

.result__term {
  width: 100%;
  padding: var(--s-4);
  background: var(--c-surface);
  border: 1px solid var(--c-line);
  border-radius: var(--r-lg);
}

.result__termLabel {
  font-size: var(--fs-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--c-text-dim);
}

.result__termValue {
  font-size: var(--fs-xl);
  font-weight: 700;
  overflow-wrap: anywhere;
}

.result__hint {
  margin-top: var(--s-1);
  font-size: var(--fs-sm);
  color: var(--c-text-muted);
}

.result__actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  margin-top: var(--s-2);
}

@keyframes slam {
  from {
    opacity: 0;
    transform: scale(1.45);
    filter: blur(6px);
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}
</style>
