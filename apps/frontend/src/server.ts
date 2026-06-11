import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
} from '@angular/ssr/node';
import {
  createServer,
  IncomingMessage,
  ServerResponse,
  request as httpRequest,
} from 'node:http';
import {request as httpsRequest} from 'node:https';
import {createReadStream, stat} from 'node:fs';
import {join, basename, extname} from 'node:path';
import {randomBytes} from 'node:crypto';

const browserDistFolder = join(import.meta.dirname, '../browser');
const backendUrl = process.env['BACKEND_URL'] ?? 'http://backend:8080';
const backendTarget = new URL(backendUrl);

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

const HASHED_ASSET_RE = /-[A-Z0-9]{8}\.(js|css)$/;

const MIME_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

function setSecurityHeaders(res: ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', BASE_CSP);
}

function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const pathname = new URL(req.url ?? '/', 'http://x').pathname;
  const filePath = join(browserDistFolder, pathname);

  if (!filePath.startsWith(browserDistFolder + '/') && filePath !== browserDistFolder) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        resolve(false);
        return;
      }

      const name = basename(filePath);
      const mimeType = MIME_TYPES[extname(filePath)] ?? 'application/octet-stream';

      let cacheControl: string;
      if (name === 'index.html') {
        cacheControl = 'no-cache';
      } else if (HASHED_ASSET_RE.test(name)) {
        cacheControl = 'public, max-age=31536000, immutable';
      } else {
        cacheControl = 'public, max-age=3600';
      }

      setSecurityHeaders(res);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', cacheControl);
      res.writeHead(200);
      createReadStream(filePath).pipe(res);
      resolve(true);
    });
  });
}

// Security headers that must not be overridden by backend responses.
const SECURITY_HEADER_NAMES = new Set([
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'content-security-policy',
]);

function proxyApi(req: IncomingMessage, res: ServerResponse): void {
  const incomingUrl = new URL(req.url ?? '/', 'http://x');

  // Strip /api prefix; preserve query string.
  const proxyPath = (incomingUrl.pathname.slice(4) || '/') + incomingUrl.search;

  const isHttps = backendTarget.protocol === 'https:';
  const requester = isHttps ? httpsRequest : httpRequest;

  // Normalise XFF: Node.js joins duplicate headers as a string, but the type
  // permits string[] so we guard against it.
  const existingXff = req.headers['x-forwarded-for'];
  const xffBase = Array.isArray(existingXff) ? existingXff.join(', ') : existingXff;
  const remoteAddr = req.socket.remoteAddress ?? '';
  const xForwardedFor = xffBase ? `${xffBase}, ${remoteAddr}` : remoteAddr;

  // x-forwarded-proto reflects the client's protocol, not the backend's.
  // Propagate the header if an upstream proxy (e.g. ingress) already set it;
  // otherwise derive from the incoming socket's TLS state.
  const existingProto = req.headers['x-forwarded-proto'];
  const xForwardedProto =
    typeof existingProto === 'string'
      ? existingProto.split(',')[0].trim()
      : (req.socket as {encrypted?: boolean}).encrypted
        ? 'https'
        : 'http';

  const proxyReq = requester(
    {
      hostname: backendTarget.hostname,
      port: backendTarget.port || (isHttps ? 443 : 80),
      path: proxyPath,
      method: req.method,
      headers: {
        ...req.headers,
        'x-forwarded-for': xForwardedFor,
        'x-forwarded-host': req.headers['host'] ?? '',
        'x-forwarded-proto': xForwardedProto,
      },
    },
    (proxyRes) => {
      setSecurityHeaders(res);
      // Copy backend headers, but don't let them override our security headers.
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (!SECURITY_HEADER_NAMES.has(key.toLowerCase()) && value !== undefined) {
          res.setHeader(key, value as string | string[]);
        }
      }
      res.writeHead(proxyRes.statusCode ?? 502);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', () => {
    if (!res.headersSent) res.writeHead(502);
    res.end();
  });

  req.pipe(proxyReq);
}

async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const pathname = new URL(req.url ?? '/', 'http://x').pathname;

  // Health probes — cheap, no security headers, no SSR.
  if (pathname === '/health' || pathname === '/healthz') {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('ok');
    return;
  }

  // /api reverse proxy — streams bodies (multipart uploads pass through untouched).
  // changeOrigin: false — original Host header is preserved.
  if (pathname.startsWith('/api')) {
    proxyApi(req, res);
    return;
  }

  // Static assets.
  if (await serveStatic(req, res)) return;

  // Angular SSR with per-request nonce for inline scripts.
  setSecurityHeaders(res);
  try {
    const angularResponse = await angularApp.handle(req);
    if (!angularResponse) {
      res.writeHead(404);
      res.end();
      return;
    }

    const nonce = randomBytes(16).toString('base64url');
    let html = await angularResponse.text();
    html = html.replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);

    angularResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-security-policy') {
        res.setHeader(key, value);
      }
    });
    res.setHeader(
      'Content-Security-Policy',
      BASE_CSP.replace("script-src 'self'", `script-src 'self' 'nonce-${nonce}'`)
    );

    const buf = Buffer.from(html, 'utf-8');
    res.setHeader('Content-Length', buf.byteLength);
    res.writeHead(angularResponse.status);
    res.end(buf);
  } catch (err) {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] ?? 8080;
  createServer(handler).listen(port, () => {
    console.log(`Node server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(handler);
