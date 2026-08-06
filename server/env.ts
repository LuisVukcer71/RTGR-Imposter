/**
 * Serverseitige Umgebungsvariablen.
 *
 * Secrets kommen ausschließlich aus der Umgebung – nichts davon darf jemals im
 * Frontend-Bundle landen. Fehlt eine Variable, wird das an der Stelle gemeldet,
 * an der sie gebraucht wird, statt beim Start pauschal abzustürzen: die App
 * soll auch ohne Datenbank starten und Impostor offline spielbar bleiben.
 */

function read(name: string): string | undefined {
  const value = process.env[name]
  return value && value.trim() !== '' ? value.trim() : undefined
}

export type StoreKind = 'postgres' | 'memory'

export const env = {
  get databaseUrl(): string | undefined {
    return read('DATABASE_URL') ?? read('POSTGRES_URL')
  },

  /**
   * `postgres` sobald eine DATABASE_URL vorliegt. `memory` ist ein bewusst
   * flüchtiger Adapter für lokale Entwicklung und Tests – er wird in
   * Produktion abgelehnt (siehe `assertProductionReady`).
   */
  get store(): StoreKind {
    const explicit = read('ROOM_STORE')
    if (explicit === 'memory' || explicit === 'postgres') return explicit
    return this.databaseUrl ? 'postgres' : 'memory'
  },

  /** Neon/Supabase verlangen TLS; lokale Instanzen meist nicht. */
  get databaseSsl(): boolean {
    const explicit = read('DATABASE_SSL')
    if (explicit) return explicit !== 'disable' && explicit !== 'false'
    const url = this.databaseUrl ?? ''
    return /sslmode=require/.test(url) || /\.neon\.tech|supabase\.co|vercel-storage\.com/.test(url)
  },

  get adminUsername(): string | undefined {
    return read('ADMIN_USERNAME')
  },

  /** Format: `scrypt$<n>$<r>$<p>$<saltBase64>$<hashBase64>` – siehe scripts/hash-password.ts */
  get adminPasswordHash(): string | undefined {
    return read('ADMIN_PASSWORD_HASH')
  },

  get sessionSecret(): string | undefined {
    return read('SESSION_SECRET')
  },

  get publicBaseUrl(): string | undefined {
    return read('PUBLIC_BASE_URL') ?? read('VITE_PUBLIC_BASE_URL')
  },

  get isProduction(): boolean {
    return read('VERCEL_ENV') === 'production' || read('NODE_ENV') === 'production'
  },

  get isVercel(): boolean {
    return read('VERCEL') === '1'
  },
}

export class ConfigurationError extends Error {
  constructor(readonly variable: string, hint: string) {
    super(`Umgebungsvariable ${variable} fehlt. ${hint}`)
    this.name = 'ConfigurationError'
  }
}

export function requireSessionSecret(): string {
  const secret = env.sessionSecret
  if (!secret || secret.length < 32) {
    throw new ConfigurationError(
      'SESSION_SECRET',
      'Mindestens 32 Zeichen, z. B. via `openssl rand -base64 48`.',
    )
  }
  return secret
}

export function requireDatabaseUrl(): string {
  const url = env.databaseUrl
  if (!url) {
    throw new ConfigurationError(
      'DATABASE_URL',
      'PostgreSQL-Verbindungsstring der Vercel-Umgebung.',
    )
  }
  return url
}

/**
 * Verhindert, dass eine Produktionsinstanz versehentlich mit dem flüchtigen
 * In-Memory-Speicher läuft und Räume beim nächsten Kaltstart verschwinden.
 */
export function assertProductionReady(): void {
  if (env.isProduction && env.store === 'memory') {
    throw new ConfigurationError(
      'DATABASE_URL',
      'In Produktion ist der In-Memory-Speicher nicht zulässig.',
    )
  }
}
