<script setup lang="ts">
import { ref } from 'vue'
import { t } from '@/i18n'
import { useSettingsStore } from '@/stores/settings'
import AppLogo from './AppLogo.vue'
import AppButton from './ui/AppButton.vue'

/**
 * 18+-Bestätigung beim ersten Start. Kein Splashscreen im klassischen Sinn:
 * die Karte ist die einzige Hürde und verschwindet danach dauerhaft.
 */
const settings = useSettingsStore()
const declined = ref(false)
</script>

<template>
  <main class="page gate">
    <AppLogo />

    <div v-if="!declined" class="gate__card">
      <h1 class="gate__title">{{ t('age.title') }}</h1>
      <p class="gate__body">{{ t('age.body') }}</p>
      <p class="gate__hint">{{ t('age.hint') }}</p>

      <div class="gate__actions">
        <AppButton size="lg" block @click="settings.confirmAge()">
          {{ t('age.confirm') }}
        </AppButton>
        <AppButton variant="ghost" block @click="declined = true">
          {{ t('age.decline') }}
        </AppButton>
      </div>
    </div>

    <div v-else class="gate__card">
      <p class="gate__body">{{ t('age.declined') }}</p>
    </div>
  </main>
</template>

<style scoped>
.gate {
  justify-content: center;
  gap: var(--s-7);
}

.gate__card {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  padding: var(--s-6);
  background: var(--c-surface);
  border: 1px solid var(--c-line);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-card);
}

.gate__title {
  font-size: var(--fs-xl);
  font-weight: 700;
}

.gate__body {
  font-size: var(--fs-lg);
  line-height: 1.4;
}

.gate__hint {
  font-size: var(--fs-sm);
  color: var(--c-text-muted);
}

.gate__actions {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  margin-top: var(--s-3);
}
</style>
