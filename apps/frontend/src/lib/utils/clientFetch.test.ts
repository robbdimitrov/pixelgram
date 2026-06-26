import { describe, it, expect } from 'vitest';
import { fetchJson } from '$lib/utils/clientFetch';

describe('fetchJson', () => {
	it('parses and returns JSON on ok response', async () => {
		const data = { items: [1, 2], nextCursor: 'abc' };
		const res = new Response(JSON.stringify(data), { status: 200 });
		const result = await fetchJson<typeof data>(res);
		expect(result).toEqual(data);
	});

	it('throws a sign-in message on 401', async () => {
		const res = new Response('Unauthorized', { status: 401 });
		await expect(fetchJson(res)).rejects.toThrow('Please sign in to continue.');
	});

	it('throws a rate-limit message on 429', async () => {
		const res = new Response('Too Many Requests', { status: 429 });
		await expect(fetchJson(res)).rejects.toThrow('Too many requests. Please try again later.');
	});

	it('throws a generic message on other non-ok responses', async () => {
		const res = new Response('Not found', { status: 404 });
		await expect(fetchJson(res)).rejects.toThrow('Could not load more items. Please try again.');
	});

	it('throws a generic message on server error', async () => {
		const res = new Response('Internal Server Error', { status: 500 });
		await expect(fetchJson(res)).rejects.toThrow('Could not load more items. Please try again.');
	});

	it('throws on empty body', async () => {
		const res = new Response('', { status: 200 });
		await expect(fetchJson(res)).rejects.toThrow('Empty response body');
	});
});
