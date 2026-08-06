<script setup lang="ts">
import { onMounted } from 'vue'
import AppLogo from '@/components/AppLogo.vue'
import GameModeCard from '@/components/GameModeCard.vue'
import MenuRow from '@/components/ui/MenuRow.vue'
import { t } from '@/i18n'
import { FEATURES } from '@shared/config'
import { analytics } from '@/services/analytics'
import { loadTermPool } from '@/services/termPool'

/**
 * Startansicht: direkt die verfügbaren Spiele, kein Logo-Hero, kein Marketing.
 * Der Wortpool wird hier im Hintergrund aufgefrischt, damit die Impostor-
 * Konfiguration später ohne Wartezeit startet.
 */
onMounted(() => {
  void loadTermPool()
  analytics.track('game_opened')
})
</script>

<template>
  <main class="page home">
    <AppLogo class="home__logo" />

    <div class="home__modes">
      <GameModeCard
        v-if="FEATURES.impostor"
        mode="impostor"
        :title="t('home.impostor.title')"
        :subtitle="t('home.impostor.subtitle')"
        :devices="1"
        :to="{ name: 'impostor-setup' }"
      />
      <GameModeCard
        v-if="FEATURES.whoAmI"
        mode="whoami"
        :title="t('home.whoami.title')"
        :subtitle="t('home.whoami.subtitle')"
        :devices="4"
        :to="{ name: 'whoami-entry' }"
      />
    </div>

    <nav class="home__menu">
      <MenuRow
        v-if="FEATURES.wordSuggestions"
        :label="t('home.suggest')"
        icon="pencil"
        :to="{ name: 'suggest' }"
      />
      <MenuRow :label="t('home.settings')" icon="sliders" :to="{ name: 'settings' }" />
    </nav>
  </main>
</template>

<style scoped>
.home {
  gap: var(--s-4);
  padding-top: calc(var(--safe-top) + var(--s-6));
}

.home__logo {
  margin-bottom: var(--s-2);
}

.home__modes {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

/* Direkt unter den Spielkarten – kein aufgeblähter Leerraum dazwischen. */
.home__menu {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  margin-top: var(--s-1);
}
</style>
