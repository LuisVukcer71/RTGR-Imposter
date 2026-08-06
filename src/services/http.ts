import { runtimeConfig } from '@/config/runtime'
import type { ApiError } from '@shared/types'

/**
 * Dünner HTTP-Client für die eigene API. Kapselt Basis-URL, JSON-Handling und
 * eine einheitliche Fehlerform, damit Views nie direkt `fetch` aufrufen.
 */

export class HttpError extends Error {
  constructor(
    readonly status: number,
    /** Maschinenlesbarer Code, z. B. `name_taken`. */
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

/** Kein Netz, DNS-Fehler, abgebrochene Anfrage. */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('network_unavailable')
    this.name = 'NetworkError'
    this.cause = cause
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  query?: Record<string, string | number | boolean | undefined>
  /** Zusätzliche Header, z. B. das Rejoin-Token eines Spielers. */
  headers?: Record<string, string>
  /** Für Admin-Endpunkte: Session-Cookie mitsenden. */
  credentials?: RequestCredentials
  timeoutMs?: number
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = path.startsWith('/api') ? path : `${runtimeConfig.apiBase}${path}`
  if (!query) return base
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    signal,
    headers,
    credentials = 'same-origin',
    timeoutMs = 15000,
  } = options

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true })

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials,
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (cause) {
    throw new NetworkError(cause)
  } finally {
    clearTimeout(timeout)
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const error = (payload ?? {}) as Partial<ApiError>
    throw new HttpError(
      response.status,
      error.error ?? `http_${response.status}`,
      error.message ?? response.statusText,
      error.details,
    )
  }

  return payload as T
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE', body }),
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}
