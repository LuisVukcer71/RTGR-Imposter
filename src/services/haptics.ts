/**
 * Haptik-Adapter. Web nutzt `navigator.vibrate`; für Capacitor muss später nur
 * `impl` gegen `@capacitor/haptics` getauscht werden.
 *
 * Haptik wird bewusst nur punktuell eingesetzt: beim Erreichen der vollen
 * Enthüllung, beim Timeralarm und beim Aufdecken der Impostor.
 */

export type HapticPattern = 'tick' | 'success' | 'warning' | 'alarm'

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tick: 12,
  success: [18, 40, 26],
  warning: [30, 60, 30],
  alarm: [220, 120, 220, 120, 320],
}

export interface HapticsImpl {
  supported: boolean
  vibrate(pattern: number | number[]): void
  cancel(): void
}

const webImpl: HapticsImpl = {
  get supported() {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  },
  vibrate(pattern) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Manche Browser werfen bei zu häufigen Aufrufen – irrelevant.
    }
  },
  cancel() {
    try {
      navigator.vibrate(0)
    } catch {
      /* ignorieren */
    }
  },
}

let impl: HapticsImpl = webImpl
let enabled = true

export function setHapticsImpl(next: HapticsImpl): void {
  impl = next
}

export const haptics = {
  get supported(): boolean {
    return impl.supported
  },
  setEnabled(value: boolean): void {
    enabled = value
    if (!value) impl.cancel()
  },
  play(pattern: HapticPattern): void {
    if (!enabled || !impl.supported) return
    impl.vibrate(PATTERNS[pattern])
  },
  stop(): void {
    impl.cancel()
  },
}
