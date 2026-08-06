<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue'
import AppHeader from '@/components/ui/AppHeader.vue'
import StatusNote from '@/components/ui/StatusNote.vue'
import { t } from '@/i18n'

/**
 * Bewusst leerer Platzhalter: Es wurden keine Betreiber- oder Rechtsangaben
 * erfunden. Die Route existiert, damit sie später nur befüllt werden muss.
 */
defineProps<{ title: string; body: string }>()
</script>

<template>
  <main class="page">
    <AppHeader :title="title" back-to="/einstellungen" />
    <AppCard :title="t('legal.placeholder.title')">
      <p class="legal__body">{{ body }}</p>
    </AppCard>
    <StatusNote tone="warn" icon="alert">{{ t('legal.todo') }}</StatusNote>
  </main>
</template>

<style scoped>
.legal__body {
  color: var(--c-text-muted);
  line-height: 1.6;
}
</style>
