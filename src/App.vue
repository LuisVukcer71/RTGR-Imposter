<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const transitionName = ref('slide-forward')

watch(
  () => route.meta.order as number | undefined,
  (newOrder, oldOrder) => {
    if (typeof newOrder === 'number' && typeof oldOrder === 'number') {
      transitionName.value = newOrder >= oldOrder ? 'slide-forward' : 'slide-back'
    }
  },
)
</script>

<template>
  <div class="app-shell">
    <RouterView v-slot="{ Component }">
      <Transition :name="transitionName">
        <component :is="Component" :key="route.path" class="route-view" />
      </Transition>
    </RouterView>
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100dvh;
  min-height: 100vh;
  overflow: hidden;
}

.app-shell::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 12% 15%, var(--color-blue-alpha), transparent 42%),
    radial-gradient(circle at 88% 12%, var(--color-green-alpha), transparent 38%),
    radial-gradient(circle at 78% 92%, var(--color-red-alpha), transparent 42%);
}

.route-view {
  width: 100%;
}

.slide-forward-enter-active,
.slide-forward-leave-active,
.slide-back-enter-active,
.slide-back-leave-active {
  transition:
    transform var(--duration-slow) var(--ease-standard),
    opacity var(--duration-base) ease;
  position: absolute;
  inset: 0;
}

.slide-forward-enter-from {
  transform: translateX(32px);
  opacity: 0;
}

.slide-forward-leave-to {
  transform: translateX(-32px);
  opacity: 0;
}

.slide-back-enter-from {
  transform: translateX(-32px);
  opacity: 0;
}

.slide-back-leave-to {
  transform: translateX(32px);
  opacity: 0;
}
</style>
