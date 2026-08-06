import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { env } from '../env'

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const
const KEY_LENGTH = 32

/** Kryptografisch zufälliges Token, URL-sicher. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/** SHA-256-Hex. Für Tokens, die selbst schon hohe Entropie haben. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/**
 * Gepfefferter Hash für pseudonyme Kennungen (Gerät, IP).
 *
 * Der Pfeffer kommt aus SESSION_SECRET. Ohne gesetztes Secret wird ein
 * prozesslokaler Zufallswert verwendet – dann sind die Hashes nach einem
 * Neustart nicht mehr verknüpfbar, was für lokale Entwicklung genau richtig ist.
 */
const fallbackPepper = randomBytes(32).toString('hex')

export function pseudonymize(value: string, namespace: string): string {
  const pepper = env.sessionSecret ?? fallbackPepper
  return createHash('sha256').update(`${namespace}:${pepper}:${value}`).digest('hex')
}

/**
 * Passwort-Hash im Format `scrypt:N:r:p:saltB64:hashB64`.
 *
 * Trennzeichen ist bewusst `:` und nicht `$`: Werte in `.env`-Dateien laufen
 * durch eine Variablen-Expansion, die `$16384` als Platzhalter interpretieren
 * und den Hash stillschweigend zerstören würde.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, SCRYPT_PARAMS)
  return [
    'scrypt',
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join(':')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, n, r, p, saltB64, hashB64] = parts as [string, string, string, string, string, string]
  const expected = Buffer.from(hashB64, 'base64')
  let derived: Buffer
  try {
    derived = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    })
  } catch {
    return false
  }
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}

/** Konstantzeit-Vergleich für Tokens und Benutzernamen. */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}
