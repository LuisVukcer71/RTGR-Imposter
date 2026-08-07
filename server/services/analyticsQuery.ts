import type { AnalyticsSummary } from '../../src/shared/types.js'
import { getStore } from '../store/index.js'

/**
 * Aggregiert die Rohereignisse zu den Kennzahlen des Dashboards.
 *
 * Bewusste Begriffswahl: gezählt werden **Geräte**, **Sitzungen**, **Räume**
 * und **Runden** – ohne Accounts lässt sich nicht behaupten, Menschen zu messen.
 */
export async function summarize(from: string, to: string): Promise<AnalyticsSummary> {
  const store = getStore()
  const events = await store.analytics.query(from, to)

  const devices = new Set<string>()
  const sessions = new Set<string>()
  const roundsBySession = new Map<string, number>()
  const categoryUsage = new Map<string, number>()

  let gameParticipations = 0
  let impostorRoundsStarted = 0
  let impostorRoundsCompleted = 0
  let impostorSetupOpened = 0
  let impostorSetupAbandoned = 0
  let impostorOnline = 0
  let impostorOffline = 0
  let whoAmIRoomsCreated = 0
  let whoAmIRoundsStarted = 0
  let suggestions = 0
  let impostorOpens = 0
  let whoAmIOpens = 0
  let playerCountSum = 0
  let playerCountSamples = 0

  for (const event of events) {
    devices.add(event.deviceHash)
    sessions.add(event.sessionHash)
    const payload = event.payload as {
      mode?: string
      playerCount?: number
      categories?: string[]
      online?: boolean
    }

    switch (event.name) {
      case 'game_opened':
        gameParticipations++
        if (payload.mode === 'impostor') impostorOpens++
        if (payload.mode === 'whoami') whoAmIOpens++
        break
      case 'impostor_setup_opened':
        impostorSetupOpened++
        impostorOpens++
        break
      case 'impostor_setup_abandoned':
        impostorSetupAbandoned++
        break
      case 'impostor_round_started':
        impostorRoundsStarted++
        roundsBySession.set(event.sessionHash, (roundsBySession.get(event.sessionHash) ?? 0) + 1)
        if (typeof payload.playerCount === 'number') {
          playerCountSum += payload.playerCount
          playerCountSamples++
        }
        for (const category of payload.categories ?? []) {
          categoryUsage.set(category, (categoryUsage.get(category) ?? 0) + 1)
        }
        if (payload.online === true) impostorOnline++
        if (payload.online === false) impostorOffline++
        break
      case 'impostor_round_completed':
        impostorRoundsCompleted++
        break
      case 'whoami_room_created':
        whoAmIRoomsCreated++
        whoAmIOpens++
        break
      case 'whoami_room_joined':
        whoAmIOpens++
        break
      case 'whoami_round_started':
        whoAmIRoundsStarted++
        roundsBySession.set(event.sessionHash, (roundsBySession.get(event.sessionHash) ?? 0) + 1)
        if (typeof payload.playerCount === 'number') {
          playerCountSum += payload.playerCount
          playerCountSamples++
        }
        break
      case 'suggestion_submitted':
        suggestions++
        break
      default:
        break
    }
  }

  const roundTotals = [...roundsBySession.values()]
  const averageRounds =
    roundTotals.length > 0 ? roundTotals.reduce((a, b) => a + b, 0) / roundTotals.length : 0

  return {
    range: { from, to },
    devices: devices.size,
    sessions: sessions.size,
    gameParticipations,
    impostorRoundsStarted,
    impostorRoundsCompleted,
    // Abbruchrate wird als Differenz zwischen geöffneter Konfiguration und
    // gestarteter Runde gemeldet; das explizite Abbruchereignis ergänzt sie.
    impostorSetupAbandoned: Math.max(
      impostorSetupAbandoned,
      Math.max(0, impostorSetupOpened - impostorRoundsStarted),
    ),
    impostorOnline,
    impostorOffline,
    whoAmIRoomsCreated,
    whoAmIRoundsStarted,
    averagePlayers: playerCountSamples > 0 ? playerCountSum / playerCountSamples : 0,
    averageRoundsPerSession: averageRounds,
    modeSplit: { impostor: impostorOpens, whoAmI: whoAmIOpens },
    suggestions,
    categoryUsage: [...categoryUsage.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export async function exportRange(from: string, to: string) {
  return getStore().analytics.query(from, to)
}
