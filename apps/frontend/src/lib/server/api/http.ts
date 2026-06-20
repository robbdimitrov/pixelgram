import { error } from '@sveltejs/kit';
import type { CursorPage } from '$lib/types';

type Fetch = typeof globalThis.fetch;

export async function unwrap<T>(res: Response): Promise<T | null> {
  if (res.status === 204) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw error(res.status, text || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}

export async function getCursorPage<Dto, T>(
  fetch: Fetch,
  url: string,
  cursor: string | null | undefined,
  map: (dto: Dto) => T
): Promise<CursorPage<T>> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const res = await fetch(`${url}${params}`);
  const page = await unwrap<{ items: Dto[]; nextCursor: string | null }>(res);
  return { items: (page?.items ?? []).map(map), nextCursor: page?.nextCursor ?? null };
}
