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
    router.push({ name: 'round' })
  } else {
    stage.value = 'handoff'
  }
}
</script>

<template>
  <ScreenLayout v-if="currentPlayer && state.round">
    <ProgressDots :total="state.players.length" :current="state.revealIndex" />

    <HandoffCard
      v-if="stage === 'handoff'"
      eyebrow="Gerät weitergeben an"
      :player-name="currentPlayer.name"
      hint="Alle anderen dürfen jetzt nicht auf den Bildschirm schauen."
      button-label="Ich bin bereit"
      @confirm="confirmReady"
    />

    <RoleCard
      v-else
      :is-imposter="currentRole?.isImposter ?? false"
      :category-name="state.round.categoryName"
      :word="state.round.word"
      @continue="continueToNext"
    />
  </ScreenLayout>
</template>
