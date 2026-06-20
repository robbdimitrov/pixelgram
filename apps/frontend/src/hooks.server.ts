import type { Handle, HandleServerError } from '@sveltejs/kit';

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
