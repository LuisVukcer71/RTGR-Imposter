import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'

/**
 * Countdown auf Basis eines **absoluten** Endzeitpunkts.
 *
 * Bewusst nicht als herunterzählender Zähler implementiert: nur so bleibt die
 * Zeit über Reload, Tabwechsel und Hintergrund-Drosselung korrekt. Ist der
 * Endzeitpunkt beim Wiederherstellen bereits vorbei, feuert `onExpire` sofort.
 */
export function useCountdown(endsAt: Ref<number | null>, onExpire: () => void) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null
  let fired = false

  const remainingMs = computed(() =>
    endsAt.value === null ? null : Math.max(0, endsAt.value - now.value),
  )
  const remainingSeconds = computed(() =>
    remainingMs.value === null ? null : Math.ceil(remainingMs.value / 1000),
  )
  const formatted = computed(() => {
    const seconds = remainingSeconds.value
    if (seconds === null) return null
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
  })
  const isUrgent = computed(() => remainingSeconds.value !== null && remainingSeconds.value <= 10)

  function tick() {
    now.value = Date.now()
    if (!fired && endsAt.value !== null && now.value >= endsAt.value) {
      fired = true
      onExpire()
    }
  }

  function stop() {
    if (timer !== null) clearInterval(timer)
    timer = null
  }

  watch(
    endsAt,
    (value) => {
      stop()
      fired = false
      if (value === null) return
      tick()
      timer = setInterval(tick, 250)
    },
    { immediate: true },
  )

  // Nach Rückkehr aus dem Hintergrund sofort neu bewerten.
  const onVisibility = () => {
    if (document.visibilityState === 'visible') tick()
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility)

  onScopeDispose(() => {
    stop()
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility)
  })

  return { remainingMs, remainingSeconds, formatted, isUrgent }
}
