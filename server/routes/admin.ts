import { CATEGORIES, REVIEW_STATUSES, SUGGESTION_STATUSES } from '../../src/shared/config.js'
import { isCategoryName, normalizeTerm } from '../../src/shared/validation.js'
import type { ReviewStatus, SuggestionStatus } from '../../src/shared/config.js'
import { fail } from '../errors.js'
import { json, noContent, type ApiRequest, type Handler } from '../http.js'
import * as auth from '../services/adminAuth.js'
import { summarize, exportRange } from '../services/analyticsQuery.js'
import { runMaintenance } from '../services/maintenance.js'
import { getStore } from '../store/index.js'
import type { TermInput } from '../store/types.js'

/**
 * Admin-API. Jede Route außer `login` ruft zuerst `requireAdmin` auf – die
 * Absicherung liegt vollständig serverseitig, das Frontend blendet nur aus.
 */

function bodyOf(req: ApiRequest): Record<string, unknown> {
  return (req.body ?? {}) as Record<string, unknown>
}

function parseRange(req: ApiRequest): { from: string; to: string } {
  const now = Date.now()
  const preset = req.query.get('range') ?? '7d'
  const explicitFrom = req.query.get('from')
  const explicitTo = req.query.get('to')

  if (explicitFrom && explicitTo) {
    const from = Date.parse(explicitFrom)
    const to = Date.parse(explicitTo)
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) {
      throw fail.badRequest('range_invalid', 'Ungültiger Zeitraum.')
    }
    return { from: new Date(from).toISOString(), to: new Date(to).toISOString() }
  }

  const spans: Record<string, number> = {
    '24h': 24 * 3600_000,
    '7d': 7 * 24 * 3600_000,
    '30d': 30 * 24 * 3600_000,
  }
  const span = spans[preset]
  if (span === undefined) throw fail.badRequest('range_invalid', 'Unbekannter Zeitraum.')
  return { from: new Date(now - span).toISOString(), to: new Date(now).toISOString() }
}

/* ----------------------------- Session ---------------------------- */

export const postLogin: Handler = async (req) => {
  const body = bodyOf(req)
  const { cookie } = await auth.login(
    String(body.username ?? ''),
    String(body.password ?? ''),
    req.ip,
  )
  return json({ ok: true }, 200, { cookies: [cookie] })
}

export const postLogout: Handler = async (req) => {
  const identity = await auth.requireAdmin(req)
  await auth.logout(identity)
  return json({ ok: true }, 200, { cookies: [auth.clearCookie()] })
}

export const getSession: Handler = async (req) => {
  const identity = await auth.requireAdmin(req)
  return json({ username: identity.username, store: getStore().kind })
}

/* ---------------------------- Kategorien -------------------------- */

export const getCategories: Handler = async (req) => {
  await auth.requireAdmin(req)
  const counts = await getStore().terms.countByCategory()
  return json({ categories: CATEGORIES, counts })
}

/* ------------------------------ Wörter ---------------------------- */

function parseTermInput(raw: Record<string, unknown>, partial: boolean): Partial<TermInput> {
  const input: Partial<TermInput> = {}

  if (raw.displayTerm !== undefined) input.displayTerm = normalizeTerm(String(raw.displayTerm))
  if (raw.canonicalTerm !== undefined) input.canonicalTerm = normalizeTerm(String(raw.canonicalTerm))
  if (raw.hintTerm !== undefined) input.hintTerm = normalizeTerm(String(raw.hintTerm))
  if (raw.enabled !== undefined) input.enabled = raw.enabled === true
  if (raw.note !== undefined) input.note = raw.note === null ? null : String(raw.note)
  if (Array.isArray(raw.tags)) input.tags = raw.tags.map(String).slice(0, 12)

  if (raw.category !== undefined) {
    if (!isCategoryName(raw.category)) throw fail.badRequest('category_invalid', 'Unbekannte Kategorie.')
    input.category = raw.category
  }
  if (raw.reviewStatus !== undefined) {
    if (!(REVIEW_STATUSES as readonly string[]).includes(String(raw.reviewStatus)))
      throw fail.badRequest('review_status_invalid', 'Unbekannter Reviewstatus.')
    input.reviewStatus = raw.reviewStatus as ReviewStatus
  }

  if (!partial) {
    for (const field of ['displayTerm', 'canonicalTerm', 'hintTerm', 'category'] as const) {
      if (!input[field]) throw fail.badRequest(`${field}_missing`, 'Pflichtfeld fehlt.')
    }
  }
  return input
}

export const listTerms: Handler = async (req) => {
  await auth.requireAdmin(req)
  const enabledParam = req.query.get('enabled')
  const result = await getStore().terms.list({
    search: req.query.get('search') ?? undefined,
    category: req.query.get('category') ?? undefined,
    enabled: enabledParam === null ? undefined : enabledParam === 'true',
    reviewStatus: (req.query.get('reviewStatus') as ReviewStatus | null) ?? undefined,
    limit: Math.min(Number(req.query.get('limit') ?? 50), 200),
    offset: Math.max(Number(req.query.get('offset') ?? 0), 0),
  })
  return json(result)
}

