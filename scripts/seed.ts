import pg from 'pg'
import { seedTerms } from '../src/data/seedPool'

/**
 * Importiert den verbindlichen Startbestand (350 Begriffe, 50 pro Kategorie)
 * in die Datenbank.
 *
 *   npm run db:seed
 *
 * Der Import ist idempotent: Einträge werden über ihre `seed_id` und über die
 * Kombination aus Anzeigebegriff und Kategorie auf Duplikate geprüft. Ein
 * zweiter Lauf ändert nichts.
 *
 * Die Seeds sind für diese Entwicklungsfassung `enabled = true`, tragen aber
 * `review_status = needs_human_review`, damit sie im Adminbereich sichtbar
 * bleiben und redaktionell nachgezogen werden können.
 */

function connectionString(): string {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!url) {
    console.error('DATABASE_URL ist nicht gesetzt.')
    process.exit(1)
  }
  return url
}

function needsSsl(url: string): boolean {
  if (process.env.DATABASE_SSL === 'disable') return false
  return /sslmode=require/.test(url) || /\.neon\.tech|supabase\.co|vercel-storage\.com/.test(url)
}

async function main() {
  const url = connectionString()
  const client = new pg.Client({
    connectionString: url,
    ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  })
  await client.connect()

  try {
    const tableCheck = await client.query<{ exists: boolean }>(
      "select to_regclass('public.impostor_terms') is not null as exists",
    )
    if (!tableCheck.rows[0]?.exists) {
      console.error('Tabelle impostor_terms fehlt. Bitte zuerst `npm run db:migrate` ausführen.')
      process.exit(1)
    }

    let inserted = 0
    await client.query('begin')
    for (const term of seedTerms) {
      const result = await client.query(
        `insert into impostor_terms
           (seed_id, display_term, canonical_term, hint_term, category_id, enabled, review_status)
         values ($1, $2, $3, $4, (select id from categories where name = $5), $6, $7)
         on conflict do nothing`,
        [
          term.id,
          term.displayTerm,
          term.canonicalTerm,
          term.hintTerm,
          term.category,
          term.enabled,
          term.reviewStatus,
        ],
      )
      inserted += result.rowCount ?? 0
    }
    await client.query('commit')

    const total = await client.query<{ count: string }>(
      'select count(*)::text as count from impostor_terms',
    )
    console.log(
      `${inserted} von ${seedTerms.length} Begriffen importiert, ` +
        `${seedTerms.length - inserted} als Duplikat übersprungen. ` +
        `Pool umfasst jetzt ${total.rows[0]?.count} Einträge.`,
    )
  } catch (error) {
    await client.query('rollback').catch(() => undefined)
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
