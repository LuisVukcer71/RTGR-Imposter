import { computed, reactive, readonly } from 'vue'
import { pickCategoryAndWord } from './useWordSelection'
import type { ActiveRound, GamePhase, GameSettings, Player } from '@/types/game'

interface GameState {
  phase: GamePhase
  players: Player[]
  settings: GameSettings
  round: ActiveRound | null
  revealIndex: number
}

const state = reactive<GameState>({
  phase: 'idle',
  players: [],
  settings: {
    playerCount: 4,
    imposterCount: 1,
    categoryNames: [],
  },
  round: null,
  revealIndex: 0,
})

function shuffled<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

function configureGame(players: Player[], settings: GameSettings) {
  state.players = players
  state.settings = settings
}

function startGame() {
  const { categoryName, word, hint } = pickCategoryAndWord(state.settings.categoryNames)

  const imposterCount = Math.min(state.settings.imposterCount, Math.max(state.players.length - 1, 0))
  const shuffledPlayerIds = shuffled(state.players.map((p) => p.id))
  const imposterIds = new Set(shuffledPlayerIds.slice(0, imposterCount))

  state.round = {
    categoryName,
    word,
    hint,
    roles: state.players.map((p) => ({ playerId: p.id, isImposter: imposterIds.has(p.id) })),
  }
  state.revealIndex = 0
  state.phase = 'reveal'
}

function nextReveal() {
  if (state.revealIndex < state.players.length - 1) {
    state.revealIndex += 1
  } else {
    state.phase = 'round'
  }
}

function goToResolution() {
  state.phase = 'resolution'
}

/** Neue Runde mit denselben Spielern/Einstellungen. */
function playAgain() {
  startGame()
}

/** Komplett zurück zum Setup. */
function resetGame() {
  state.phase = 'idle'
  state.players = []
  state.round = null
  state.revealIndex = 0
}

const currentPlayer = computed<Player | undefined>(() => state.players[state.revealIndex])

const currentRole = computed(() => {
  if (!state.round || !currentPlayer.value) return undefined
  return state.round.roles.find((r) => r.playerId === currentPlayer.value!.id)
})

const imposters = computed<Player[]>(() => {
  if (!state.round) return []
  const imposterIds = new Set(state.round.roles.filter((r) => r.isImposter).map((r) => r.playerId))
  return state.players.filter((p) => imposterIds.has(p.id))
})

export function useGameState() {
  return {
    state: readonly(state),
    currentPlayer,
    currentRole,
    imposters,
    configureGame,
    startGame,
    nextReveal,
    goToResolution,
    playAgain,
    resetGame,
  }
}
