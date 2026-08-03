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

export interface ActiveRound {
  categoryName: string
  word: string
  roles: RoleAssignment[]
}
