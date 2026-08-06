/**
 * Sitzordnung und kreisförmige Begriffsvergabe für „Wer bin ich?“.
 *
 * Die Sitzordnung bildet einen geschlossenen Kreis: Spieler 1 gibt den Begriff
 * für Spieler 2 ein, Spieler n den für Spieler 1.
 */

export interface Seated {
  id: string
  seat: number
}

/**
 * Vergibt lückenlose Sitznummern ab 1 in der übergebenen Reihenfolge.
 * Wird nach jeder Umsortierung und nach jedem Entfernen neu angewendet.
 */
export function renumberSeats<T extends { id: string }>(ordered: readonly T[]): Array<T & { seat: number }> {
  return ordered.map((player, index) => ({ ...player, seat: index + 1 }))
}

/** Prüft, ob die Sitznummern lückenlos 1..n sind. */
export function seatsAreContiguous(players: readonly Seated[]): boolean {
  const seats = players.map((p) => p.seat).sort((a, b) => a - b)
  return seats.every((seat, index) => seat === index + 1)
}

/**
 * Liefert für jeden Spieler den Nachbarn, für den er einen Begriff eingeben muss.
 * Ergebnis: Map von Autor-ID auf Ziel-ID.
 */
export function circularAssignmentMap(players: readonly Seated[]): Map<string, string> {
  const map = new Map<string, string>()
  // Mit weniger als zwei Spielern gibt es keinen Kreis – niemand darf sich
  // selbst zugewiesen bekommen.
  if (players.length < 2) return map

  const ordered = [...players].sort((a, b) => a.seat - b.seat)
  for (let index = 0; index < ordered.length; index++) {
    const author = ordered[index]
    const target = ordered[(index + 1) % ordered.length]
    if (!author || !target) continue
    map.set(author.id, target.id)
  }
  return map
}

/** Ziel-ID für einen einzelnen Autor. Gibt `null` zurück, wenn er nicht im Kreis sitzt. */
export function assignmentTargetFor(players: readonly Seated[], authorId: string): string | null {
  if (players.length < 2) return null
  return circularAssignmentMap(players).get(authorId) ?? null
}

/**
 * Wendet eine vom Host gesendete Reihenfolge an. Unbekannte IDs werden ignoriert,
 * fehlende Spieler hinten in ihrer bisherigen Reihenfolge angehängt – so kann eine
 * veraltete Drag-and-drop-Liste niemals jemanden aus dem Raum werfen.
 */
export function applyOrder<T extends { id: string; seat: number }>(
  players: readonly T[],
  orderedIds: readonly string[],
): Array<T & { seat: number }> {
  const byId = new Map(players.map((player) => [player.id, player]))
  const ordered: T[] = []
  for (const id of orderedIds) {
    const player = byId.get(id)
    if (player) {
      ordered.push(player)
      byId.delete(id)
    }
  }
  const rest = [...byId.values()].sort((a, b) => a.seat - b.seat)
  return renumberSeats([...ordered, ...rest])
}
