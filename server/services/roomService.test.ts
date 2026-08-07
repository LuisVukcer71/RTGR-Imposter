import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WHO_AM_I } from '../../src/shared/config.js'
import { createMemoryStore } from '../store/memory.js'
import type { RoomStore, Store } from '../store/types.js'
import * as rooms from './roomService.js'

/**
 * Integrationstests der Raumlogik gegen den In-Memory-Adapter.
 *
 * Der Fokus liegt auf den Regeln, die man nicht sehen kann: welcher Client
 * welche Daten überhaupt bekommt, wer was darf und was bei Zeitablauf passiert.
 */

let store: Store
let roomStore: RoomStore

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
  store = createMemoryStore()
  roomStore = store.rooms
})

afterEach(() => {
  vi.useRealTimers()
})

async function setupRoom(names: string[]) {
  const host = await rooms.createRoom(roomStore, names[0] as string)
  const members = [host]
  for (const name of names.slice(1)) {
    members.push(await rooms.joinRoom(roomStore, host.code, name))
  }
  return { code: host.code, members }
}

/** Jeder Spieler gibt für seinen Sitznachbarn einen Begriff ein. */
async function submitAllTerms(code: string, members: rooms.CreatedRoom[]) {
  for (const [index, member] of members.entries()) {
    await rooms.submitTerm(roomStore, code, member, `Begriff-${index + 1}`)
  }
}

describe('Raum erstellen und beitreten', () => {
  it('erzeugt einen gültigen Code und macht den Ersteller zum Host', async () => {
    const created = await rooms.createRoom(roomStore, 'Lena')
    expect(created.code).toMatch(
      new RegExp(`^[${WHO_AM_I.roomCodeAlphabet}]{${WHO_AM_I.roomCodeLength}}$`),
    )
    const view = await rooms.readRoom(roomStore, created.code, created)
    expect(view.you.isHost).toBe(true)
    expect(view.you.seat).toBe(1)
  })

  it('gibt jedem Spieler ein eigenes, geheimes Rejoin-Token', async () => {
    const { members } = await setupRoom(['Lena', 'Tom'])
    expect(members[0]!.rejoinToken).not.toBe(members[1]!.rejoinToken)
    expect(members[0]!.rejoinToken.length).toBeGreaterThanOrEqual(32)
  })

  it('verbietet doppelte Namen unabhängig von der Schreibweise', async () => {
    const { code } = await setupRoom(['Lena'])
    await expect(rooms.joinRoom(roomStore, code, 'LENA')).rejects.toMatchObject({
      code: 'name_taken',
    })
  })

  it('lässt höchstens 20 Spieler zu', async () => {
    const names = Array.from({ length: WHO_AM_I.maxPlayers }, (_, index) => `S${index + 1}`)
    const { code } = await setupRoom(names)
    await expect(rooms.joinRoom(roomStore, code, 'Zuspät')).rejects.toMatchObject({
      code: 'room_full',
    })
  })

  it('verweigert den Beitritt in einen gesperrten Raum', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom'])
    await rooms.setLocked(roomStore, code, members[0]!, true)
    await expect(rooms.joinRoom(roomStore, code, 'Mia')).rejects.toMatchObject({
      code: 'room_locked',
    })
  })

  it('weist einen unbekannten Raum ab', async () => {
    await expect(rooms.joinRoom(roomStore, 'ZZZZZZ', 'Lena')).rejects.toMatchObject({
      code: 'room_not_found',
    })
  })
})

