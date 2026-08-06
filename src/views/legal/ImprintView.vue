<script setup lang="ts">
import { t } from '@/i18n'
import LegalPlaceholder from './LegalPlaceholder.vue'
</script>

<template>
  <LegalPlaceholder :title="t('settings.imprint')" :body="t('legal.imprint.body')" />
</template>
