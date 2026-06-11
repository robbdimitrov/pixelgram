import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
} from '@angular/ssr/node';
import express, {Request, Response, NextFunction} from 'express';
import {createProxyMiddleware} from 'http-proxy-middleware';
import {join, basename} from 'node:path';
import {randomBytes} from 'node:crypto';

const browserDistFolder = join(import.meta.dirname, '../browser');
const backendUrl = process.env['BACKEND_URL'] ?? 'http://backend:8080';

const app = express();
const angularApp = new AngularNodeAppEngine();

const BASE_CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join('; ');

// Health probes — cheap, no security headers, no SSR.
app.get(['/health', '/healthz'], (_req: Request, res: Response) => {
  res.status(200).send('ok');
});

// Security headers for all responses (including proxied /api).
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', BASE_CSP);
  next();
});

// /api reverse proxy — streams bodies (multipart uploads pass through untouched).
// changeOrigin: false preserves the browser's original Host header, matching
// the prior nginx `proxy_set_header Host $http_host` behaviour.
app.use(
  '/api',
  createProxyMiddleware({
    target: backendUrl,
    changeOrigin: false,
    xfwd: true,
    pathRewrite: {'^/api': ''},
  })
);

// Static assets with cache headers matching the nginx config.
// Matches Angular's esbuild fingerprint format: exactly 8 uppercase base36 chars after a dash.
const HASHED_ASSET_RE = /-[A-Z0-9]{8}\.(js|css)$/;

app.use(
  express.static(browserDistFolder, {
    index: false,
    redirect: false,
    setHeaders(res, filePath) {
      const name = basename(filePath);
      if (name === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (HASHED_ASSET_RE.test(name)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  })
);

// Angular SSR handler with per-request nonce for inline scripts.
// Note: CSP_NONCE DI token is not used here because AngularNodeAppEngine does not
// yet expose per-request DI providers. The regex-based nonce injection below is a
// workaround; migrate to DI-based nonce once Angular exposes per-request providers.
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const angularResponse = await angularApp.handle(req);
    if (!angularResponse) {
      next();
      return;
    }

    // Generate a per-request nonce and inject it into inline scripts.
    const nonce = randomBytes(16).toString('base64url');
    let html = await angularResponse.text();
    html = html.replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);

    // Forward Angular's response headers, then override CSP with the nonce.
    angularResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-security-policy') {
        res.setHeader(key, value);
      }
    });
    res.setHeader(
      'Content-Security-Policy',
      BASE_CSP.replace("script-src 'self'", `script-src 'self' 'nonce-${nonce}'`)
    );
    res.status(angularResponse.status).send(html);
  } catch (err) {
    next(err);
  }
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] ?? 8080;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