export const createTerm: Handler = async (req) => {
  const identity = await auth.requireAdmin(req)
  const input = parseTermInput(bodyOf(req), false) as TermInput
  input.enabled ??= false
  input.reviewStatus ??= 'needs_human_review'

  const store = getStore()
  const duplicate = await store.terms.findDuplicate(input.displayTerm, input.category)
  if (duplicate) throw fail.conflict('duplicate_term', 'Dieser Begriff existiert bereits.')

  const created = await store.terms.create(input)
  await store.admin.logAction(identity.username, 'term_created', created.id, {
    displayTerm: created.displayTerm,
  })
  return json(created, 201)
}

export const updateTerm: Handler = async (req) => {
  const identity = await auth.requireAdmin(req)
  const id = req.params.id ?? ''
  const patch = parseTermInput(bodyOf(req), true)
  const store = getStore()
  const updated = await store.terms.update(id, patch)
  if (!updated) throw fail.notFound('term_not_found', 'Begriff nicht gefunden.')
  await store.admin.logAction(identity.username, 'term_updated', id, { fields: Object.keys(patch) })
  return json(updated)
}

export const deleteTerm: Handler = async (req) => {
  const identity = await auth.requireAdmin(req)
  const id = req.params.id ?? ''
  const store = getStore()
  const removed = await store.terms.remove(id)
  if (!removed) throw fail.notFound('term_not_found', 'Begriff nicht gefunden.')
  await store.admin.logAction(identity.username, 'term_deleted', id, {})
  return noContent()
}

export const exportTerms: Handler = async (req) => {
  await auth.requireAdmin(req)
  const format = req.query.get('format') ?? 'json'
  const { rows } = await getStore().terms.list({ limit: 10_000 })

  if (format === 'csv') {
    const header = 'displayTerm,canonicalTerm,hintTerm,category,enabled,reviewStatus'
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const lines = rows.map((row) =>
      [
        escape(row.displayTerm),
        escape(row.canonicalTerm),
        escape(row.hintTerm),
        escape(row.category),
        row.enabled,
        row.reviewStatus,
      ].join(','),
    )
    return {
      status: 200,
      body: [header, ...lines].join('\n'),
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="komm10te-terms.csv"',
      },
    }
  }

  return json(rows, 200, {
    headers: { 'content-disposition': 'attachment; filename="komm10te-terms.json"' },
  })
}

/** CSV oder JSON. Importierte Einträge bleiben deaktiviert und ungeprüft. */
export const importTerms: Handler = async (req) => {
  const identity = await auth.requireAdmin(req)
  const body = bodyOf(req)
  const rows = Array.isArray(body.rows) ? body.rows : parseCsv(String(body.csv ?? ''))

  const store = getStore()
  let created = 0
  let skipped = 0
  const problems: string[] = []

  for (const entry of rows.slice(0, 2000)) {
    const raw = entry as Record<string, unknown>
    try {
      const input = parseTermInput(raw, false) as TermInput
      // Nie unkontrolliert aktivieren – Import erzeugt immer Entwürfe.
      input.enabled = false
      input.reviewStatus = 'needs_human_review'
      const duplicate = await store.terms.findDuplicate(input.displayTerm, input.category)
      if (duplicate) {
        skipped++
        continue
      }
      await store.terms.create(input)
      created++
    } catch (error) {
      skipped++
      if (problems.length < 20) {
        problems.push(`${String(raw.displayTerm ?? '?')}: ${(error as Error).message}`)
      }
    }
  }

  await store.admin.logAction(identity.username, 'terms_imported', null, { created, skipped })
  return json({ created, skipped, problems })
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
  const header = lines.shift()
  if (!header) return []
  const columns = splitCsvLine(header).map((column) => column.trim())
  return lines.map((line) => {
    const cells = splitCsvLine(line)
    const row: Record<string, string> = {}
    columns.forEach((column, index) => {
      row[column] = cells[index] ?? ''
    })
    return row
  })
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"'
        index++
      } else if (char === '"') {
        quoted = false
      } else {
        current += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}

/* ---------------------------- Vorschläge -------------------------- */

export const listSuggestions: Handler = async (req) => {
  await auth.requireAdmin(req)
  const status = req.query.get('status')
  if (status && !(SUGGESTION_STATUSES as readonly string[]).includes(status)) {
    throw fail.badRequest('status_invalid', 'Unbekannter Status.')
  }
  const result = await getStore().suggestions.list({
    status: (status as SuggestionStatus | null) ?? undefined,
    limit: Math.min(Number(req.query.get('limit') ?? 50), 200),
    offset: Math.max(Number(req.query.get('offset') ?? 0), 0),
  })
  return json(result)
}

