import type { AnalyticsSummary, TermSuggestion, TermUsageRow } from '@shared/types'
import type { CategoryName, ReviewStatus, SuggestionStatus } from '@shared/config'
import { http } from '@/services/http'

/** Typisierter Zugriff auf die Admin-API. Alle Aufrufe senden das Session-Cookie. */

export interface AdminTerm {
  id: string
  displayTerm: string
  canonicalTerm: string
  hintTerm: string
  category: CategoryName
  enabled: boolean
  reviewStatus: ReviewStatus
  drawCount: number
  lastUsedAt: string | null
  updatedAt: string
}

export interface TermListResponse {
  rows: AdminTerm[]
  total: number
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary
  termUsage: TermUsageRow[]
  termsByCategory: Array<{ category: string; enabled: number; disabled: number }>
}

export const adminApi = {
  session: () => http.get<{ username: string; store: string }>('/admin/session'),
  login: (username: string, password: string) =>
    http.post<{ ok: true }>('/admin/login', { username, password }),
  logout: () => http.post<{ ok: true }>('/admin/logout'),

  terms: (params: Record<string, string | number | boolean | undefined>) =>
    http.get<TermListResponse>('/admin/terms', { query: params }),
  createTerm: (input: Partial<AdminTerm>) => http.post<AdminTerm>('/admin/terms', input),
  updateTerm: (id: string, patch: Partial<AdminTerm>) =>
    http.patch<AdminTerm>(`/admin/terms/${id}`, patch),
  deleteTerm: (id: string) => http.delete<void>(`/admin/terms/${id}`),
  importTerms: (payload: { csv?: string; rows?: unknown[] }) =>
    http.post<{ created: number; skipped: number; problems: string[] }>(
      '/admin/terms/import',
      payload,
    ),

  suggestions: (status?: SuggestionStatus) =>
    http.get<{ rows: TermSuggestion[]; total: number }>('/admin/suggestions', {
      query: { status },
    }),
  updateSuggestion: (id: string, patch: Record<string, unknown>) =>
    http.patch<TermSuggestion>(`/admin/suggestions/${id}`, patch),
  convertSuggestion: (id: string, enable: boolean) =>
    http.post<{ suggestion: TermSuggestion; term: AdminTerm }>(
      `/admin/suggestions/${id}/convert`,
      { enable },
    ),

  analytics: (range: string, from?: string, to?: string) =>
    http.get<AnalyticsResponse>('/admin/analytics', { query: { range, from, to } }),
  deleteAnalytics: (payload: Record<string, unknown>, range?: string) =>
    http.delete<{ deleted: number; scope: string }>(
      `/admin/analytics${range ? `?range=${range}` : ''}`,
      payload,
    ),

  audit: () =>
    http.get<{
      rows: Array<{
        id: string
        actor: string
        action: string
        target: string | null
        createdAt: string
      }>
    }>('/admin/audit'),
}
