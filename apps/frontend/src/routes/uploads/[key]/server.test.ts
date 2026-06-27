import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { BACKEND_URL: 'http://backend:8080' } }));
vi.mock('@sveltejs/kit', () => ({
	error: (status: number, message: string) => {
		const err = new Error(message) as Error & { status: number };
		err.status = status;
		throw err;
	}
}));

import { GET } from './+server';

function makeEvent(key: string, fetchImpl: ReturnType<typeof vi.fn>) {
	return {
		params: { key },
		cookies: { get: vi.fn().mockReturnValue(undefined) },
		fetch: fetchImpl
	} as unknown as Parameters<typeof GET>[0];
}

describe('GET /uploads/[key]', () => {
	const validKey = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

	it('streams image bytes and forwards safe headers', async () => {
		const fetch = vi.fn().mockResolvedValue(
			new Response('IMAGE-BYTES', {
				status: 200,
				headers: { 'content-type': 'image/jpeg', 'content-length': '11', etag: '"abc"' }
			})
		);

		const res = await GET(makeEvent(validKey, fetch));

		expect(fetch).toHaveBeenCalledTimes(1);
		expect(String(fetch.mock.calls[0]![0])).toBe(`http://backend:8080/uploads/${validKey}`);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('image/jpeg');
		expect(res.headers.get('etag')).toBe('"abc"');
		expect(await res.text()).toBe('IMAGE-BYTES');
	});

	it('maps a missing image to 404 without reaching the body', async () => {
		const fetch = vi.fn().mockResolvedValue(new Response('not found', { status: 404 }));
		await expect(GET(makeEvent(validKey, fetch))).rejects.toMatchObject({ status: 404 });
	});

	it('maps other backend failures to 502', async () => {
		const fetch = vi.fn().mockResolvedValue(new Response('boom', { status: 500 }));
		await expect(GET(makeEvent(validKey, fetch))).rejects.toMatchObject({ status: 502 });
	});

	it('rejects traversal and malformed keys before calling the backend', async () => {
		const fetch = vi.fn();
		const badKeys = [
			'..',
			'photo.jpg',
			'with/slash',
			'bad%2F',
			'',
			'ABCDEF1234567890abcdef1234567890'
		];
		for (const key of badKeys) {
			await expect(GET(makeEvent(key, fetch))).rejects.toMatchObject({ status: 404 });
		}
		expect(fetch).not.toHaveBeenCalled();
	});
});
