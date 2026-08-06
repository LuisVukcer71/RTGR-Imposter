import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

/**
 * Versionierte Migrationen.
 *
 *   npm run db:migrate            – alle offenen Migrationen anwenden
 *   npm run db:migrate -- --status – nur anzeigen, was offen ist
 *   npm run db:rollback           – die zuletzt angewendete Migration zurückrollen
 *
 * Angewendete Migrationen stehen in `schema_migrations`. Jede Migration läuft
 * in einer eigenen Transaktion; schlägt sie fehl, bleibt der Stand unverändert.
 */

const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations', import.meta.url))

function connectionString(): string {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!url) {
    console.error(
      'DATABASE_URL ist nicht gesetzt.\n' +
        'Beispiel: DATABASE_URL="postgres://user:pass@host:5432/db" npm run db:migrate',
    )
    process.exit(1)
  }
  return url
}

function needsSsl(url: string): boolean {
  if (process.env.DATABASE_SSL === 'disable') return false
  return /sslmode=require/.test(url) || /\.neon\.tech|supabase\.co|vercel-storage\.com/.test(url)
}

async function listMigrations(): Promise<string[]> {
  const files = await readdir(MIGRATIONS_DIR)
  return files.filter((name) => name.endsWith('.sql') && !name.endsWith('.down.sql')).sort()
}

async function main() {
  const url = connectionString()
  const client = new pg.Client({
    connectionString: url,
    ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  })
  await client.connect()

  try {
    await client.query(`
      create table if not exists schema_migrations (
        name        text primary key,
        applied_at  timestamptz not null default now()
      )
    `)

    const applied = new Set(
      (await client.query<{ name: string }>('select name from schema_migrations')).rows.map(
        (row) => row.name,
      ),
    )
    const all = await listMigrations()
    const mode = process.argv.includes('--status')
      ? 'status'
      : process.argv.includes('--down')
        ? 'down'
        : 'up'

    if (mode === 'status') {
      for (const name of all) {
        console.log(`${applied.has(name) ? '✔' : '·'} ${name}`)
      }
      return
    }

    if (mode === 'down') {
      const last = [...all].reverse().find((name) => applied.has(name))
      if (!last) {
        console.log('Keine angewendete Migration vorhanden.')
        return
      }
      const downFile = last.replace(/\.sql$/, '.down.sql')
      const sql = await readFile(`${MIGRATIONS_DIR}/${downFile}`, 'utf8')
      console.warn(`Rolle ${last} zurück – dabei gehen die betroffenen Daten verloren.`)
      await client.query('begin')
      await client.query(sql)
      await client.query('delete from schema_migrations where name = $1', [last])
      await client.query('commit')
      console.log(`↩ ${last} zurückgerollt.`)
      return
    }

    const pending = all.filter((name) => !applied.has(name))
    if (pending.length === 0) {
      console.log('Datenbank ist aktuell.')
      return
    }

    for (const name of pending) {
      const sql = await readFile(`${MIGRATIONS_DIR}/${name}`, 'utf8')
      try {
        await client.query('begin')
        await client.query(sql)
        await client.query('insert into schema_migrations (name) values ($1)', [name])
        await client.query('commit')
        console.log(`✔ ${name}`)
      } catch (error) {
        await client.query('rollback')
        console.error(`✖ ${name} fehlgeschlagen – nichts wurde übernommen.`)
        throw error
      }
    }
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