describe('Zugangsschutz', () => {
  it('lässt den Raumcode allein nicht genügen, um einen Platz zu übernehmen', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom'])
    const attacker = { playerId: members[0]!.playerId, rejoinToken: 'geraten' }
    await expect(rooms.readRoom(roomStore, code, attacker)).rejects.toMatchObject({
      code: 'invalid_token',
    })
  })

  it('erlaubt den Rejoin mit dem eigenen Token nach Verbindungsverlust', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    vi.advanceTimersByTime(WHO_AM_I.offlineAfterMs + 5000)

    const view = await rooms.readRoom(roomStore, code, members[1]!)
    expect(view.you.playerId).toBe(members[1]!.playerId)
    expect(view.you.seat).toBe(2)
    expect(view.players.find((p) => p.id === members[1]!.playerId)?.online).toBe(true)
  })

  it('markiert einen Spieler ohne Lebenszeichen als offline, behält aber seinen Platz', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    vi.advanceTimersByTime(WHO_AM_I.offlineAfterMs + 1000)

    const view = await rooms.readRoom(roomStore, code, members[0]!)
    const tom = view.players.find((p) => p.id === members[1]!.playerId)
    expect(tom?.online).toBe(false)
    expect(tom?.seat).toBe(2)
  })
})

describe('Sitzordnung und Kreiszuweisung', () => {
  it('weist jedem Spieler seinen Sitznachbarn zu', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    const view = await rooms.readRoom(roomStore, code, members[0]!)
    expect(view.assignmentTarget?.seat).toBe(2)
    expect(view.assignmentTarget?.name).toBe('Tom')

    const last = await rooms.readRoom(roomStore, code, members[2]!)
    expect(last.assignmentTarget?.seat).toBe(1)
    expect(last.assignmentTarget?.name).toBe('Lena')
  })

  it('nummeriert nach dem Umsortieren lückenlos neu', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    const view = await rooms.reorderPlayers(roomStore, code, members[0]!, [
      members[2]!.playerId,
      members[0]!.playerId,
      members[1]!.playerId,
    ])
    expect(view.players.map((p) => [p.name, p.seat])).toEqual([
      ['Mia', 1],
      ['Lena', 2],
      ['Tom', 3],
    ])
  })

  it('verwirft eine Zuweisung, deren Ziel sich durch das Umsortieren geändert hat', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    // Lena hat den Begriff für ihren Nachbarn Tom eingegeben.
    await rooms.submitTerm(roomStore, code, members[0]!, 'Elon Musk')

    // Nach dem Umsortieren sitzt Mia neben Lena – der Begriff passt nicht mehr.
    await rooms.reorderPlayers(roomStore, code, members[0]!, [
      members[0]!.playerId,
      members[2]!.playerId,
      members[1]!.playerId,
    ])

    const view = await rooms.readRoom(roomStore, code, members[0]!)
    expect(view.assignmentTarget?.name).toBe('Mia')
    expect(view.submittedTerm).toBeNull()
  })

  it('behält eine Zuweisung, deren Nachbar sich durch das Umsortieren nicht ändert', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await rooms.submitTerm(roomStore, code, members[0]!, 'Elon Musk')

    // Rotation im Kreis: Lena sitzt hinten, hat aber weiterhin Tom als Nachbarn.
    await rooms.reorderPlayers(roomStore, code, members[0]!, [
      members[1]!.playerId,
      members[2]!.playerId,
      members[0]!.playerId,
    ])

    const view = await rooms.readRoom(roomStore, code, members[0]!)
    expect(view.assignmentTarget?.name).toBe('Tom')
    expect(view.submittedTerm).toBe('Elon Musk')
  })

  it('nummeriert nach dem Entfernen eines Spielers ohne Lücke neu', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    const view = await rooms.removePlayer(roomStore, code, members[0]!, members[1]!.playerId)
    expect(view.players.map((p) => [p.name, p.seat])).toEqual([
      ['Lena', 1],
      ['Mia', 2],
    ])
  })

  it('lässt nur den Host umsortieren', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await expect(
      rooms.reorderPlayers(roomStore, code, members[1]!, [members[1]!.playerId]),
    ).rejects.toMatchObject({ code: 'not_host' })
  })
})

