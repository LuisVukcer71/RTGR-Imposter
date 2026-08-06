import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { DEFAULT_LOCALE, type Locale } from '@shared/config'
import { setLocale } from '@/i18n'
import { haptics } from '@/services/haptics'
import { storage, StorageKeys } from '@/services/storage'

interface PersistedSettings {
  hapticsEnabled: boolean
  timerSoundEnabled: boolean
  timerVolume: number
  locale: Locale
}

const defaults: PersistedSettings = {
  hapticsEnabled: true,
  timerSoundEnabled: true,
  timerVolume: 0.8,
  locale: DEFAULT_LOCALE,
}

export const useSettingsStore = defineStore('settings', () => {
  const persisted = { ...defaults, ...storage.get<Partial<PersistedSettings>>(StorageKeys.settings, {}) }

  const hapticsEnabled = ref(persisted.hapticsEnabled)
  const timerSoundEnabled = ref(persisted.timerSoundEnabled)
  const timerVolume = ref(persisted.timerVolume)
  const locale = ref<Locale>(persisted.locale)
  const ageConfirmed = ref(storage.get<boolean>(StorageKeys.ageConfirmed, false))

  const hapticsSupported = computed(() => haptics.supported)
  const effectiveVolume = computed(() => (timerSoundEnabled.value ? timerVolume.value : 0))

  haptics.setEnabled(hapticsEnabled.value)
  setLocale(locale.value)

  watch([hapticsEnabled, timerSoundEnabled, timerVolume, locale], () => {
    haptics.setEnabled(hapticsEnabled.value)
    setLocale(locale.value)
    storage.set(StorageKeys.settings, {
      hapticsEnabled: hapticsEnabled.value,
      timerSoundEnabled: timerSoundEnabled.value,
      timerVolume: timerVolume.value,
      locale: locale.value,
    } satisfies PersistedSettings)
  })

  function confirmAge(): void {
    ageConfirmed.value = true
    storage.set(StorageKeys.ageConfirmed, true)
  }

  function resetAgeConfirmation(): void {
    ageConfirmed.value = false
    storage.remove(StorageKeys.ageConfirmed)
  }

  return {
    hapticsEnabled,
    hapticsSupported,
    timerSoundEnabled,
    timerVolume,
    effectiveVolume,
    locale,
    ageConfirmed,
    confirmAge,
    resetAgeConfirmation,
  }
})
