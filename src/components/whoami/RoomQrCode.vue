<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'
import { roomDeepLink } from '@/config/runtime'

/**
 * QR-Code mit **Deep Link**, nicht nur dem Klartextcode – so landet man mit
 * einem Scan direkt im Raum. Bewusst nicht animiert.
 */
const props = defineProps<{ code: string; size?: number }>()

const dataUrl = ref('')
const link = ref('')

async function render() {
  link.value = roomDeepLink(props.code)
  dataUrl.value = await QRCode.toDataURL(link.value, {
    width: (props.size ?? 200) * 2,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#05080d', light: '#ffffff' },
  })
}

onMounted(render)
watch(() => props.code, render)
</script>

<template>
  <figure class="qr">
    <img v-if="dataUrl" :src="dataUrl" :alt="link" :width="size ?? 200" :height="size ?? 200" />
    <figcaption class="qr__code">{{ code }}</figcaption>
  </figure>
</template>

<style scoped>
.qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-3);
  margin: 0;
}

.qr img {
  display: block;
  max-width: 100%;
  height: auto;
  padding: var(--s-3);
  background: #fff;
  border-radius: var(--r-lg);
  box-shadow: var(--sh-raised);
}

.qr__code {
  font-size: var(--fs-2xl);
  font-weight: 800;
  letter-spacing: 0.22em;
  color: var(--c-accent);
}
</style>