describe('Begriffsvergabe vor dem Start', () => {
  it('zeigt dem Host nur den Abgabestatus, niemals den Begriff', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await rooms.submitTerm(roomStore, code, members[1]!, 'Harry Potter')

    const hostView = await rooms.readRoom(roomStore, code, members[0]!)
    expect(hostView.players.find((p) => p.name === 'Tom')?.hasSubmittedTerm).toBe(true)
    expect(hostView.board).toBeNull()
    expect(JSON.stringify(hostView)).not.toContain('Harry Potter')
  })

  it('lässt jeden nur seine eigene Eingabe sehen und ändern', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await rooms.submitTerm(roomStore, code, members[0]!, 'Erste Fassung')
    await rooms.submitTerm(roomStore, code, members[0]!, 'Zweite Fassung')

    const own = await rooms.readRoom(roomStore, code, members[0]!)
    expect(own.submittedTerm).toBe('Zweite Fassung')

    const other = await rooms.readRoom(roomStore, code, members[1]!)
    expect(other.submittedTerm).toBeNull()
  })

  it('erlaubt dem Host, eine Eingabe zur Überarbeitung freizugeben', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await rooms.submitTerm(roomStore, code, members[1]!, 'Shrek')
    await rooms.resetSubmission(roomStore, code, members[0]!, members[1]!.playerId)

    const view = await rooms.readRoom(roomStore, code, members[1]!)
    expect(view.submittedTerm).toBeNull()
  })
})

describe('Rundenstart', () => {
  it('startet erst, wenn jeder Spieler abgegeben hat', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await rooms.submitTerm(roomStore, code, members[0]!, 'A')
    await expect(rooms.startRound(roomStore, code, members[0]!)).rejects.toMatchObject({
      code: 'terms_missing',
    })

    await submitAllTerms(code, members)
    const view = await rooms.startRound(roomStore, code, members[0]!)
    expect(view.phase).toBe('playing')
  })

  it('verlangt mindestens drei Spieler', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom'])
    await submitAllTerms(code, members)
    await expect(rooms.startRound(roomStore, code, members[0]!)).rejects.toMatchObject({
      code: 'too_few_players',
    })
  })

  it('lässt nach dem Start niemanden mehr beitreten', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await submitAllTerms(code, members)
    await rooms.startRound(roomStore, code, members[0]!)

    await expect(rooms.joinRoom(roomStore, code, 'Spät')).rejects.toMatchObject({
      code: 'already_started',
    })
  })

  it('erlaubt bestehenden Spielern weiterhin den Rejoin', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await submitAllTerms(code, members)
    await rooms.startRound(roomStore, code, members[0]!)

    const view = await rooms.readRoom(roomStore, code, members[2]!)
    expect(view.phase).toBe('playing')
    expect(view.you.name).toBe('Mia')
  })
})

describe('Spielansicht', () => {
  it('liefert den eigenen Begriff gar nicht erst aus', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    // Mia sitzt auf Platz 3 und gibt für Lena ein.
    await rooms.submitTerm(roomStore, code, members[0]!, 'Für Tom')
    await rooms.submitTerm(roomStore, code, members[1]!, 'Für Mia')
    await rooms.submitTerm(roomStore, code, members[2]!, 'Für Lena')
    await rooms.startRound(roomStore, code, members[0]!)

    const lena = await rooms.readRoom(roomStore, code, members[0]!)
    const own = lena.board?.find((entry) => entry.isSelf)
    expect(own?.term).toBeNull()
    // Der Begriff darf in der gesamten Antwort nicht vorkommen.
    expect(JSON.stringify(lena)).not.toContain('Für Lena')
    expect(JSON.stringify(lena)).toContain('Für Tom')
  })

  it('gilt auch für den Host', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await rooms.submitTerm(roomStore, code, members[0]!, 'Für Tom')
    await rooms.submitTerm(roomStore, code, members[1]!, 'Für Mia')
    await rooms.submitTerm(roomStore, code, members[2]!, 'Hostbegriff')
    await rooms.startRound(roomStore, code, members[0]!)

    const host = await rooms.readRoom(roomStore, code, members[0]!)
    expect(host.you.isHost).toBe(true)
    expect(JSON.stringify(host)).not.toContain('Hostbegriff')
  })

  it('zeigt die Begriffe aller anderen in Sitzreihenfolge', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await submitAllTerms(code, members)
    await rooms.startRound(roomStore, code, members[0]!)

    const view = await rooms.readRoom(roomStore, code, members[1]!)
    expect(view.board?.map((entry) => entry.seat)).toEqual([1, 2, 3])
    for (const entry of view.board ?? []) {
      if (entry.isSelf) expect(entry.term).toBeNull()
      else expect(entry.term).toBeTruthy()
    }
  })

  it('liefert auch den selbst vergebenen Begriff während der Runde nicht mehr aus', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await submitAllTerms(code, members)
    await rooms.startRound(roomStore, code, members[0]!)

    const view = await rooms.readRoom(roomStore, code, members[0]!)
    expect(view.submittedTerm).toBeNull()
  })
})

