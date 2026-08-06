<script setup lang="ts">
import { computed } from 'vue'

/**
 * Ein einziges Icon-Set als Inline-SVG. Strichbasiert, 24er-Raster – passt zur
 * klaren, dezenten Bildsprache der Referenz und kostet keine Extra-Anfrage.
 */
export type IconName = keyof typeof paths

const paths = {
  'chevron-right': 'M9 5l7 7-7 7',
  'chevron-left': 'M15 5l-7 7 7 7',
  'chevron-down': 'M5 9l7 7 7-7',
  'arrow-up': 'M12 20V4M5 11l7-7 7 7',
  'arrow-left': 'M19 12H5M11 18l-6-6 6-6',
  pencil: 'M15.5 4.5l4 4M4 20l4.5-.9L20 7.6a1.5 1.5 0 0 0 0-2.1l-1.5-1.5a1.5 1.5 0 0 0-2.1 0L4.9 15.5 4 20z',
  sliders: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 4v6M8 14v6',
  phone: 'M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM10.5 19h3',
  users: 'M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.7a3.5 3.5 0 0 1 0 6.6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M4.5 12.5l5 5 10-11',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2',
  qr: 'M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h2.5v2.5H14V14zM20 14v2.5M17.5 20H20v-2.5M14 20h1',
  camera: 'M4 8.5h3l1.5-2.5h7L17 8.5h3a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5zM12 16.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z',
  copy: 'M9 9h9.5A1.5 1.5 0 0 1 20 10.5V20a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 20v-9.5A1.5 1.5 0 0 1 9 9zM4.5 15H4a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 4 2.5h9.5A1.5 1.5 0 0 1 15 4v.5',
  share: 'M12 3v13M8 7l4-4 4 4M5 14v5.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V14',
  lock: 'M6.5 10.5h11a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1zM8.5 10.5V7a3.5 3.5 0 1 1 7 0v3.5',
  unlock: 'M6.5 10.5h11a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1zM8.5 10.5V7a3.5 3.5 0 0 1 6.9-.8',
  crown: 'M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 10h-13L4 8z',
  trash: 'M4.5 6.5h15M9.5 6.5V4.5h5v2M7 6.5L8 20h8l1-13.5M10.5 10v6M13.5 10v6',
  refresh: 'M20 12a8 8 0 1 1-2.5-5.8M20 3.5V9h-5.5',
  alert: 'M12 8.5v5M12 17h.01M10.3 3.9L2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'eye-off': 'M4 4l16 16M9.9 5.9A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.4 4.1M6.3 8A17 17 0 0 0 2.5 12S6 18.5 12 18.5c1 0 1.9-.2 2.7-.5M9.9 9.9a3 3 0 0 0 4.2 4.2',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  note: 'M6 3.5h8.5L19 8v12.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1zM14 3.5V8h4.5M8.5 13h7M8.5 16.5h4',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  download: 'M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 19.5h15',
  upload: 'M12 15.5v-11M7.5 9l4.5-4.5L16.5 9M4.5 19.5h15',
  logout: 'M15 5.5V4a1.5 1.5 0 0 0-1.5-1.5h-8A1.5 1.5 0 0 0 4 4v16a1.5 1.5 0 0 0 1.5 1.5h8A1.5 1.5 0 0 0 15 20v-1.5M9.5 12h11M17 8.5l3.5 3.5-3.5 3.5',
  wifi: 'M5 12.5a10 10 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0M12 19.5h.01M1.5 9a15 15 0 0 1 21 0',
  'wifi-off': 'M3 3l18 18M8.5 16a5.5 5.5 0 0 1 6-1.1M5 12.5a10 10 0 0 1 4-2.4M12 19.5h.01M1.5 9a15 15 0 0 1 5-3.3M13 5.6A15 15 0 0 1 22.5 9',
} as const

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number | string
    strokeWidth?: number
  }>(),
  { size: 20, strokeWidth: 1.9 },
)

const d = computed(() => paths[props.name])
</script>

<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="strokeWidth"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="d" />
  </svg>
</template>

<style scoped>
.icon {
  flex: none;
}
</style>
