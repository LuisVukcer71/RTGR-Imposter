import type { ApiResponse } from './http'

/**
 * Einheitliche Fehlerform `{ error, message, details? }`. Der Client mappt
 * `error` auf einen lokalisierten Text – die Serverantwort bleibt sprachneutral.
 */
export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiFailure'
  }
}

export const fail = {
  badRequest: (code: string, message = 'Ungültige Anfrage.', details?: unknown) =>
    new ApiFailure(400, code, message, details),
  unauthorized: (code = 'unauthorized', message = 'Nicht angemeldet.') =>
    new ApiFailure(401, code, message),
  forbidden: (code = 'forbidden', message = 'Keine Berechtigung.') =>
    new ApiFailure(403, code, message),
  notFound: (code = 'not_found', message = 'Nicht gefunden.') =>
    new ApiFailure(404, code, message),
  conflict: (code: string, message = 'Konflikt.') => new ApiFailure(409, code, message),
  gone: (code: string, message = 'Nicht mehr verfügbar.') => new ApiFailure(410, code, message),
  tooLarge: () => new ApiFailure(413, 'payload_too_large', 'Anfrage zu groß.'),
  rateLimited: (retryAfterSeconds: number) =>
    new ApiFailure(429, 'rate_limited', 'Zu viele Anfragen.', { retryAfterSeconds }),
  unavailable: (code: string, message: string) => new ApiFailure(503, code, message),
  internal: (message = 'Interner Fehler.') => new ApiFailure(500, 'internal_error', message),
}

export function toResponse(error: unknown): ApiResponse {
  if (error instanceof ApiFailure) {
    const headers: Record<string, string> = {}
    const details = error.details as { retryAfterSeconds?: number } | undefined
    if (error.status === 429 && details?.retryAfterSeconds !== undefined) {
      headers['retry-after'] = String(details.retryAfterSeconds)
    }
    return {
      status: error.status,
      headers,
      body: { error: error.code, message: error.message, details: error.details },
    }
  }

  // Unerwartete Fehler protokollieren, aber nie nach außen durchreichen.
  console.error('[api] Unbehandelter Fehler:', error)
  return {
    status: 500,
    body: { error: 'internal_error', message: 'Interner Fehler.' },
  }
}