describe('Private Notizen', () => {
  it('sind nur für den jeweiligen Spieler lesbar', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await submitAllTerms(code, members)
    await rooms.startRound(roomStore, code, members[0]!)
    await rooms.setNotes(roomStore, code, members[1]!, '- reale Person\n- kein Sportler')

    const own = await rooms.readRoom(roomStore, code, members[1]!)
    expect(own.notes).toContain('kein Sportler')

    const host = await rooms.readRoom(roomStore, code, members[0]!)
    expect(host.notes).toBe('')
    expect(JSON.stringify(host)).not.toContain('kein Sportler')
  })

  it('bleiben nach einem Rejoin erhalten', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await submitAllTerms(code, members)
    await rooms.startRound(roomStore, code, members[0]!)
    await rooms.setNotes(roomStore, code, members[2]!, 'meine Spur')

    vi.advanceTimersByTime(WHO_AM_I.offlineAfterMs * 2)
    const view = await rooms.readRoom(roomStore, code, members[2]!)
    expect(view.notes).toBe('meine Spur')
  })
})

describe('Hostverlust', () => {
  it('behält den Host fünf Minuten lang, auch wenn er offline ist', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    vi.advanceTimersByTime(WHO_AM_I.hostGraceMs - 30_000)

    const view = await rooms.readRoom(roomStore, code, members[1]!)
    expect(view.players.find((p) => p.isHost)?.name).toBe('Lena')
  })

  it('übergibt nach fünf Minuten an den verbundenen Spieler mit der niedrigsten Nummer', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])

    // Tom und Mia bleiben verbunden, Lena nicht.
    for (let elapsed = 0; elapsed < WHO_AM_I.hostGraceMs + 10_000; elapsed += 10_000) {
      vi.advanceTimersByTime(10_000)
      await rooms.readRoom(roomStore, code, members[1]!)
      await rooms.readRoom(roomStore, code, members[2]!)
    }

    const view = await rooms.readRoom(roomStore, code, members[1]!)
    expect(view.players.find((p) => p.isHost)?.name).toBe('Tom')
    expect(view.you.isHost).toBe(true)
  })

  it('gibt dem zurückkehrenden alten Host die Rechte nicht automatisch zurück', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    for (let elapsed = 0; elapsed < WHO_AM_I.hostGraceMs + 10_000; elapsed += 10_000) {
      vi.advanceTimersByTime(10_000)
      await rooms.readRoom(roomStore, code, members[1]!)
    }

    const back = await rooms.readRoom(roomStore, code, members[0]!)
    expect(back.you.isHost).toBe(false)
    expect(back.players.find((p) => p.isHost)?.name).toBe('Tom')
  })

  it('erlaubt dem aktuellen Host, die Rolle manuell zurückzugeben', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    const view = await rooms.transferHost(roomStore, code, members[0]!, members[1]!.playerId)
    expect(view.players.find((p) => p.isHost)?.name).toBe('Tom')

    const back = await rooms.transferHost(roomStore, code, members[1]!, members[0]!.playerId)
    expect(back.players.find((p) => p.isHost)?.name).toBe('Lena')
  })
})