export const updateSuggestion: Handler = async (req) => {
  const identity = await auth.requireAdmin(req)
  const id = req.params.id ?? ''
  const body = bodyOf(req)
  const patch: Record<string, unknown> = {}

  if (body.displayTerm !== undefined) patch.displayTerm = normalizeTerm(String(body.displayTerm))
  if (body.canonicalTerm !== undefined)
    patch.canonicalTerm = normalizeTerm(String(body.canonicalTerm))
  if (body.hintTerm !== undefined) patch.hintTerm = normalizeTerm(String(body.hintTerm))
  if (body.explanation !== undefined)
    patch.explanation = body.explanation === null ? null : String(body.explanation)
  if (body.reviewNote !== undefined)
    patch.reviewNote = body.reviewNote === null ? null : String(body.reviewNote)
  if (body.category !== undefined) {
    if (!isCategoryName(body.category)) throw fail.badRequest('category_invalid', 'Unbekannte Kategorie.')
    patch.category = body.category
  }
  if (body.status !== undefined) {
    if (!(SUGGESTION_STATUSES as readonly string[]).includes(String(body.status)))
      throw fail.badRequest('status_invalid', 'Unbekannter Status.')
    patch.status = body.status
  }

  const updated = await getStore().suggestions.update(id, patch)
  if (!updated) throw fail.notFound('suggestion_not_found', 'Vorschlag nicht gefunden.')
  await getStore().admin.logAction(identity.username, 'suggestion_updated', id, {
    status: updated.status,
  })
  return json(updated)
}

/** Wandelt einen Vorschlag in einen Wortpool-Eintrag um – bewusst deaktiviert. */
export const convertSuggestion: Handler = async (req) => {
  const identity = await auth.requireAdmin(req)
  const id = req.params.id ?? ''
  const store = getStore()

  const suggestion = await store.suggestions.getById(id)
  if (!suggestion) throw fail.notFound('suggestion_not_found', 'Vorschlag nicht gefunden.')
  if (suggestion.convertedTermId) throw fail.conflict('already_converted', 'Bereits übernommen.')

  const body = bodyOf(req)
  const enable = body.enable === true

  const duplicate = await store.terms.findDuplicate(suggestion.displayTerm, suggestion.category)
  if (duplicate) {
    await store.suggestions.update(id, { status: 'duplicate' })
    throw fail.conflict('duplicate_term', 'Dieser Begriff existiert bereits im Pool.')
  }

  const term = await store.terms.create({
    displayTerm: suggestion.displayTerm,
    canonicalTerm: suggestion.canonicalTerm,
    hintTerm: suggestion.hintTerm,
    category: suggestion.category,
    enabled: enable,
    reviewStatus: enable ? 'approved' : 'needs_human_review',
  })

  const updated = await store.suggestions.update(id, {
    status: 'accepted',
    convertedTermId: term.id,
  })
  await store.admin.logAction(identity.username, 'suggestion_converted', id, { termId: term.id })
  return json({ suggestion: updated, term }, 201)
}

/* ---------------------------- Analytics --------------------------- */

export const getAnalytics: Handler = async (req) => {
  await auth.requireAdmin(req)
  const range = parseRange(req)
  const [summary, usage, byCategory] = await Promise.all([
    summarize(range.from, range.to),
    getStore().terms.usageStats(100),
    getStore().terms.countByCategory(),
  ])
  return json({ summary, termUsage: usage, termsByCategory: byCategory })
}

export const exportAnalytics: Handler = async (req) => {
  await auth.requireAdmin(req)
  const range = parseRange(req)
  const events = await exportRange(range.from, range.to)
  return json(events, 200, {
    headers: { 'content-disposition': 'attachment; filename="komm10te-analytics.json"' },
  })
}

/**
 * Analytics werden niemals automatisch gelöscht. Diese Route ist der einzige
 * Weg – und verlangt eine ausdrückliche Bestätigung im Body.
 */
export const deleteAnalytics: Handler = async (req) => {
  const identity = await auth.requireAdmin(req)
  const body = bodyOf(req)
  if (body.confirm !== 'LÖSCHEN') {
    throw fail.badRequest('confirmation_required', 'Bestätigung fehlt.')
  }

  const store = getStore()
  let deleted = 0
  let scope = 'range'

  if (body.scope === 'all') {
    deleted = await store.analytics.deleteAll()
    scope = 'all'
  } else if (Array.isArray(body.ids)) {
    deleted = await store.analytics.deleteByIds(body.ids.map(String))
    scope = 'ids'
  } else {
    const range = parseRange(req)
    deleted = await store.analytics.deleteRange(range.from, range.to)
  }

  await store.admin.logAction(identity.username, 'analytics_deleted', scope, { deleted })
  return json({ deleted, scope })
}

export const getAuditLog: Handler = async (req) => {
  await auth.requireAdmin(req)
  const rows = await getStore().admin.listAuditLog(
    Math.min(Number(req.query.get('limit') ?? 100), 500),
  )
  return json({ rows })
}

export const postMaintenance: Handler = async (req) => {
  const identity = await auth.requireAdmin(req)
  const result = await runMaintenance()
  await getStore().admin.logAction(identity.username, 'maintenance_run', null, result)
  return json(result)
}
