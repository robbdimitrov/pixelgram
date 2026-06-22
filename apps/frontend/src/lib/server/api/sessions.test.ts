import { describe, expect, it, vi } from 'vitest';
import { deleteSession, getSessions } from './sessions';

describe('session API', () => {
	it('maps session timestamps to Date values', async () => {
		const fetch = vi.fn(
			async () =>
				new Response(
					JSON.stringify({
						sessions: [
							{
								id: '01904d2e-7f4d-7c33-ae21-2f94737eaa10',
								created: '2026-06-22T12:00:00Z',
								expiresAt: '2026-06-29T12:00:00Z',
								current: true
							}
						]
					}),
					{ status: 200 }
				)
		);

		const sessions = await getSessions(fetch);

		expect(fetch).toHaveBeenCalledWith('/sessions');
		expect(sessions).toEqual([
			{
				id: '01904d2e-7f4d-7c33-ae21-2f94737eaa10',
				created: new Date('2026-06-22T12:00:00Z'),
				expiresAt: new Date('2026-06-29T12:00:00Z'),
				current: true
			}
		]);
	});

	it('encodes the revocation path segment', async () => {
		const fetch = vi.fn(async () => new Response(null, { status: 204 }));

		await deleteSession(fetch, 'session/id');

		expect(fetch).toHaveBeenCalledWith('/sessions/session%2Fid', { method: 'DELETE' });
	});

	it('propagates backend failures', async () => {
		const fetch = vi.fn(async () => new Response('session not found', { status: 404 }));

		await expect(
			deleteSession(fetch, '01904d2e-7f4d-7c33-ae21-2f94737eaa10')
		).rejects.toMatchObject({ status: 404 });
	});
});
