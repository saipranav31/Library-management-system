import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  app.use(express.json());

  // Cloud Run health check endpoint
  app.get('/healthz', (_req, res) => {
    res.status(200).send('OK');
  });

  // Candidate paths where built static files can reside
  const candidatePaths = [
    path.resolve(__dirname, 'dist'),
    path.resolve(process.cwd(), 'dist'),
    '/app/applet/dist',
  ];

  let distPath = candidatePaths.find(
    (p) => fs.existsSync(p) && fs.existsSync(path.resolve(p, 'index.html'))
  );

  // If dist is missing, attempt on-the-fly build if vite is present
  if (!distPath) {
    try {
      console.log('Dist directory not found, running build...');
      const { execSync } = await import('child_process');
      execSync('npx vite build', { stdio: 'inherit' });
      distPath = candidatePaths.find(
        (p) => fs.existsSync(p) && fs.existsSync(path.resolve(p, 'index.html'))
      );
    } catch (e) {
      console.warn('Auto-build on startup could not be completed:', e);
    }
  }

  if (distPath) {
    console.log(`Serving static production assets from: ${distPath}`);
    app.use(express.static(distPath));

    // Fallback to index.html for client-side routing
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath!, 'index.html'));
    });
  } else {
    // If dist was not built, try mounting Vite middleware in dev or fallback safely
    try {
      console.log('Mounting Vite dev middleware...');
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error('Vite dev server unavailable, serving fallback HTML shell:', err);
      const rootIndex = path.resolve(__dirname, 'index.html');
      app.get('*', (_req, res) => {
        if (fs.existsSync(rootIndex)) {
          res.sendFile(rootIndex);
        } else {
          res.status(200).send('<!doctype html><html><body><h1>LibTrack Portal Initializing...</h1></body></html>');
        }
      });
    }
  }

  // Cloud Run assigns the port via process.env.PORT (typically 8080).
  // In development environments with an nginx proxy on 8080, fall back to port 3000 if 8080 is in use.
  const targetPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  function listenOnPort(portToTry: number) {
    const serverInstance = app.listen(portToTry, '0.0.0.0', () => {
      console.log(`Server successfully listening on http://0.0.0.0:${portToTry}`);
    });

    serverInstance.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE' && portToTry !== 3000) {
        console.warn(`Port ${portToTry} in use. Falling back to port 3000...`);
        listenOnPort(3000);
      } else {
        console.error(`Fatal server listen error on port ${portToTry}:`, err);
        process.exit(1);
      }
    });
  }

  listenOnPort(targetPort);
}

startServer().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
