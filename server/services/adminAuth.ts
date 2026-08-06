import { ADMIN } from '@shared/config'
import { env } from '../env'
import { fail } from '../errors'
import type { ApiRequest, SetCookie } from '../http'
import { getStore } from '../store'
import { randomToken, safeEqual, sha256, verifyPassword } from './crypto'

/**
 * Adminauthentifizierung.
 *
 * Zugangsdaten kommen ausschließlich aus der Umgebung (`ADMIN_USERNAME`,
 * `ADMIN_PASSWORD_HASH`). Der Browser bekommt ein zufälliges, opakes Token im
 * HTTP-only-Cookie; in der Datenbank liegt nur dessen SHA-256-Hash. Dadurch ist
 * ein Logout eine echte Invalidierung und ein Datenbankleck gibt keine
 * gültigen Sessions preis.
 */

export interface AdminIdentity {
  username: string
  tokenHash: string
}

export function adminConfigured(): boolean {
  return Boolean(env.adminUsername && env.adminPasswordHash)
}

export async function login(
  username: string,
  password: string,
  ip: string,
): Promise<{ cookie: SetCookie }> {
  if (!adminConfigured()) {
    throw fail.unavailable(
      'admin_not_configured',
      'ADMIN_USERNAME und ADMIN_PASSWORD_HASH sind nicht gesetzt.',
    )
  }

  const store = getStore()
  // Brute-Force-Bremse pro IP, serverseitig.
  const limit = await store.rateLimit.hit(
    'admin_login',
    sha256(ip),
    ADMIN.loginAttemptsPerHour,
    60 * 60 * 1000,
  )
  if (!limit.allowed) throw fail.rateLimited(limit.retryAfterSeconds)

  const expectedUser = env.adminUsername as string
  const passwordOk = await verifyPassword(password, env.adminPasswordHash as string)
  // Beide Prüfungen immer ausführen, damit die Antwortzeit nichts verrät.
  if (!safeEqual(username.trim(), expectedUser) || !passwordOk) {
    throw fail.unauthorized('invalid_credentials', 'Benutzername oder Passwort falsch.')
  }

  const token = randomToken(32)
  const expiresAt = new Date(Date.now() + ADMIN.sessionTtlMs).toISOString()
  await store.admin.createSession(sha256(token), expectedUser, expiresAt)
  await store.admin.purgeExpiredSessions(new Date().toISOString())
  await store.admin.logAction(expectedUser, 'admin_login', null, {})

  return {
    cookie: {
      name: ADMIN.cookieName,
      value: token,
      httpOnly: true,
      secure: env.isProduction,
      sameSite: 'Strict',
      path: '/',
      maxAgeSeconds: Math.floor(ADMIN.sessionTtlMs / 1000),
    },
  }
}

export function clearCookie(): SetCookie {
  return {
    name: ADMIN.cookieName,
    value: '',
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'Strict',
    path: '/',
    maxAgeSeconds: 0,
  }
}

/** Wirft 401, wenn keine gültige Session vorliegt. Für jede Admin-Route Pflicht. */
export async function requireAdmin(req: ApiRequest): Promise<AdminIdentity> {
  const token = req.cookies[ADMIN.cookieName]
  if (!token) throw fail.unauthorized()

  const tokenHash = sha256(token)
  const session = await getStore().admin.findSession(tokenHash)
  if (!session) throw fail.unauthorized()
  if (session.revokedAt) throw fail.unauthorized('session_revoked', 'Sitzung abgemeldet.')
  if (Date.parse(session.expiresAt) < Date.now())
    throw fail.unauthorized('session_expired', 'Sitzung abgelaufen.')

  return { username: session.username, tokenHash }
}

export async function logout(identity: AdminIdentity): Promise<void> {
  const store = getStore()
  await store.admin.revokeSession(identity.tokenHash)
  await store.admin.logAction(identity.username, 'admin_logout', null, {})
}
