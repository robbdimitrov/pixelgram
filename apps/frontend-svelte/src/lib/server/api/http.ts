import { error } from '@sveltejs/kit';

export async function unwrap<T>(res: Response): Promise<T | null> {
  if (res.status === 204) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw error(res.status, text || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}
