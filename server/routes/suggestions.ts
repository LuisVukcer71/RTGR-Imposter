import { SUGGESTIONS } from '../../src/shared/config.js'
import { validateSuggestion } from '../../src/shared/validation.js'
import { fail } from '../errors.js'
import { json, type Handler } from '../http.js'
import { pseudonymize } from '../services/crypto.js'
import { getStore } from '../store/index.js'

/**
 * Öffentliches Vorschlagsformular.
 *
 * Das Limit von 10 Vorschlägen pro Stunde wird serverseitig durchgesetzt und
 * greift zweifach: über die anonyme Browserkennung *und* über einen gehashten
 * IP-Schlüssel. Ein neuer Inkognito-Tab umgeht damit nicht das Limit.
 */
const WINDOW_MS = 60 * 60 * 1000

export const postSuggestion: Handler = async (req) => {
  const payload = (req.body ?? {}) as Record<string, unknown>

  const clientId = typeof payload.clientId === 'string' ? payload.clientId : ''
  if (!clientId || clientId.length < 8) {
    throw fail.badRequest('client_id_missing', 'Anonyme Browserkennung fehlt.')
  }

  const validation = validateSuggestion({
    displayTerm: String(payload.displayTerm ?? ''),
    canonicalTerm: String(payload.canonicalTerm ?? ''),
    hintTerm: String(payload.hintTerm ?? ''),
    category: String(payload.category ?? ''),
    explanation: payload.explanation === undefined ? null : String(payload.explanation),
  })
  if (!validation.ok) throw fail.badRequest(validation.reason, 'Vorschlag unvollständig.')

  const store = getStore()
  const submitterHash = pseudonymize(clientId, 'suggestion-client')
  const ipHash = pseudonymize(req.ip, 'suggestion-ip')

  for (const subject of [submitterHash, ipHash]) {
    const limit = await store.rateLimit.hit(
      'suggestions',
      subject,
      SUGGESTIONS.ratePerHour,
      WINDOW_MS,
    )
    if (!limit.allowed) throw fail.rateLimited(limit.retryAfterSeconds)
  }

  const created = await store.suggestions.create({
    ...validation.value,
    submitterHash,
    ipHash,
  })

  // Keine automatische Veröffentlichung: der Vorschlag landet ausschließlich
  // in der Moderationswarteschlange.
  return json({ id: created.id, status: created.status }, 201)
}
