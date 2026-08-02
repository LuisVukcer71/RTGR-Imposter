import { createRouter, createWebHistory } from 'vue-router'
import { useGameState } from '@/composables/useGameState'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'setup',
      component: () => import('@/views/SetupView.vue'),
    },
    {
      path: '/reveal',
      name: 'reveal',
      component: () => import('@/views/RevealView.vue'),
    },
    {
      path: '/round',
      name: 'round',
      component: () => import('@/views/RoundView.vue'),
    },
    {
      path: '/resolution',
      name: 'resolution',
      component: () => import('@/views/ResolutionView.vue'),
    },
  ],
})

const requiredPhase: Record<string, string> = {
  reveal: 'reveal',
  round: 'round',
  resolution: 'resolution',
}

router.beforeEach((to) => {
  const { state } = useGameState()
  const phase = requiredPhase[to.name as string]

  if (phase && state.phase !== phase) {
    return { name: 'setup' }
  }

  return true
})

export default router
