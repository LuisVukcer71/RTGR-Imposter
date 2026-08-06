import type { PlayableTerm } from '@shared/types'
import { json, type Handler } from '../http'
import { getStore } from '../store'
import { maybeRunMaintenance } from '../services/maintenance'

/**
 * Aktiver Wortpool für den Impostor-Modus.
 *
 * Nur die spielrelevanten Felder gehen nach außen – `canonicalTerm`,
 * Reviewstatus und Notizen bleiben im Admin-Bereich.
 */
export const getTerms: Handler = async () => {
  void maybeRunMaintenance()
  const store = getStore()
  const [terms, version] = await Promise.all([store.terms.listActive(), store.terms.activeVersion()])

  const payload: PlayableTerm[] = terms.map((term) => ({
    id: term.id,
    displayTerm: term.displayTerm,
    hintTerm: term.hintTerm,
    category: term.category as PlayableTerm['category'],
  }))

  return json(
    { version, terms: payload },
    200,
    // Der Client cached selbst; ein kurzer Shared-Cache entlastet trotzdem.
    { headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=600' } },
  )
}

/** Meldet Ziehungen, damit das Admin-Dashboard „Ziehungen pro Wort“ zeigen kann. */
export const postTermDraws: Handler = async (req) => {
  const body = (req.body ?? {}) as { termIds?: unknown }
  const ids = Array.isArray(body.termIds)
    ? body.termIds.filter((id): id is string => typeof id === 'string').slice(0, 50)
    : []
  if (ids.length === 0) return json({ recorded: 0 })
  await getStore().terms.recordDraws(ids, new Date().toISOString())
  return json({ recorded: ids.length })
}