describe('Runde beenden und neue Runde', () => {
  it('kehrt in die Lobby zurück und löscht Begriffe und Notizen der Runde', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await submitAllTerms(code, members)
    await rooms.startRound(roomStore, code, members[0]!)
    await rooms.setNotes(roomStore, code, members[1]!, 'alte Notiz')

    const ended = await rooms.endRound(roomStore, code, members[0]!)
    expect(ended.phase).toBe('lobby')
    expect(ended.roundNumber).toBe(2)
    expect(ended.locked).toBe(false)

    const view = await rooms.readRoom(roomStore, code, members[1]!)
    expect(view.submittedTerm).toBeNull()
    expect(view.notes).toBe('')
    expect(view.players.every((player) => !player.hasSubmittedTerm)).toBe(true)
  })

  it('lässt nur den Host beenden', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await submitAllTerms(code, members)
    await rooms.startRound(roomStore, code, members[0]!)
    await expect(rooms.endRound(roomStore, code, members[1]!)).rejects.toMatchObject({
      code: 'not_host',
    })
  })
})

describe('Raumlöschung', () => {
  it('löscht einen inaktiven Lobbyraum nach einer Stunde', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    vi.advanceTimersByTime(WHO_AM_I.roomInactivityMs + 1000)

    expect(await rooms.cleanupExpiredRooms(roomStore)).toBe(1)
    await expect(rooms.readRoom(roomStore, code, members[0]!)).rejects.toMatchObject({
      code: 'room_not_found',
    })
  })

  it('löscht eine laufende Runde niemals', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await submitAllTerms(code, members)
    await rooms.startRound(roomStore, code, members[0]!)

    vi.advanceTimersByTime(WHO_AM_I.roomInactivityMs * 3)
    expect(await rooms.cleanupExpiredRooms(roomStore)).toBe(0)

    const view = await rooms.readRoom(roomStore, code, members[0]!)
    expect(view.phase).toBe('playing')
  })

  it('setzt die Frist bei Lobbyaktivität zurück', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    vi.advanceTimersByTime(WHO_AM_I.roomInactivityMs - 60_000)
    await rooms.submitTerm(roomStore, code, members[0]!, 'noch aktiv')

    vi.advanceTimersByTime(120_000)
    expect(await rooms.cleanupExpiredRooms(roomStore)).toBe(0)
  })

  it('beginnt die Frist nach dem Rundenende neu', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await submitAllTerms(code, members)
    await rooms.startRound(roomStore, code, members[0]!)
    vi.advanceTimersByTime(WHO_AM_I.roomInactivityMs * 2)
    await rooms.endRound(roomStore, code, members[0]!)

    expect(await rooms.cleanupExpiredRooms(roomStore)).toBe(0)
    vi.advanceTimersByTime(WHO_AM_I.roomInactivityMs + 1000)
    expect(await rooms.cleanupExpiredRooms(roomStore)).toBe(1)
  })

  it('entfernt beim Schließen alle Raumdaten, lässt Analytics aber unberührt', async () => {
    const { code, members } = await setupRoom(['Lena', 'Tom', 'Mia'])
    await store.analytics.insertMany([
      {
        name: 'whoami_room_created',
        deviceHash: 'geraet',
        sessionHash: 'sitzung',
        payload: { mode: 'whoami' },
        occurredAt: new Date().toISOString(),
      },
    ])
    await submitAllTerms(code, members)
    await rooms.closeRoom(roomStore, code, members[0]!)

    await expect(rooms.readRoom(roomStore, code, members[1]!)).rejects.toMatchObject({
      code: 'room_not_found',
    })
    const events = await store.analytics.query(
      new Date(Date.now() - 60_000).toISOString(),
      new Date(Date.now() + 60_000).toISOString(),
    )
    expect(events).toHaveLength(1)
  })

  it('löscht den Raum, sobald der letzte Spieler ihn verlässt', async () => {
    const { code, members } = await setupRoom(['Lena'])
    await rooms.leaveRoom(roomStore, code, members[0]!)
    await expect(rooms.readRoom(roomStore, code, members[0]!)).rejects.toMatchObject({
      code: 'room_not_found',
    })
  })
})
