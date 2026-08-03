export interface PlayerProfile {
  id: string
  name: string
  /**
   * Einziges Foto pro Person, wird für beide Zwecke verwendet:
   *  - klein als Kreis-Avatar (Listen/Multi-Select-Grid, object-fit: cover)
   *  - groß als Charakterbild in Reveal-Momenten (object-fit: contain)
   * Erwartet: Brustbild/Halbkörper, Gesicht mittig, mind. 1000px lange Seite.
   * Transparenter Hintergrund ist ideal, aber nicht zwingend - ein
   * durchgehender (z.B. schwarzer) Hintergrund wird in der großen Darstellung
   * per Verlaufsmaske automatisch weich ausgeblendet (siehe
   * AppCharacterPortrait.vue).
   */
  avatarSrc: string
  /** Rein dekorative Identitätsfarbe für den Initialen-Fallback. */
  accentColor: string
}

/*
 * Fester Freundeskreis - keine Account-Verwaltung, keine dynamische
 * Registrierung. Reihenfolge hier bestimmt auch die Grid-Reihenfolge im
 * Setup und die Spielreihenfolge im Reveal-Flow.
 *
 * Asset-Ablage (manuell durch dich, siehe public/avatars/README.md):
 *  - public/avatars/<id>.png -> avatarSrc
 */
export const PLAYER_PROFILES: PlayerProfile[] = [
  { id: 'luis', name: 'Luis', avatarSrc: '/avatars/luis.png', accentColor: 'var(--color-avatar-1)' },
  { id: 'philipp', name: 'Philipp', avatarSrc: '/avatars/philipp.png', accentColor: 'var(--color-avatar-2)' },
  { id: 'ilker', name: 'Ilker', avatarSrc: '/avatars/ilker.png', accentColor: 'var(--color-avatar-3)' },
  { id: 'resul', name: 'Resul', avatarSrc: '/avatars/resul.png', accentColor: 'var(--color-avatar-4)' },
  { id: 'amar', name: 'Amar', avatarSrc: '/avatars/amar.png', accentColor: 'var(--color-avatar-5)' },
  { id: 'marcel', name: 'Marcel', avatarSrc: '/avatars/marcel.png', accentColor: 'var(--color-avatar-6)' },
  { id: 'jovan', name: 'Jovan', avatarSrc: '/avatars/jovan.png', accentColor: 'var(--color-avatar-7)' },
  { id: 'hakob', name: 'Hakob', avatarSrc: '/avatars/hakob.png', accentColor: 'var(--color-avatar-8)' },
]
