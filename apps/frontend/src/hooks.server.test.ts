import { describe, expect, it, vi } from 'vitest';

import { handle } from './hooks.server';

async function resolveURL(rawURL: string) {
	const response = new Response(null);
	const resolve = vi.fn().mockResolvedValue(response);
	const event = {
		url: new URL(rawURL),
		request: new Request(rawURL),
		cookies: { get: vi.fn().mockReturnValue(null) }
	};

	return handle({
		event,
		resolve
	} as unknown as Parameters<typeof handle>[0]);
}

describe('handle', () => {
	it('sets HSTS for HTTPS requests', async () => {
		const response = await resolveURL('https://phasma.localhost/feed');

		expect(response.headers.get('Strict-Transport-Security')).toBe(
			'max-age=31536000; includeSubDomains'
		);
	});

	it('omits HSTS for plain HTTP requests', async () => {
		const response = await resolveURL('http://localhost:8080/feed');

		expect(response.headers.has('Strict-Transport-Security')).toBe(false);
	});
});
