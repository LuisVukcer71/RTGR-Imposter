import { createRouter, createWebHistory } from 'vue-router'
import { useGameState } from '@/composables/useGameState'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { order: 0 },
    },
    {
      path: '/impostor',
      name: 'impostor-setup',
      component: () => import('@/views/SetupView.vue'),
      meta: { order: 1 },
    },
    {
      path: '/impostor/reveal',
      name: 'impostor-reveal',
      component: () => import('@/views/RevealView.vue'),
      meta: { order: 2 },
    },
    {
      path: '/impostor/round',
      name: 'impostor-round',
      component: () => import('@/views/RoundView.vue'),
      meta: { order: 3 },
    },
    {
      path: '/impostor/resolution',
      name: 'impostor-resolution',
      component: () => import('@/views/ResolutionView.vue'),
      meta: { order: 4 },
    },
  ],
})

/*
 * Pro-Spiel-Guard: jede zukünftige Spiele-Route bekommt ihre eigene
 * "erforderliche Phase" -> Fallback-Route Zuordnung, statt eines
 * plattformweiten Guards. Heute nur Impostor, später z.B. { 'quiz-round':
 * ['round', 'quiz-setup'] }.
 */
const requiredPhase: Record<string, { phase: string; fallback: string }> = {
  'impostor-reveal': { phase: 'reveal', fallback: 'impostor-setup' },
  'impostor-round': { phase: 'round', fallback: 'impostor-setup' },
  'impostor-resolution': { phase: 'resolution', fallback: 'impostor-setup' },
}

router.beforeEach((to) => {
  const { state } = useGameState()
  const guard = requiredPhase[to.name as string]

  if (guard && state.phase !== guard.phase) {
    return { name: guard.fallback }
  }

  return true
})

export default router
