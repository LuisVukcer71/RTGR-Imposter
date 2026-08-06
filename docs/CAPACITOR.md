# Portierung nach iOS und Android mit Capacitor

Die Web-App ist so gebaut, dass sie ohne Umbau in eine dünne native Hülle passt.
Dieses Dokument beschreibt die verbleibenden Schritte – ausgeführt wurde davon
noch nichts.

## Was bereits vorbereitet ist

| Anforderung | Umsetzung |
| --- | --- |
| Geschäftslogik von UI getrennt | Regeln in `src/shared/`, Zustand in `src/stores/`, Views enthalten keine Spiellogik |
| Keine verstreuten `localStorage`-Aufrufe | ausschließlich `src/services/storage.ts` mit austauschbarem `StorageAdapter` |
| Haptik gekapselt | `src/services/haptics.ts` mit `setHapticsImpl()` |
| Audio gekapselt | `src/services/audio.ts` mit `setAlarmImpl()`, nur der Timeralarm |
| Netzwerk gekapselt | `src/services/http.ts`, keine `fetch`-Aufrufe in Views |
| Keine hartcodierten Web-URLs | `src/config/runtime.ts` und `roomDeepLink()` |
| Deep Links | Route `/room/:code`, QR-Code enthält den vollständigen Link |
| Kamera gekapselt | `src/components/whoami/QrScanner.vue` als einziger Zugriffspunkt |

## Schritte

### 1. Capacitor einrichten

```sh
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init "komm 10te" app.komm10te --web-dir=dist
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

### 2. Server-URL setzen

Die native Hülle lädt das gebaute Frontend lokal, spricht die API aber weiterhin
über HTTPS an. In `capacitor.config.ts`:

```ts
const config: CapacitorConfig = {
  appId: 'app.komm10te',
  appName: 'komm 10te',
  webDir: 'dist',
  server: {
    // Für Deep Links und damit relative /api-Aufrufe das Deployment treffen.
    hostname: 'komm10te.example.com',
    androidScheme: 'https',
  },
}
```

Zusätzlich `VITE_PUBLIC_BASE_URL` auf die öffentliche URL setzen, damit QR-Codes
auf das Web-Deployment zeigen und nicht auf `capacitor://localhost`.

### 3. Adapter austauschen

In `src/main.ts` vor dem Mount, abhängig von `Capacitor.isNativePlatform()`:

```ts
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { setStorageAdapter } from '@/services/storage'
import { setHapticsImpl } from '@/services/haptics'

if (Capacitor.isNativePlatform()) {
  setHapticsImpl({
    supported: true,
    vibrate: () => void Haptics.impact({ style: ImpactStyle.Medium }),
    cancel: () => undefined,
  })
  // Preferences ist asynchron: beim Start einmal in einen synchronen Cache laden
  // und Schreibvorgänge durchreichen.
  setStorageAdapter(createPreferencesAdapter(await Preferences.keys()))
}
```

`StorageAdapter` ist bewusst synchron, weil Pinia-Stores beim Aufbau lesen. Für
Capacitor wird deshalb beim Start einmal alles in eine Map geladen und danach
gespiegelt geschrieben.

### 4. QR-Scanner ersetzen

`BarcodeDetector` gibt es nativ nicht. `QrScanner.vue` ist der einzige
Zugriffspunkt; dort auf `@capacitor-mlkit/barcode-scanning` umstellen und die
Kameraberechtigung in `Info.plist` (`NSCameraUsageDescription`) und
`AndroidManifest.xml` (`android.permission.CAMERA`) eintragen.

### 5. Deep Links registrieren

- **iOS:** Associated Domains `applinks:komm10te.example.com`, dazu
  `apple-app-site-association` auf dem Server.
- **Android:** Intent-Filter für `https://komm10te.example.com/room/*` plus
  `assetlinks.json`.

Die Route existiert bereits; es ist nur die Plattformregistrierung nötig.

### 6. Safe Areas und Statusleiste

Die App nutzt bereits `env(safe-area-inset-*)` und `viewport-fit=cover`. Nativ
zusätzlich `@capacitor/status-bar` mit `Style.Dark` und Hintergrund `#0a0e15`
setzen, damit die Statusleiste zum Design passt.

### 7. Bauen

```sh
npm run build
npx cap sync
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

## Offene Punkte

- App-Store-Icons und Splashscreens werden aus `public/icons/` abgeleitet, müssen
  aber in den plattformspezifischen Größen erzeugt werden.
- Der Service Worker ist in der nativen Hülle überflüssig; das Precaching
  übernimmt dort das Bundle selbst.
- Für Push-Benachrichtigungen (aktuell nicht vorgesehen) wäre ein weiterer
  Adapter nötig.
