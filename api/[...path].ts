import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleApiRequest } from '../server/router'

/**
 * Einziger Einstiegspunkt der Vercel-Serverless-Funktionen.
 *
 * Alle `/api/*`-Anfragen laufen hier hinein und werden an denselben Router
 * übergeben, den auch der Vite-Dev-Server nutzt – es gibt keinen zweiten
 * Codepfad, der in Produktion abweichen könnte.
 */
export const config = {
  runtime: 'nodejs',
  // Der Body wird selbst gelesen; so gilt dieselbe Größenprüfung wie lokal.
  api: { bodyParser: false },
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await handleApiRequest(req, res)
}
