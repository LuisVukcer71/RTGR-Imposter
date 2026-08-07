import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleApiRequest } from '../server/router.js'

/**
 * Einziger Einstiegspunkt der Vercel-Serverless-Funktionen.
 *
 * Alle `/api/*`-Anfragen laufen hier hinein und werden an denselben Router
 * übergeben, den auch der Vite-Dev-Server nutzt – es gibt keinen zweiten
 * Codepfad, der in Produktion abweichen könnte.
 *
 * Die Node-Runtime parst JSON-Bodies bereits vor dem Handler; `readBody()`
 * erkennt das und liest nur dann selbst vom Stream, wenn nötig.
 */
export const config = {
  runtime: 'nodejs',
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await handleApiRequest(req, res)
}
