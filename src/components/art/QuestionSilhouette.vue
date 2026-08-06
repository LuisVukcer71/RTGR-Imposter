<script setup lang="ts">
/**
 * Wer-bin-ich-Motiv: Personensilhouette mit Fragezeichen im Gesicht.
 * Rein dekorativ, deshalb `aria-hidden`.
 */
</script>

<template>
  <svg class="who" viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="whoBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7b3208" stop-opacity="0.92" />
        <stop offset="100%" stop-color="#3a1504" stop-opacity="0.96" />
      </linearGradient>
    </defs>

    <!-- Schultern -->
    <path
      d="M60 70c-15 0-25 6-31 14-5 7-8 20-9 36h80c-1-16-4-29-9-36-6-8-16-14-31-14z"
      fill="url(#whoBody)"
    />
    <!-- Kopf -->
    <path
      d="M60 16c-14 0-24 10-24 24v8c0 13 10 22 24 22s24-9 24-22v-8c0-14-10-24-24-24z"
      fill="url(#whoBody)"
    />
    <!-- Haaransatz -->
    <path
      d="M36 40c0-14 10-24 24-24 12 0 21 7 23 18-6-4-14-6-23-6-10 0-18 4-24 12z"
      fill="#0f0703"
      opacity="0.35"
    />
    <!-- Fragezeichen -->
    <path
      d="M53.4 36.4c0-4 3-6.9 7.3-6.9 4.2 0 7.2 2.6 7.2 6.3 0 3-1.5 4.7-4.4 6.6-2.5 1.6-3.3 2.8-3.3 5.2v1.6h-5.3v-2c0-3.7 1.2-5.6 4.3-7.6 2.4-1.6 3.1-2.4 3.1-3.8 0-1.4-1.1-2.4-2.8-2.4-1.8 0-3 1.1-3 2.9zM57.4 58.6a3.2 3.2 0 1 1 6.4 0 3.2 3.2 0 0 1-6.4 0z"
      fill="#180a02"
      opacity="0.62"
    />
  </svg>
</template>

<style scoped>
.who {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 6px 14px rgb(0 0 0 / 45%));
}
</style>
