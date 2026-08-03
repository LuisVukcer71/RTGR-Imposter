<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ScreenLayout from '@/components/ui/ScreenLayout.vue'
import ProgressDots from '@/components/ui/ProgressDots.vue'
import HandoffCard from '@/components/reveal/HandoffCard.vue'
import RoleCard from '@/components/reveal/RoleCard.vue'
import { useGameState } from '@/composables/useGameState'

const router = useRouter()
const { state, currentPlayer, currentRole, nextReveal } = useGameState()

type Stage = 'handoff' | 'card'
const stage = ref<Stage>('handoff')

function confirmReady() {
  stage.value = 'card'
}

function continueToNext() {
  nextReveal()
  if (state.phase === 'round') {
    router.push({ name: 'impostor-round' })
  } else {
    stage.value = 'handoff'
  }
}
</script>

<template>
  <ScreenLayout v-if="currentPlayer && state.round">
    <div class="dots-wrap">
      <ProgressDots :total="state.players.length" :current="state.revealIndex" />
    </div>

    <Transition name="stage-swap" mode="out-in">
      <HandoffCard
        v-if="stage === 'handoff'"
        key="handoff"
        eyebrow="Gerät weitergeben an"
        :player-name="currentPlayer.name"
        :character-src="currentPlayer.characterSrc"
        :accent-color="currentPlayer.accentColor"
        hint="Alle anderen dürfen jetzt nicht auf den Bildschirm schauen."
        button-label="Ich bin bereit"
        @confirm="confirmReady"
      />

      <RoleCard
        v-else
        key="card"
        :is-imposter="currentRole?.isImposter ?? false"
        :category-name="state.round.categoryName"
        :word="state.round.word"
        :player-name="currentPlayer.name"
        :avatar-src="currentPlayer.avatarSrc"
        :character-src="currentPlayer.characterSrc"
        :accent-color="currentPlayer.accentColor"
        @continue="continueToNext"
      />
    </Transition>
  </ScreenLayout>
</template>

<style scoped>
.dots-wrap {
  animation: fade-in var(--duration-base) ease both;
}

.stage-swap-enter-active,
.stage-swap-leave-active {
  transition: opacity var(--duration-base) ease;
}

.stage-swap-enter-from,
.stage-swap-leave-to {
  opacity: 0;
}
</style>
