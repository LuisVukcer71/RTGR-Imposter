<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import AppLogo from '@/components/AppLogo.vue'
import { t } from '@/i18n'
</script>

<template>
  <main class="page notfound">
    <AppLogo />
    <p class="notfound__text">{{ t('common.notFound') }}</p>
    <AppButton size="lg" :to="{ name: 'home' }">{{ t('common.toHome') }}</AppButton>
  </main>
</template>

<style scoped>
.notfound {
  align-items: center;
  justify-content: center;
  gap: var(--s-6);
  text-align: center;
}

.notfound__text {
  color: var(--c-text-muted);
}
</style>
