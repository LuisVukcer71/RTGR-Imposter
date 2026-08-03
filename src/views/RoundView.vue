<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ScreenLayout from '@/components/ui/ScreenLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useGameState } from '@/composables/useGameState'

const router = useRouter()
const { state, goToResolution } = useGameState()

const DEFAULT_SECONDS = 5 * 60
const LOW_TIME_THRESHOLD = 30
const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const secondsLeft = ref(DEFAULT_SECONDS)
const timerRunning = ref(false)
let intervalId: ReturnType<typeof setInterval> | undefined

const minutes = () => Math.floor(secondsLeft.value / 60)
const seconds = () => secondsLeft.value % 60

const progress = computed(() => secondsLeft.value / DEFAULT_SECONDS)
const dashOffset = computed(() => RING_CIRCUMFERENCE * (1 - progress.value))
const isLowTime = computed(() => secondsLeft.value > 0 && secondsLeft.value <= LOW_TIME_THRESHOLD)

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
  router.push({ name: 'impostor-resolution' })
}
</script>

<template>
  <ScreenLayout v-if="state.round">
    <header class="header">
      <h1 class="title">Diskutiert!</h1>
      <p class="subtitle">
        Kategorie: <strong class="subtitle__highlight">{{ state.round.categoryName }}</strong> — findet heraus, wer
        den Begriff nicht kennt.
      </p>
    </header>

    <AppCard tone="info" class="timer-card">
      <div class="timer-ring" :class="{ 'timer-ring--warning': isLowTime }">
        <svg class="timer-ring__svg" viewBox="0 0 120 120">
          <circle class="timer-ring__track" cx="60" cy="60" r="52" />
          <circle
            class="timer-ring__progress"
            cx="60"
            cy="60"
            r="52"
            :style="{
              strokeDasharray: RING_CIRCUMFERENCE,
              strokeDashoffset: dashOffset,
            }"
          />
        </svg>
        <div class="timer-ring__label">
          <span class="timer-ring__time">{{ String(minutes()).padStart(2, '0') }}:{{
            String(seconds()).padStart(2, '0')
          }}</span>
        </div>
      </div>

      <div class="timer__actions">
        <AppButton variant="secondary" @click="toggleTimer">{{ timerRunning ? 'Pause' : 'Start' }}</AppButton>
        <AppButton variant="ghost" @click="resetTimer">Zurücksetzen</AppButton>
      </div>
    </AppCard>

    <div class="cta">
      <AppButton @click="toResolution">Zur Auflösung</AppButton>
    </div>
  </ScreenLayout>
</template>

<style scoped>
.header {
  text-align: center;
  animation: slide-up-fade var(--duration-base) var(--ease-standard) both;
}

.title {
  margin: 0;
  font-size: 2rem;
  color: var(--color-blue);
}

.subtitle {
  color: var(--color-text-muted);
  margin: var(--space-2) 0 0;
}

.subtitle__highlight {
  color: var(--color-text);
}

.timer-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  animation: slide-up-fade var(--duration-base) var(--ease-standard) 100ms both;
}

.timer-ring {
  position: relative;
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-ring__svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-ring__track {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 10;
}

.timer-ring__progress {
  fill: none;
  stroke: var(--color-blue);
  stroke-width: 10;
  stroke-linecap: round;
  transition:
    stroke-dashoffset 1s linear,
    stroke var(--duration-base) ease;
}

.timer-ring--warning .timer-ring__progress {
  stroke: var(--color-red);
}

.timer-ring--warning {
  --pulse-color: var(--color-red-glow);
  animation: pulse-glow 1.1s ease-in-out infinite;
  border-radius: 50%;
}

.timer-ring__label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-ring__time {
  font-size: 2.2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
}

.timer-ring--warning .timer-ring__time {
  color: var(--color-red-light);
}

.timer__actions {
  display: flex;
  gap: var(--space-3);
  width: 100%;
}

.cta {
  animation: slide-up-fade var(--duration-base) var(--ease-standard) 200ms both;
}

/* Mindest-Absicherung Querformat: kleinerer Ring braucht weniger vertikalen Platz */
@media (orientation: landscape) and (max-height: 500px) {
  .timer-ring {
    width: 150px;
    height: 150px;
  }
}
</style>
