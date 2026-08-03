<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    avatarSrc?: string
    accentColor?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    selected?: boolean
    role?: 'neutral' | 'crew' | 'imposter'
  }>(),
  {
    avatarSrc: undefined,
    accentColor: 'var(--color-blue)',
    size: 'md',
    selected: false,
    role: 'neutral',
  },
)

const imageFailed = ref(false)

watch(
  () => props.avatarSrc,
  () => {
    imageFailed.value = false
  },
)

const showImage = computed(() => Boolean(props.avatarSrc) && !imageFailed.value)

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
})

function onImageError() {
  imageFailed.value = true
}
</script>

<template>
  <div
    class="avatar"
    :class="[`avatar--${size}`, `avatar--role-${role}`, { 'avatar--selected': selected }]"
  >
    <div class="avatar__ring glass-surface">
      <img v-if="showImage" :src="avatarSrc" :alt="name" class="avatar__image" @error="onImageError" />
      <div v-else class="avatar__fallback" :style="{ background: accentColor }">
        <span class="avatar__initials">{{ initials }}</span>
      </div>
    </div>
    <div v-if="selected" class="avatar__selected-badge">✓</div>
  </div>
</template>

<style scoped>
.avatar {
  position: relative;
  display: inline-flex;
  width: var(--avatar-size);
  height: var(--avatar-size);
  flex-shrink: 0;
}

.avatar--sm {
  --avatar-size: 32px;
}

.avatar--md {
  --avatar-size: 56px;
}

.avatar--lg {
  /* Responsiv statt fix: muss im 4-spaltigen Setup-Grid auch auf 360-430px
     breiten Handys noch in eine Spalte passen (siehe SetupView .player-grid). */
  --avatar-size: clamp(48px, 13vw, 72px);
}

.avatar--xl {
  --avatar-size: 152px;
}

.avatar__ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  transition:
    transform var(--duration-base) var(--ease-spring),
    box-shadow var(--duration-base) ease;
}

.avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar__fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar__initials {
  color: rgba(0, 0, 0, 0.65);
  font-weight: 700;
  font-size: calc(var(--avatar-size) * 0.36);
  letter-spacing: 0.02em;
}

.avatar--selected .avatar__ring {
  box-shadow:
    0 0 0 3px var(--color-blue),
    0 0 22px 4px var(--color-blue-glow);
  animation: ring-pop-in var(--duration-base) var(--ease-spring);
}

.avatar--role-crew .avatar__ring {
  box-shadow:
    0 0 0 3px var(--color-green),
    0 0 28px 6px var(--color-green-glow);
}

.avatar--role-imposter .avatar__ring {
  box-shadow:
    0 0 0 3px var(--color-red),
    0 0 28px 6px var(--color-red-glow);
}

.avatar__selected-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-blue);
  color: var(--color-blue-contrast);
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-bg-elevated);
  animation: ring-pop-in var(--duration-base) var(--ease-spring);
}
</style>
