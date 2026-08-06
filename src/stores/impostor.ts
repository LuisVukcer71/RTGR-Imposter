import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { IMPOSTOR } from '@shared/config'
import {
  assignRoles,
  drawTerm,
  fellowImpostors,
  validateImpostorConfig,
  type ConfigProblem,
} from '@shared/impostor'
import type { ImpostorConfig, ImpostorRound, TermPool } from '@shared/types'
import { analytics } from '@/services/analytics'
import { haptics } from '@/services/haptics'
import { http } from '@/services/http'
import { randomId } from '@/services/identity'
import { storage, StorageKeys } from '@/services/storage'
import {
  cachedOrBundledPool,
  countTermsInCategories,
  loadTermPool,
  markTermUsed,
  resetUsedTerms,
  usedTermIds,
} from '@/services/termPool'

const emptyConfig: ImpostorConfig = {
  playerNames: ['', '', ''],
  // -1 statt eines stillen Standardwerts: die Anzahl muss aktiv gewählt werden.
  impostorCount: -1,
  impostorsKnowEachOther: false,
  categories: [],
  hintsEnabled: true,
  timerEnabled: false,
  timerSeconds: null,
}

export const useImpostorStore = defineStore('impostor', () => {
  const pool = ref<TermPool>(cachedOrBundledPool())
  const poolLoading = ref(false)
  const usingOfflinePool = ref(pool.value.source === 'bundled')

  const config = ref<ImpostorConfig>({
    ...emptyConfig,
    ...storage.get<Partial<ImpostorConfig>>(StorageKeys.impostorConfig, {}),
  })
  const round = ref<ImpostorRound | null>(
    storage.get<ImpostorRound | null>(StorageKeys.impostorRound, null),
  )
  const lastPoolExhausted = ref(false)

  /* ----------------------------- Ableitungen ---------------------------- */

  const problems = computed<ConfigProblem[]>(() => validateImpostorConfig(config.value))
  const canStart = computed(() => problems.value.length === 0 && availableTerms.value > 0)
  const availableTerms = computed(() => countTermsInCategories(pool.value, config.value.categories))

  const currentPlayerIndex = computed(() => round.value?.revealCursor ?? 0)
  const currentAssignment = computed(() =>
    round.value ? (round.value.assignments[currentPlayerIndex.value] ?? null) : null,
  )
  const allRevealed = computed(
    () => !!round.value && round.value.revealCursor >= round.value.assignments.length,
  )
  const impostorNames = computed(() =>
    (round.value?.assignments ?? []).filter((a) => a.role === 'impostor').map((a) => a.playerName),
  )

  /** Die Mitimpostor des aktuellen Spielers – nur wenn die Option aktiv ist. */
  const currentFellows = computed(() => {
    if (!round.value?.config.impostorsKnowEachOther) return []
    return fellowImpostors(round.value.assignments, currentPlayerIndex.value)
  })

  /* ----------------------------- Persistenz ----------------------------- */

  watch(config, (value) => storage.set(StorageKeys.impostorConfig, value), { deep: true })
  watch(
    round,
    (value) => {
      if (value) storage.set(StorageKeys.impostorRound, value)
      else storage.remove(StorageKeys.impostorRound)
    },
    { deep: true },
  )

  /* ------------------------------- Aktionen ----------------------------- */

  async function ensurePool(): Promise<void> {
    if (poolLoading.value) return
    poolLoading.value = true
    try {
      const result = await loadTermPool()
      pool.value = result.pool
      usingOfflinePool.value = result.usedFallback
    } finally {
      poolLoading.value = false
    }
  }

  function setPlayerCount(count: number): void {
    const names = config.value.playerNames.slice(0, count)
    while (names.length < count) names.push('')
    config.value.playerNames = names
    // Eine bisher gültige Impostor-Anzahl kann durch weniger Spieler ungültig werden.
    if (config.value.impostorCount > Math.floor(count / IMPOSTOR.playersPerImpostor)) {
      config.value.impostorCount = -1
    }
  }

  function resetConfig(): void {
    config.value = { ...emptyConfig, playerNames: ['', '', ''] }
  }

  /** Zieht Begriff und Rollen neu; Spieler und Einstellungen bleiben erhalten. */
  function createRound(): boolean {
    const names = config.value.playerNames.map((name) => name.trim())
    const draw = drawTerm({
      pool: pool.value.terms,
      categories: config.value.categories,
      usedTermIds: usedTermIds(),
    })
    if (!draw.term) return false

    if (draw.poolExhausted) resetUsedTerms()
    lastPoolExhausted.value = draw.poolExhausted
    markTermUsed(draw.term.id)

    round.value = {
      id: randomId(8),
      createdAt: Date.now(),
      config: { ...config.value, playerNames: names },
      term: draw.term,
      assignments: assignRoles(names, config.value.impostorCount),
      revealCursor: 0,
      phase: 'reveal',
      startPlayerIndex: null,
      timerEndsAt: null,
      timerAlarmActive: false,
      poolSource: pool.value.source,
    }

    analytics.track('impostor_round_started', {
      mode: 'impostor',
      playerCount: names.length,
      impostorCount: config.value.impostorCount,
      categories: config.value.categories,
      hintsEnabled: config.value.hintsEnabled,
      timerEnabled: config.value.timerEnabled,
      online: pool.value.source === 'server',
    })
    analytics.track('impostor_term_drawn', { termId: draw.term.id })
    // Ziehungen für „Ziehungen pro Wort“ melden; Fehler sind hier belanglos.
    void http.post('/terms/draws', { termIds: [draw.term.id] }).catch(() => undefined)

    return true
  }

  function confirmReveal(): void {
    if (!round.value) return
    round.value.revealCursor += 1
    if (round.value.revealCursor >= round.value.assignments.length) {
      round.value.phase = 'ready'
    }
  }

  function beginRound(): void {
    if (!round.value) return
    round.value.startPlayerIndex = Math.floor(Math.random() * round.value.assignments.length)
    round.value.phase = 'announcing'
  }

  /** Wird nach der Startspieler-Anzeige aufgerufen; erst jetzt läuft der Timer. */
  function enterPlayingPhase(): void {
    if (!round.value) return
    round.value.phase = 'playing'
    const seconds = round.value.config.timerEnabled ? round.value.config.timerSeconds : null
    round.value.timerEndsAt = seconds ? Date.now() + seconds * 1000 : null
    round.value.timerAlarmActive = false
  }

  function triggerAlarm(): void {
    if (!round.value || round.value.timerAlarmActive) return
    round.value.timerAlarmActive = true
    haptics.play('alarm')
  }

  function stopAlarm(): void {
    if (!round.value) return
    round.value.timerAlarmActive = false
    round.value.timerEndsAt = null
    haptics.stop()
  }

  function revealImpostors(): void {
    if (!round.value) return
    round.value.timerAlarmActive = false
    round.value.phase = 'revealed'
    haptics.play('warning')
    analytics.track('impostor_round_completed', { mode: 'impostor' })
  }

  /** Bewusstes Verlassen: der Begriff gilt trotzdem als verbraucht. */
  function abandonRound(): void {
    if (round.value && round.value.phase !== 'revealed') {
      analytics.track('impostor_setup_abandoned', { mode: 'impostor' })
    }
    round.value = null
    haptics.stop()
  }

  function clearUsedTerms(): void {
    resetUsedTerms()
    lastPoolExhausted.value = false
  }

  return {
    pool,
    poolLoading,
    usingOfflinePool,
    config,
    round,
    problems,
    canStart,
    availableTerms,
    currentPlayerIndex,
    currentAssignment,
    currentFellows,
    allRevealed,
    impostorNames,
    lastPoolExhausted,
    ensurePool,
    setPlayerCount,
    resetConfig,
    createRound,
    confirmReveal,
    beginRound,
    enterPlayingPhase,
    triggerAlarm,
    stopAlarm,
    revealImpostors,
    abandonRound,
    clearUsedTerms,
  }
})
