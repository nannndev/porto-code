import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';

// Serves the Vercel functions in /api during `vite dev`, so the AI features work
// locally without `vercel dev`. Server-only env vars (no VITE_ prefix) are exposed
// to these handlers via process.env and never to the browser bundle.
const devApiPlugin = (env: Record<string, string>): Plugin => ({
  name: 'dev-api-functions',
  configureServer(server: ViteDevServer) {
    for (const [key, value] of Object.entries(env)) {
      if (!key.startsWith('VITE_') && process.env[key] === undefined) process.env[key] = value;
    }
    server.middlewares.use('/api', async (req: IncomingMessage, res: ServerResponse, next) => {
      const route = (req.url || '/').split('?')[0].replace(/^\/+|\/+$/g, '');
      if (!/^[\w-]+$/.test(route)) return next();
      try {
        const mod = await server.ssrLoadModule(`/api/${route}.ts`);
        const handler = mod[req.method || 'GET'];
        if (typeof handler !== 'function') {
          res.statusCode = 405;
          return res.end();
        }
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const body = chunks.length ? Buffer.concat(chunks) : undefined;
        const request = new Request(`http://localhost${(req as IncomingMessage & { originalUrl?: string }).originalUrl || req.url}`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
        });
        const response: Response = await handler(request);
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (error) {
        server.config.logger.error(`[api/${route}] ${String(error)}`);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal error' }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [devApiPlugin(env)],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
