/**
 * Audio-Adapter. Die App braucht genau einen Ton: den Weckeralarm beim Ablauf
 * des Impostor-Timers. Kein Start-, Klick- oder Enthüllungston.
 *
 * Der Ton wird synthetisiert statt als Datei ausgeliefert – das spart eine
 * Netzwerkanfrage und funktioniert offline garantiert.
 */

export interface AlarmImpl {
  start(volume: number): Promise<void> | void
  stop(): void
  /** iOS verlangt eine Nutzergeste, bevor Audio abgespielt werden darf. */
  unlock(): Promise<void> | void
}

function createWebAlarm(): AlarmImpl {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let beepTimer: ReturnType<typeof setInterval> | null = null

  function ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx ??= new Ctor()
    return ctx
  }

  /** Zwei kurze Töne – die typische Weckerkadenz. */
  function beep(): void {
    if (!ctx || !master) return
    const now = ctx.currentTime
    for (const [offset, frequency] of [
      [0, 880],
      [0.22, 1174.66],
    ] as const) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.9, now + offset + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18)
      osc.connect(gain).connect(master)
      osc.start(now + offset)
      osc.stop(now + offset + 0.2)
    }
  }

  return {
    async unlock() {
      const context = ensureContext()
      if (context && context.state === 'suspended') await context.resume()
    },

    async start(volume) {
      const context = ensureContext()
      if (!context) return
      if (context.state === 'suspended') await context.resume()
      master ??= context.createGain()
      master.gain.value = Math.max(0, Math.min(1, volume))
      master.connect(context.destination)
      if (beepTimer !== null) return
      beep()
      beepTimer = setInterval(beep, 900)
    },

    stop() {
      if (beepTimer !== null) {
        clearInterval(beepTimer)
        beepTimer = null
      }
      if (master) {
        try {
          master.disconnect()
        } catch {
          /* schon getrennt */
        }
        master = null
      }
    },
  }
}

let impl: AlarmImpl = createWebAlarm()

export function setAlarmImpl(next: AlarmImpl): void {
  impl = next
}

export const alarmSound = {
  /** Nach einer Nutzergeste aufrufen, damit iOS den Ton später zulässt. */
  unlock: () => impl.unlock(),
  start: (volume: number) => impl.start(volume),
  stop: () => impl.stop(),
}
