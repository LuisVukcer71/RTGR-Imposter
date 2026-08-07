import { describe, expect, it } from 'vitest'
import {
  applyOrder,
  assignmentTargetFor,
  circularAssignmentMap,
  renumberSeats,
  seatsAreContiguous,
} from './seating.js'

const players = [
  { id: 'p1', seat: 1 },
  { id: 'p2', seat: 2 },
  { id: 'p3', seat: 3 },
  { id: 'p4', seat: 4 },
]

describe('Sitznummern', () => {
  it('vergibt lückenlos ab 1', () => {
    const result = renumberSeats([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
    expect(result.map((entry) => entry.seat)).toEqual([1, 2, 3])
  })

  it('erkennt Lücken', () => {
    expect(seatsAreContiguous(players)).toBe(true)
    expect(seatsAreContiguous([{ id: 'a', seat: 1 }, { id: 'b', seat: 3 }])).toBe(false)
  })

  it('nummeriert nach dem Entfernen eines Spielers ohne Lücke neu', () => {
    const remaining = players.filter((player) => player.id !== 'p2')
    expect(renumberSeats(remaining).map((entry) => entry.seat)).toEqual([1, 2, 3])
  })
})

describe('Kreisförmige Begriffsvergabe', () => {
  it('lässt jeden für seinen Nachfolger eingeben und schließt den Kreis', () => {
    const map = circularAssignmentMap(players)
    expect(map.get('p1')).toBe('p2')
    expect(map.get('p2')).toBe('p3')
    expect(map.get('p3')).toBe('p4')
    expect(map.get('p4')).toBe('p1')
  })

  it('gibt jedem Spieler genau ein Ziel und jedes Ziel genau einmal', () => {
    const map = circularAssignmentMap(players)
    expect(map.size).toBe(players.length)
    expect(new Set(map.values()).size).toBe(players.length)
  })

  it('richtet sich nach der Sitznummer, nicht nach der Listenreihenfolge', () => {
    const shuffled = [
      { id: 'p3', seat: 3 },
      { id: 'p1', seat: 1 },
      { id: 'p4', seat: 4 },
      { id: 'p2', seat: 2 },
    ]
    expect(circularAssignmentMap(shuffled).get('p1')).toBe('p2')
  })

  it('vergibt bei nur einem Spieler kein Ziel', () => {
    expect(assignmentTargetFor([{ id: 'p1', seat: 1 }], 'p1')).toBeNull()
    expect(circularAssignmentMap([{ id: 'p1', seat: 1 }]).size).toBe(0)
  })

  it('weist niemals jemanden sich selbst zu', () => {
    for (let count = 1; count <= 6; count++) {
      const group = Array.from({ length: count }, (_, index) => ({
        id: `p${index}`,
        seat: index + 1,
      }))
      for (const [author, target] of circularAssignmentMap(group)) {
        expect(author, `bei ${count} Spielern`).not.toBe(target)
      }
    }
  })
})

describe('Umsortieren', () => {
  it('übernimmt die gewünschte Reihenfolge und nummeriert neu', () => {
    const result = applyOrder(players, ['p3', 'p1', 'p4', 'p2'])
    expect(result.map((entry) => [entry.id, entry.seat])).toEqual([
      ['p3', 1],
      ['p1', 2],
      ['p4', 3],
      ['p2', 4],
    ])
  })

  it('hängt in der Liste fehlende Spieler hinten an, statt sie zu verlieren', () => {
    const result = applyOrder(players, ['p4', 'p2'])
    expect(result.map((entry) => entry.id)).toEqual(['p4', 'p2', 'p1', 'p3'])
    expect(result.map((entry) => entry.seat)).toEqual([1, 2, 3, 4])
  })

  it('ignoriert unbekannte IDs', () => {
    const result = applyOrder(players, ['p2', 'unbekannt', 'p1', 'p3', 'p4'])
    expect(result.map((entry) => entry.id)).toEqual(['p2', 'p1', 'p3', 'p4'])
  })
})
