import { createInterface } from 'node:readline/promises'
import { hashPassword } from '../server/services/crypto'

/**
 * Erzeugt den Wert für `ADMIN_PASSWORD_HASH`.
 *
 *   npm run admin:hash
 *
 * Das Passwort wird interaktiv abgefragt, damit es nicht in der Shell-Historie
 * landet. Ausgegeben wird nur der scrypt-Hash – das Klartextpasswort verlässt
 * diesen Prozess nicht und gehört niemals ins Repository.
 */
async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stderr })
  const password = (await rl.question('Neues Adminpasswort: ')).trim()
  const repeat = (await rl.question('Wiederholen: ')).trim()
  rl.close()

  if (password.length < 12) {
    console.error('Bitte mindestens 12 Zeichen verwenden.')
    process.exit(1)
  }
  if (password !== repeat) {
    console.error('Die Eingaben stimmen nicht überein.')
    process.exit(1)
  }

  const hash = await hashPassword(password)
  console.error('\nIn die Umgebungsvariablen übernehmen:\n')
  console.log(`ADMIN_PASSWORD_HASH=${hash}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
