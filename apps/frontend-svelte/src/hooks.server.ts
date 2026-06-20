import type { Handle, HandleFetch, HandleServerError } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handleFetch: HandleFetch = async ({ request, fetch, event }) => {
  if (request.url.startsWith(`${event.url.origin}/api/`)) {
    const target = request.url.replace(`${event.url.origin}/api`, env.BACKEND_URL ?? 'http://localhost:8080');
    const headers = new Headers(request.headers);
    headers.set('cookie', event.request.headers.get('cookie') ?? '');
    request = new Request(target, new Request(request, { headers }));
  }
  return fetch(request);
};

export const handle: Handle = async ({ event, resolve }) => {
  const res = await resolve(event);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;
};

export const handleError: HandleServerError = ({ error, event }) => {
  const message = error instanceof Error ? error.message : 'Internal error';
  console.error(`[error] ${event.request.method} ${event.url.pathname}: ${message}`);
  return { message };
};
