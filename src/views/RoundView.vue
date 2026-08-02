<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ScreenLayout from '@/components/ui/ScreenLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useGameState } from '@/composables/useGameState'

const router = useRouter()
const { state, goToResolution } = useGameState()

const DEFAULT_SECONDS = 5 * 60
const secondsLeft = ref(DEFAULT_SECONDS)
const timerRunning = ref(false)
let intervalId: ReturnType<typeof setInterval> | undefined

const minutes = () => Math.floor(secondsLeft.value / 60)
const seconds = () => secondsLeft.value % 60

function toggleTimer() {
  if (timerRunning.value) {
    clearInterval(intervalId)
    timerRunning.value = false
    return
  }
  timerRunning.value = true
  intervalId = setInterval(() => {
    if (secondsLeft.value > 0) {
      secondsLeft.value -= 1
    } else {
      clearInterval(intervalId)
      timerRunning.value = false
    }
  }, 1000)
}

function resetTimer() {
  clearInterval(intervalId)
  timerRunning.value = false
  secondsLeft.value = DEFAULT_SECONDS
}

onUnmounted(() => clearInterval(intervalId))

function toResolution() {
  clearInterval(intervalId)
  goToResolution()
  router.push({ name: 'resolution' })
}
</script>

<template>
  <ScreenLayout v-if="state.round">
    <header class="header">
      <h1 class="title">Diskutiert!</h1>
      <p class="subtitle">
        Kategorie: <strong>{{ state.round.categoryName }}</strong> — findet heraus, wer den Begriff nicht kennt.
      </p>
    </header>

    <AppCard class="timer">
      <p class="timer__display">{{ String(minutes()).padStart(2, '0') }}:{{ String(seconds()).padStart(2, '0') }}</p>
      <div class="timer__actions">
        <AppButton variant="secondary" @click="toggleTimer">{{ timerRunning ? 'Pause' : 'Start' }}</AppButton>
        <AppButton variant="ghost" @click="resetTimer">Zurücksetzen</AppButton>
      </div>
    </AppCard>

    <AppButton @click="toResolution">Zur Auflösung</AppButton>
  </ScreenLayout>
</template>

<style scoped>
.header {
  text-align: center;
}

.title {
  margin: 0;
  font-size: 2rem;
  color: var(--color-accent);
}

.subtitle {
  color: var(--color-text-muted);
  margin: var(--space-2) 0 0;
}

.timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.timer__display {
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.timer__actions {
  display: flex;
  gap: var(--space-3);
  width: 100%;
}
</style>
