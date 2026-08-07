import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Erzeugt `src/data/impostorSeedPool.ts` aus `src/data/impostor-seed-pool.json`.
 *
 *   npm run seeds:generate
 *
 * Warum ein TypeScript-Modul statt eines JSON-Imports: Vercel kompiliert die
 * Serverdateien einzeln in einen Output-Baum und emittiert dabei keine
 * Nicht-TS-Dateien. Ein `import … from './…json'` ist dort zur Laufzeit nicht
 * auflösbar und lässt die Serverless Function schon beim Modul-Laden abstürzen
 * (FUNCTION_INVOCATION_FAILED). Als Modul wandert der Datensatz mit dem
 * übrigen Code mit.
 *
 * Die JSON-Datei bleibt die redaktionelle Quelle. Läuft sie auseinander,
 * schlägt `src/data/seedPool.test.ts` fehl.
 */

interface RawSeed {
  id: string
  displayTerm: string
  canonicalTerm: string
  hintTerm: string
  category: string
  enabled: boolean
  reviewStatus: string
}

const SOURCE = fileURLToPath(new URL('../src/data/impostor-seed-pool.json', import.meta.url))
const TARGET = fileURLToPath(new URL('../src/data/impostorSeedPool.ts', import.meta.url))

export function renderModule(seeds: RawSeed[]): string {
  const literal = (value: string) => JSON.stringify(value)
  const entries = seeds
    .map(
      (term) => `  {
    id: ${literal(term.id)},
    displayTerm: ${literal(term.displayTerm)},
    canonicalTerm: ${literal(term.canonicalTerm)},
    hintTerm: ${literal(term.hintTerm)},
    category: ${literal(term.category)},
    enabled: ${term.enabled},
    reviewStatus: ${literal(term.reviewStatus)},
  },`,
    )
    .join('\n')

  return `import type { ImpostorTerm } from '../shared/types.js'

/**
 * GENERIERT aus \`impostor-seed-pool.json\` – bitte nicht von Hand bearbeiten.
 * Neu erzeugen mit: \`npm run seeds:generate\`
 *
 * Die Daten liegen bewusst als TypeScript-Modul und nicht als JSON-Import vor.
 * Vercel kompiliert die Serverdateien einzeln in einen Output-Baum und lässt
 * dabei Nicht-TS-Dateien aus; ein \`import … from './…json'\` ist dort zur
 * Laufzeit nicht auflösbar und lässt die Function schon beim Laden abstürzen.
 * Als Modul wandert der Datensatz mit dem übrigen Code mit.
 *
 * Die Typannotation prüft die 350 Einträge zugleich beim Typecheck.
 */
export const IMPOSTOR_SEED_POOL: ImpostorTerm[] = [
${entries}
]
`
}

function main() {
  const seeds = JSON.parse(readFileSync(SOURCE, 'utf8')) as RawSeed[]
  writeFileSync(TARGET, renderModule(seeds))
  console.log(`${seeds.length} Einträge nach src/data/impostorSeedPool.ts geschrieben.`)
}

// Nur ausführen, wenn direkt aufgerufen – der Test importiert `renderModule`.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
