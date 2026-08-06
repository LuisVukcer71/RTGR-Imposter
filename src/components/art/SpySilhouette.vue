<script setup lang="ts">
/**
 * Impostor-Motiv: dunkle Spionsilhouette mit Hut, Mantel und leuchtenden Augen.
 * Rein dekorativ, deshalb `aria-hidden`.
 */
withDefaults(defineProps<{ eyes?: boolean }>(), { eyes: true })
</script>

<template>
  <svg class="spy" viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="spyBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#04231f" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#01100f" stop-opacity="0.98" />
      </linearGradient>
      <radialGradient id="spyEye">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="60%" stop-color="#dffaf4" />
        <stop offset="100%" stop-color="#8fe6d6" stop-opacity="0.15" />
      </radialGradient>
    </defs>

    <!-- Mantel und Schultern -->
    <path
      d="M60 66c-13 0-21 5-27 11-8 8-13 21-15 43h84c-2-22-7-35-15-43-6-6-14-11-27-11z"
      fill="url(#spyBody)"
    />
    <!-- Kragen -->
    <path
      d="M47 70l13 22 13-22-6-4-7 9-7-9z"
      fill="#02191a"
      opacity="0.9"
    />
    <!-- Kopf -->
    <path
      d="M60 30c-11 0-19 8-19 19v6c0 10 8 18 19 18s19-8 19-18v-6c0-11-8-19-19-19z"
      fill="url(#spyBody)"
    />
    <!-- Hutkrempe -->
    <ellipse cx="60" cy="38" rx="41" ry="8.5" fill="#021513" />
    <!-- Hutkopf -->
    <path
      d="M42 38V25c0-6 4-11 10-12h16c6 1 10 6 10 12v13z"
      fill="#03201d"
    />
    <path d="M41.5 33.5h37v5.5h-37z" fill="#010c0c" opacity="0.85" />

    <!-- Augen -->
    <g v-if="eyes">
      <path d="M48 52c3-3 7-3 10 0-3 3-7 3-10 0z" fill="url(#spyEye)" />
      <path d="M62 52c3-3 7-3 10 0-3 3-7 3-10 0z" fill="url(#spyEye)" />
    </g>
  </svg>
</template>

<style scoped>
.spy {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 6px 14px rgb(0 0 0 / 45%));
}
</style>
