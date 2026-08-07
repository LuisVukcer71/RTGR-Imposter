import type { ImpostorTerm } from '../shared/types.js'
import { IMPOSTOR_SEED_POOL } from './impostorSeedPool.js'

/**
 * Der verbindliche Startbestand: 350 kuratierte Begriffe, exakt 50 pro Kategorie.
 *
 * Gebraucht an drei Stellen:
 *  - vom Seed-Skript für den Import in PostgreSQL,
 *  - vom Client als Offline-Fallback, damit Impostor ohne Internet spielbar ist,
 *  - vom In-Memory-Speicher für lokale Entwicklung und Tests.
 *
 * Die Daten kommen aus einem TypeScript-Modul statt aus einem JSON-Import.
 * `impostor-seed-pool.json` bleibt die redaktionelle Quelle, wird zur Laufzeit
 * aber von niemandem geladen – `src/data/impostorSeedPool.ts` wird daraus
 * erzeugt (`npm run seeds:generate`), und ein Test wacht über die Deckung.
 */
export const seedTerms: ImpostorTerm[] = IMPOSTOR_SEED_POOL
