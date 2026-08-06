<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { t } from '@/i18n'
import { WHO_AM_I } from '@shared/config'

/**
 * QR-Scanner über die native `BarcodeDetector`-API.
 *
 * Browser ohne diese API (aktuell vor allem iOS Safari) bekommen einen klaren
 * Hinweis, den Code einzutippen – ein zusätzliches Decoder-Bundle wäre für
 * einen sechsstelligen Code unverhältnismäßig.
 */
const emit = defineEmits<{ detected: [code: string]; close: [] }>()

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>
}
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike

const video = ref<HTMLVideoElement | null>(null)
const error = ref<string | null>(null)
const scanning = ref(false)

let stream: MediaStream | null = null
let frame = 0

const CODE_PATTERN = new RegExp(`[${WHO_AM_I.roomCodeAlphabet}]{${WHO_AM_I.roomCodeLength}}`)

/** Akzeptiert sowohl den Deep Link als auch einen reinen Code. */
function extractCode(raw: string): string | null {
  const fromPath = /\/room\/([A-Z0-9]+)/i.exec(raw)?.[1]
  const candidate = (fromPath ?? raw).trim().toUpperCase()
  const match = CODE_PATTERN.exec(candidate)
  return match ? match[0] : null
}

async function start() {
  const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
  if (!Detector) {
    error.value = t('whoami.entry.scan.unsupported')
    return
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
  } catch {
    error.value = t('whoami.entry.scan.denied')
    return
  }

  const element = video.value
  if (!element) return
  element.srcObject = stream
  await element.play()
  scanning.value = true

  const detector = new Detector({ formats: ['qr_code'] })
  const tick = async () => {
    if (!scanning.value || !video.value) return
    try {
      const results = await detector.detect(video.value)
      for (const result of results) {
        const code = extractCode(result.rawValue)
        if (code) {
          stop()
          emit('detected', code)
          return
        }
      }
    } catch {
      // Einzelne fehlgeschlagene Frames sind normal.
    }
    frame = requestAnimationFrame(() => void tick())
  }
  void tick()
}

function stop() {
  scanning.value = false
  cancelAnimationFrame(frame)
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
}

onBeforeUnmount(stop)
void start()
</script>

<template>
  <div class="scanner">
    <video ref="video" class="scanner__video" playsinline muted />
    <div v-if="scanning" class="scanner__frame" aria-hidden="true" />
    <p v-if="error" class="scanner__error">{{ error }}</p>
    <AppButton variant="ghost" block @click="stop(); emit('close')">
      {{ t('common.close') }}
    </AppButton>
  </div>
</template>

<style scoped>
.scanner {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.scanner__video {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  background: #000;
  border-radius: var(--r-lg);
}

.scanner__frame {
  position: absolute;
  inset: 18% 18% auto;
  aspect-ratio: 1;
  border: 2px solid var(--c-accent);
  border-radius: var(--r-lg);
  box-shadow: 0 0 0 100vmax rgb(0 0 0 / 35%);
  pointer-events: none;
}

.scanner__error {
  font-size: var(--fs-sm);
  color: var(--c-warning);
}
</style>
