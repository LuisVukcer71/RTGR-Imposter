/**
 * Zentrale, umgebungsunabhängige Konfiguration.
 *
 * Diese Datei wird sowohl vom Browser-Bundle als auch von den Serverless-Funktionen
 * importiert. Sie darf deshalb weder auf `window` noch auf `process` zugreifen.
 * Alles, was pro Umgebung unterschiedlich ist, lebt in `src/config/runtime.ts`
 * (Client) beziehungsweise `server/env.ts` (Server).
 */

/** Produktname. Insider-Schreibweise, bewusst klein. */
export const APP_NAME = 'komm 10te'
export const APP_SHORT_NAME = 'komm10te'
export const APP_DESCRIPTION = 'Partyspiele für unterwegs: Impostor und Wer bin ich?'

export const SUPPORTED_LOCALES = ['de'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'de'

/** Mindestalter. Die App ist vollständig 18+. */
export const MIN_AGE = 18

export const PLAYER_NAME = {
  minLength: 1,
  maxLength: 20,
} as const

export const IMPOSTOR = {
  minPlayers: 3,
  maxPlayers: 20,
  /** Obergrenze: ungefähr ein Impostor pro drei Spieler. */
  playersPerImpostor: 3,
  /** Sekunden, die „<Name> beginnt“ angezeigt wird. */
  startPlayerAnnouncementSeconds: 5,
  timerPresetSeconds: [120, 180, 300, 600, 900],
  minTimerSeconds: 10,
  maxTimerSeconds: 60 * 60,
  /** Anteil der Karte, der hochgezogen sein muss, damit die Rolle als aufgedeckt gilt. */
  revealThreshold: 0.85,
} as const

export const WHO_AM_I = {
  minPlayers: 3,
  maxPlayers: 20,
  roomCodeLength: 6,
  /** Ohne O, 0, I, 1 – vermeidet Verwechslungen beim Abtippen. */
  roomCodeAlphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  termMinLength: 1,
  termMaxLength: 60,
  notesMaxLength: 2000,
  /** Ein offener, nicht laufender Raum wird nach einer Stunde Inaktivität gelöscht. */
  roomInactivityMs: 60 * 60 * 1000,
  /** Ein offline gegangener Host bleibt fünf Minuten lang Host. */
  hostGraceMs: 5 * 60 * 1000,
  /** Ab wann ein Spieler ohne Heartbeat als offline gilt. */
  offlineAfterMs: 20 * 1000,
  pollIntervalMs: 2000,
  pollIntervalHiddenMs: 10000,
  /** Wortlaut, den ein Spieler statt seines eigenen Begriffs sieht. */
  ownTermPlaceholder: 'find es raus du bot',
} as const

export const SUGGESTIONS = {
  ratePerHour: 10,
  displayTermMaxLength: 60,
  canonicalTermMaxLength: 120,
  hintTermMaxLength: 60,
  explanationMaxLength: 500,
} as const

export const CATEGORIES = [
  'Alltag',
  'Internet & Social Media',
  'Berufe',
  'Promis',
  'Filme & Serien',
  'Gaming',
  'Gegenstände',
] as const
export type CategoryName = (typeof CATEGORIES)[number]

export const REVIEW_STATUSES = ['approved', 'needs_human_review', 'rejected'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export const SUGGESTION_STATUSES = ['new', 'in_review', 'accepted', 'rejected', 'duplicate'] as const
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number]

/**
 * Feature-Flags. Bewusst statisch – so kann ein Modul deaktiviert werden,
 * ohne Routen und Komponenten anzufassen.
 */
export const FEATURES = {
  impostor: true,
  whoAmI: true,
  wordSuggestions: true,
  admin: true,
  analytics: true,
  /** QR-Scanner via BarcodeDetector bzw. jsQR-Fallback. */
  qrScanner: true,
} as const

/** Theme-Tokens. Spiegeln 1:1 die CSS-Variablen in `src/styles/tokens.css`. */
export const THEME = {
  background: '#0a0e15',
  surface: '#10161d',
  impostor: '#2acfb9',
  whoAmI: '#f28c1d',
  danger: '#ff3b30',
  text: '#f7f8fa',
} as const

export const ADMIN = {
  sessionTtlMs: 12 * 60 * 60 * 1000,
  cookieName: 'k10_admin',
  /** Fehlversuche pro IP und Stunde, bevor der Login blockiert. */
  loginAttemptsPerHour: 10,
} as const
