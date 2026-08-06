import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RoomView } from '@shared/types'
import { analytics } from '@/services/analytics'
import { HttpError } from '@/services/http'
import { storage, StorageKeys } from '@/services/storage'
import {
  createPollingRoomSync,
  forgetMembership,
  getMembership,
  rememberMembership,
  roomApi,
  type Membership,
  type RoomSyncService,
} from '@/services/roomSync'

/**
 * Zustand eines „Wer bin ich?“-Raums auf dem Gerät.
 *
 * Der Store hält bewusst nur die **serverseitig gefilterte** Sicht. Es gibt
 * keinen Codepfad, über den der eigene Begriff in den Client gelangen könnte –
 * er wird gar nicht erst ausgeliefert.
 */
export const useRoomStore = defineStore('room', () => {
  const view = ref<RoomView | null>(null)
  const membership = ref<Membership | null>(null)
  const connected = ref(true)
  const fatalError = ref<string | null>(null)
  const busy = ref(false)

  let sync: RoomSyncService | null = null

  const isHost = computed(() => view.value?.you.isHost ?? false)
  const phase = computed(() => view.value?.phase ?? 'lobby')
  const missingTerms = computed(
    () => (view.value?.players ?? []).filter((player) => !player.hasSubmittedTerm).length,
  )

  function attach(next: Membership) {
    detach()
    membership.value = next
    rememberMembership(next)

    sync = createPollingRoomSync()
    sync.onUpdate((incoming) => {
      // Nur neuere Stände übernehmen: eine langsame Antwort darf einen
      // frischeren Zustand nicht überschreiben.
      if (!view.value || incoming.version >= view.value.version) view.value = incoming
      fatalError.value = null
    })
    sync.onConnectionChange((value) => {
      connected.value = value
    })
    sync.onError((error) => {
      fatalError.value = error instanceof HttpError ? error.code : 'unknown'
      if (error instanceof HttpError && [403, 404, 410].includes(error.status)) {
        forgetMembership(next.code)
      }
    })
    sync.start(next)
  }

  function detach() {
    sync?.stop()
    sync = null
    view.value = null
    connected.value = true
  }

  function resume(code: string): boolean {
    const existing = getMembership(code)
    if (!existing) return false
    attach(existing)
    return true
  }

  async function create(name: string): Promise<string> {
    const result = await roomApi.create(name)
    analytics.track('whoami_room_created', { mode: 'whoami' })
    attach(result)
    return result.code
  }

  async function join(code: string, name: string): Promise<string> {
    const result = await roomApi.join(code, name)
    analytics.track('whoami_room_joined', { mode: 'whoami' })
    attach(result)
    return result.code
  }

  /** Führt eine Aktion aus und übernimmt die zurückgelieferte Sicht sofort. */
  async function act<T extends RoomView | void>(
    operation: (m: Membership) => Promise<T>,
  ): Promise<void> {
    if (!membership.value || busy.value) return
    busy.value = true
    try {
      const result = await operation(membership.value)
      if (result) view.value = result as RoomView
    } finally {
      busy.value = false
    }
  }

  const submitTerm = (term: string) => act((m) => roomApi.submitTerm(m, term))
  const reorder = (order: string[]) => act((m) => roomApi.reorder(m, order))
  const renumber = () => act((m) => roomApi.renumber(m))
  const removePlayer = (playerId: string) => act((m) => roomApi.removePlayer(m, playerId))
  const setLocked = (locked: boolean) => act((m) => roomApi.setLocked(m, locked))
  const transferHost = (playerId: string) => act((m) => roomApi.transferHost(m, playerId))
  const resetSubmission = (playerId: string) => act((m) => roomApi.resetSubmission(m, playerId))
  const endRound = () => act((m) => roomApi.end(m))

  async function startRound(): Promise<void> {
    const playerCount = view.value?.players.length ?? 0
    await act((m) => roomApi.start(m))
    analytics.track('whoami_round_started', { mode: 'whoami', playerCount })
  }

  /** Notizen werden direkt gespeichert; die Antwort ersetzt die Sicht nicht. */
  async function saveNotes(content: string): Promise<void> {
    if (!membership.value) return
    storage.set(`${StorageKeys.roomNotesDraft}:${membership.value.code}`, content)
    await roomApi.saveNotes(membership.value, content)
  }

  function localNotesDraft(): string | null {
    if (!membership.value) return null
    return storage.get<string | null>(`${StorageKeys.roomNotesDraft}:${membership.value.code}`, null)
  }

  async function leave(): Promise<void> {
    if (!membership.value) return
    const current = membership.value
    detach()
    forgetMembership(current.code)
    membership.value = null
    await roomApi.leave(current).catch(() => undefined)
  }

  async function close(): Promise<void> {
    if (!membership.value) return
    const current = membership.value
    detach()
    forgetMembership(current.code)
    membership.value = null
    await roomApi.close(current).catch(() => undefined)
  }

  return {
    view,
    membership,
    connected,
    fatalError,
    busy,
    isHost,
    phase,
    missingTerms,
    attach,
    detach,
    resume,
    create,
    join,
    submitTerm,
    reorder,
    renumber,
    removePlayer,
    setLocked,
    transferHost,
    resetSubmission,
    startRound,
    endRound,
    saveNotes,
    localNotesDraft,
    leave,
    close,
  }
})
