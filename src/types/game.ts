export interface Player {
  id: number
  name: string
  avatarSrc?: string
  characterSrc?: string
  accentColor?: string
}

export interface GameSettings {
  playerCount: number
  imposterCount: number
  categoryNames: string[] // leer = alle Kategorien erlaubt
}

export type GamePhase = 'idle' | 'reveal' | 'round' | 'resolution'

export interface RoleAssignment {
  playerId: number
  isImposter: boolean
}

/** Ein Wort samt Hinweis, der ausschließlich dem Impostor angezeigt wird. */
export interface WordEntry {
  word: string
  hint: string
}

export interface WordCategory {
  name: string
  words: WordEntry[]
}

export interface ActiveRound {
  categoryName: string
  word: string
  hint: string
  roles: RoleAssignment[]
}
