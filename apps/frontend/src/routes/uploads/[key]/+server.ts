import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { apiClient } from '$lib/server/api/client';

// Opaque backend filename; reject traversal so the key addresses only one object.
const keyPattern = /^[A-Za-z0-9._-]{1,255}$/;

// Forwarded from the backend response; caching semantics stay the backend's.
const forwardedHeaders = ['content-type', 'content-length', 'etag', 'last-modified', 'cache-control'];

export const GET: RequestHandler = async ({ fetch, cookies, params }) => {
  if (!keyPattern.test(params.key) || params.key.includes('..')) throw error(404, 'Not found');

  const upstream = await apiClient({ fetch, cookies })(`/uploads/${params.key}`);
  if (!upstream.ok) throw error(upstream.status === 404 ? 404 : 502, 'Image unavailable');

  // Stream through; never buffer image bytes in the Node process.
  const headers = new Headers();
  for (const name of forwardedHeaders) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: 200, headers });
};
