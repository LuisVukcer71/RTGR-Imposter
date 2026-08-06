<script setup lang="ts">
import { APP_NAME } from '@shared/config'

/**
 * Wortmarke „komm 10te“: erster Teil weiß, „10te“ in der Impostor-Akzentfarbe –
 * genau wie in der Referenz.
 */
const [first = '', second = ''] = APP_NAME.split(' ')
</script>

<template>
  <p class="logo">
    <span>{{ first }}</span>
    <span class="logo__accent">{{ second }}</span>
  </p>
</template>

<style scoped>
.logo {
  display: flex;
  gap: 0.28em;
  justify-content: center;
  font-size: var(--fs-2xl);
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.logo__accent {
  color: var(--c-impostor);
  text-shadow: 0 0 22px var(--c-impostor-glow);
}
</style>
