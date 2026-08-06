import { loadEnv, type Plugin } from 'vite'

/**
 * Schnappschuss der echten Prozessumgebung beim Start. Alles, was hier steht,
 * hat Vorrang vor `.env`; alles andere darf beim Neustart aus `.env` frisch
 * überschrieben werden – sonst würde eine korrigierte `.env` im laufenden
 * Node-Prozess wirkungslos bleiben.
 */
const osEnvKeys = new Set(Object.keys(process.env))

/**
 * Mountet die API während `npm run dev` als Vite-Middleware.
 *
 * Dadurch verhält sich die lokale Entwicklung wie die Vercel-Bereitstellung:
 * derselbe Router, dieselben Handler, dieselbe Fehlerform. Ohne diesen Plugin
 * müsste man einen zweiten Server starten und würde Abweichungen riskieren.
 */
export function apiDevServer(): Plugin {
  return {
    name: 'komm10te-api-dev-server',
    apply: 'serve',

    /**
     * Vite legt `.env`-Werte nur in `import.meta.env` ab. Die API läuft aber im
     * Node-Prozess und liest `process.env` – ohne diesen Schritt wären
     * DATABASE_URL und die Admin-Zugangsdaten lokal wirkungslos.
     */
    config(_config, { mode }) {
      const loaded = loadEnv(mode, process.cwd(), '')
      for (const [key, value] of Object.entries(loaded)) {
        if (!osEnvKeys.has(key)) process.env[key] = value
      }
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        try {
          // Über ssrLoadModule, damit Änderungen am Servercode ohne Neustart greifen.
          const { handleApiRequest } = (await server.ssrLoadModule('/server/router.ts')) as {
            handleApiRequest: (
              request: typeof req,
              response: typeof res,
            ) => Promise<void>
          }
          await handleApiRequest(req, res)
        } catch (error) {
          server.config.logger.error(`[api] ${String(error)}`)
          res.statusCode = 500
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'internal_error', message: String(error) }))
        }
      })
    },
  }
}
