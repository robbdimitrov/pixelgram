import { describe, it, expect, vi } from 'vitest';
import { unwrap, getCursorPage } from '$lib/server/api/http';

vi.mock('@sveltejs/kit', () => ({
	error: (status: number, message: string) => {
		const err = new Error(message);
		(err as Error & { status: number }).status = status;
		throw err;
	}
}));

describe('unwrap', () => {
	it('returns null for 204 No Content', async () => {
		const res = new Response(null, { status: 204 });
		const result = await unwrap(res);
		expect(result).toBeNull();
	});

	it('parses JSON for 200 OK', async () => {
		const data = { id: 1, name: 'test' };
		const res = new Response(JSON.stringify(data), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
		const result = await unwrap<typeof data>(res);
		expect(result).toEqual(data);
	});

	it('throws for 401 Unauthorized', async () => {
		const res = new Response('Unauthorized', { status: 401 });
		await expect(unwrap(res)).rejects.toThrow();
	});

	it('throws for 500 Internal Server Error', async () => {
		const res = new Response('Server error', { status: 500 });
		await expect(unwrap(res)).rejects.toThrow();
	});

	it('returns null for empty body on 200', async () => {
		const res = new Response('', { status: 200 });
		const result = await unwrap(res);
		expect(result).toBeNull();
	});

	it('includes error text in thrown error for non-ok responses', async () => {
		const res = new Response('Not found', { status: 404 });
		await expect(unwrap(res)).rejects.toThrow('Not found');
	});
});

describe('getCursorPage', () => {
	const map = (dto: { id: number; label: string }) => ({ ...dto, mapped: true });

	it('fetches the base URL when no cursor is given', async () => {
		const fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 })
		);
		await getCursorPage(fetch, '/api/posts', null, map);
		expect(fetch).toHaveBeenCalledWith('/api/posts');
	});

	it('appends encoded cursor as query param', async () => {
		const fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 })
		);
		await getCursorPage(fetch, '/api/posts', 'abc==', map);
		expect(fetch).toHaveBeenCalledWith('/api/posts?cursor=abc%3D%3D');
	});

	it('maps each DTO through the mapper and returns nextCursor', async () => {
		const dtos = [{ id: 1, label: 'a' }, { id: 2, label: 'b' }];
		const fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ items: dtos, nextCursor: 'next' }), { status: 200 })
		);
		const page = await getCursorPage(fetch, '/api/posts', null, map);
		expect(page.items).toEqual([
			{ id: 1, label: 'a', mapped: true },
			{ id: 2, label: 'b', mapped: true }
		]);
		expect(page.nextCursor).toBe('next');
	});

	it('returns empty items and null cursor on empty page', async () => {
		const fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 })
		);
		const page = await getCursorPage(fetch, '/api/posts', null, map);
		expect(page.items).toEqual([]);
		expect(page.nextCursor).toBeNull();
	});

	it('propagates error on non-ok response', async () => {
		const fetch = vi.fn().mockResolvedValue(new Response('Forbidden', { status: 403 }));
		await expect(getCursorPage(fetch, '/api/posts', null, map)).rejects.toThrow();
	});
});
