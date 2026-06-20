import { describe, it, expect, vi } from 'vitest';
import { unwrap } from '$lib/server/api/http';

// Mock @sveltejs/kit's error function
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
