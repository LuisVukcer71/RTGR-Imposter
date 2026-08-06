import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { storage } from '@/services/storage'
import { useImpostorStore } from './impostor'

/**
 * Zustandsregeln des Impostor-Modus, die man nur im Zusammenspiel sieht:
 * Persistenz über einen Reload, Zeitverhalten des Timers und die Frage, wer
 * beim Aufdecken was zu sehen bekommt.
 */

function configure(store: ReturnType<typeof useImpostorStore>) {
  store.config.playerNames = ['Lena', 'Tom', 'Mia']
  store.config.impostorCount = 1
  store.config.categories = ['Alltag']
  store.config.hintsEnabled = true
}

beforeEach(() => {
  storage.clearNamespace()
  setActivePinia(createPinia())
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T20:00:00Z'))
  // fetch wird nur für die Ziehungsmeldung gebraucht und darf hier ins Leere laufen.
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Runde anlegen', () => {
  it('verteilt genau eine Impostor-Rolle und behält die Spielerreihenfolge', () => {
    const store = useImpostorStore()
    configure(store)
    expect(store.createRound()).toBe(true)

    const round = store.round!
    expect(round.assignments.map((a) => a.playerName)).toEqual(['Lena', 'Tom', 'Mia'])
    expect(round.assignments.filter((a) => a.role === 'impostor')).toHaveLength(1)
    expect(round.phase).toBe('reveal')
    expect(round.revealCursor).toBe(0)
  })

  it('zieht innerhalb einer Sitzung keinen Begriff doppelt', () => {
    const store = useImpostorStore()
    configure(store)

    const drawn = new Set<string>()
    for (let round = 0; round < 20; round++) {
      store.createRound()
      drawn.add(store.round!.term.id)
    }
    expect(drawn.size).toBe(20)
  })

  it('startet den Timer erst mit dem Rundenstart', () => {
    const store = useImpostorStore()
    configure(store)
    store.config.timerEnabled = true
    store.config.timerSeconds = 300
    store.createRound()

    // Während der Rollenaufdeckung läuft noch nichts.
    expect(store.round!.timerEndsAt).toBeNull()

    store.round!.phase = 'ready'
    store.beginRound()
    expect(store.round!.timerEndsAt).toBeNull()

    store.enterPlayingPhase()
    expect(store.round!.timerEndsAt).toBe(Date.now() + 300_000)
  })

  it('setzt bei deaktiviertem Timer keinen Endzeitpunkt', () => {
    const store = useImpostorStore()
    configure(store)
    store.createRound()
    store.enterPlayingPhase()
    expect(store.round!.timerEndsAt).toBeNull()
  })
})

describe('Reload mitten in der Runde', () => {
  it('stellt Spieler, Begriff, Rollen und Fortschritt wieder her', async () => {
    const first = useImpostorStore()
    configure(first)
    first.createRound()
    first.confirmReveal()
    const snapshot = JSON.parse(JSON.stringify(first.round))
    await nextTick()

    // Neue Pinia-Instanz entspricht einem Reload der Seite.
    setActivePinia(createPinia())
    const restored = useImpostorStore()

    expect(restored.round).toEqual(snapshot)
    expect(restored.round!.revealCursor).toBe(1)
  })

  it('behält den absoluten Timer-Endzeitpunkt bei, statt neu zu starten', async () => {
    const first = useImpostorStore()
    configure(first)
    first.config.timerEnabled = true
    first.config.timerSeconds = 120
    first.createRound()
    first.enterPlayingPhase()
    const endsAt = first.round!.timerEndsAt
    await nextTick()

    vi.advanceTimersByTime(90_000)
    setActivePinia(createPinia())
    const restored = useImpostorStore()

    expect(restored.round!.timerEndsAt).toBe(endsAt)
    expect(restored.round!.timerEndsAt! - Date.now()).toBe(30_000)
  })

  it('liefert einen bereits abgelaufenen Timer als überfällig zurück', async () => {
    const first = useImpostorStore()
    configure(first)
    first.config.timerEnabled = true
    first.config.timerSeconds = 60
    first.createRound()
    first.enterPlayingPhase()
    await nextTick()

    vi.advanceTimersByTime(120_000)
    setActivePinia(createPinia())
    const restored = useImpostorStore()

    expect(restored.round!.timerEndsAt!).toBeLessThan(Date.now())
  })
})

describe('Aufdecken', () => {
  it('deckt die Impostor beim Alarm nicht automatisch auf', () => {
    const store = useImpostorStore()
    configure(store)
    store.config.timerEnabled = true
    store.config.timerSeconds = 10
    store.createRound()
    store.enterPlayingPhase()

    vi.advanceTimersByTime(20_000)
    store.triggerAlarm()

    expect(store.round!.timerAlarmActive).toBe(true)
    expect(store.round!.phase).toBe('playing')
  })

  it('beendet die Runde erst über „Aufdecken“', () => {
    const store = useImpostorStore()
    configure(store)
    store.createRound()
    store.enterPlayingPhase()
    store.revealImpostors()

    expect(store.round!.phase).toBe('revealed')
    expect(store.impostorNames).toHaveLength(1)
  })

  it('behält Spieler und Einstellungen für die nächste Runde, zieht aber neu', () => {
    const store = useImpostorStore()
    configure(store)
    store.createRound()
    const firstTerm = store.round!.term.id
    const players = store.round!.assignments.map((a) => a.playerName)

    store.createRound()
    expect(store.round!.term.id).not.toBe(firstTerm)
    expect(store.round!.assignments.map((a) => a.playerName)).toEqual(players)
  })

  it('zählt einen abgebrochenen Begriff trotzdem als verbraucht', () => {
    const store = useImpostorStore()
    configure(store)
    store.createRound()
    const usedTerm = store.round!.term.id

    store.abandonRound()
    expect(store.round).toBeNull()

    store.createRound()
    expect(store.round!.term.id).not.toBe(usedTerm)
  })

  it('gibt die Liste der verwendeten Begriffe auf Wunsch frei', () => {
    const store = useImpostorStore()
    configure(store)
    store.createRound()
    store.clearUsedTerms()
    expect(store.lastPoolExhausted).toBe(false)
  })
})

describe('Mitimpostor', () => {
  it('nennt sie nur, wenn die Option aktiviert ist', () => {
    const store = useImpostorStore()
    store.config.playerNames = ['A', 'B', 'C', 'D', 'E', 'F']
    store.config.impostorCount = 2
    store.config.categories = ['Alltag']
    store.config.impostorsKnowEachOther = false
    store.createRound()

    const impostorIndex = store.round!.assignments.findIndex((a) => a.role === 'impostor')
    store.round!.revealCursor = impostorIndex
    expect(store.currentFellows).toEqual([])

    store.round!.config.impostorsKnowEachOther = true
    expect(store.currentFellows).toHaveLength(1)
    expect(store.currentFellows[0]).not.toBe(store.round!.assignments[impostorIndex]!.playerName)
  })
})
