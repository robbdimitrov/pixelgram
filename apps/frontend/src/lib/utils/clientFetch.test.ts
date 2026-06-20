import { describe, it, expect } from 'vitest';
import { fetchJson } from '$lib/utils/clientFetch';

describe('fetchJson', () => {
	it('parses and returns JSON on ok response', async () => {
		const data = { items: [1, 2], nextCursor: 'abc' };
		const res = new Response(JSON.stringify(data), { status: 200 });
		const result = await fetchJson<typeof data>(res);
		expect(result).toEqual(data);
	});

	it('throws on non-ok response', async () => {
		const res = new Response('Not found', { status: 404 });
		await expect(fetchJson(res)).rejects.toThrow('HTTP 404');
	});

	it('throws on server error', async () => {
		const res = new Response('Internal Server Error', { status: 500 });
		await expect(fetchJson(res)).rejects.toThrow('HTTP 500');
	});

	it('returns null for empty body', async () => {
		const res = new Response('', { status: 200 });
		const result = await fetchJson(res);
		expect(result).toBeNull();
	});
});
