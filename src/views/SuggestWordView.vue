<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppHeader from '@/components/ui/AppHeader.vue'
import StatusNote from '@/components/ui/StatusNote.vue'
import TextField from '@/components/ui/TextField.vue'
import { t, tDynamic } from '@/i18n'
import { CATEGORIES, SUGGESTIONS, type CategoryName } from '@shared/config'
import { validateSuggestion } from '@shared/validation'
import { analytics } from '@/services/analytics'
import { HttpError, http, isOffline, NetworkError } from '@/services/http'
import { deviceId } from '@/services/identity'

/**
 * Öffentliches Vorschlagsformular. Die clientseitige Prüfung ist reine
 * Bequemlichkeit – verbindlich validiert und gedrosselt wird auf dem Server.
 */
const form = ref({
  displayTerm: '',
  canonicalTerm: '',
  hintTerm: '',
  category: '' as CategoryName | '',
  explanation: '',
})

const error = ref<string | null>(null)
const submitting = ref(false)
const success = ref(false)

function reset() {
  form.value = { displayTerm: '', canonicalTerm: '', hintTerm: '', category: '', explanation: '' }
  success.value = false
  error.value = null
}

async function submit() {
  error.value = null

  const validation = validateSuggestion({ ...form.value, category: form.value.category })
  if (!validation.ok) {
    error.value = tDynamic(`suggest.error.${validation.reason}`, {}, t('common.error'))
    return
  }
  if (isOffline()) {
    error.value = t('suggest.error.offline')
    return
  }

  submitting.value = true
  try {
    await http.post('/suggestions', { ...validation.value, clientId: deviceId() })
    analytics.track('suggestion_submitted')
    success.value = true
  } catch (cause) {
    if (cause instanceof HttpError && cause.code === 'rate_limited') {
      error.value = t('suggest.rateLimited', { limit: SUGGESTIONS.ratePerHour })
    } else if (cause instanceof HttpError) {
      error.value = tDynamic(`suggest.error.${cause.code}`, {}, cause.message)
    } else if (cause instanceof NetworkError) {
      error.value = t('suggest.error.offline')
    } else {
      error.value = t('common.error')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="page suggest">
    <AppHeader :title="t('suggest.title')" back-to="/" />

    <template v-if="success">
      <StatusNote tone="success" icon="check">{{ t('suggest.success') }}</StatusNote>
      <AppButton size="lg" block @click="reset">{{ t('suggest.another') }}</AppButton>
      <AppButton variant="ghost" block :to="{ name: 'home' }">{{ t('common.toHome') }}</AppButton>
    </template>

    <template v-else>
      <p class="suggest__intro">{{ t('suggest.intro') }}</p>

      <AppCard>
        <form class="suggest__form" @submit.prevent="submit">
          <TextField
            v-model="form.displayTerm"
            :label="t('suggest.displayTerm')"
            :hint="t('suggest.displayTerm.hint')"
            :maxlength="SUGGESTIONS.displayTermMaxLength"
            autocomplete="off"
          />
          <TextField
            v-model="form.canonicalTerm"
            :label="t('suggest.canonicalTerm')"
            :hint="t('suggest.canonicalTerm.hint')"
            :maxlength="SUGGESTIONS.canonicalTermMaxLength"
            autocomplete="off"
          />
          <TextField
            v-model="form.hintTerm"
            :label="t('suggest.hintTerm')"
            :hint="t('suggest.hintTerm.hint')"
            :maxlength="SUGGESTIONS.hintTermMaxLength"
            autocomplete="off"
          />

          <label class="suggest__select">
            <span class="suggest__label">{{ t('suggest.category') }}</span>
            <select v-model="form.category">
              <option value="" disabled>—</option>
              <option v-for="category in CATEGORIES" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>

          <TextField
            v-model="form.explanation"
            :label="t('suggest.explanation')"
            :maxlength="SUGGESTIONS.explanationMaxLength"
            multiline
            :rows="3"
            show-count
          />

          <StatusNote v-if="error" tone="error" icon="alert">{{ error }}</StatusNote>

          <AppButton type="submit" size="lg" block :loading="submitting">
            {{ t('suggest.submit') }}
          </AppButton>
        </form>
      </AppCard>
    </template>
  </main>
</template>

<style scoped>
.suggest__intro {
  font-size: var(--fs-sm);
  color: var(--c-text-muted);
}

.suggest__form {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.suggest__select {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.suggest__label {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--c-text-muted);
}

.suggest__select select {
  min-height: var(--touch);
  padding: 0 var(--s-3);
  font-size: 16px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
}
</style>
