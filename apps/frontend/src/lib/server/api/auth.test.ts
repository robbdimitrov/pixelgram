import { describe, expect, it, vi } from 'vitest';
import { applySessionCookie } from './auth';

describe('applySessionCookie', () => {
	it('re-emits a valid backend session cookie with its max age', () => {
		const set = vi.fn();
		const headers = new Headers();
		headers.append(
			'set-cookie',
			'session=_-AAAAAAAAAAAAAAAAAAAAAAAAAA; Path=/; Max-Age=3600; HttpOnly; SameSite=Strict'
		);

		expect(applySessionCookie(headers, { set })).toBe(true);
		expect(set).toHaveBeenCalledWith('session', '_-AAAAAAAAAAAAAAAAAAAAAAAAAA', {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 3600
		});
	});

	it('ignores unrelated, malformed, and incomplete cookies', () => {
		const set = vi.fn();
		const headers = new Headers();
		headers.append('set-cookie', 'theme=dark; Path=/');
		headers.append('set-cookie', 'session=too-short; Path=/');
		headers.append('set-cookie', 'session=AAAAAAAAAAAAAAAAAAAAAAAAAAA; Max-Age=3600');
		headers.append('set-cookie', 'session=AAAAAAAAAAAAAAAAAAAAAAAAAAAAA; Max-Age=3600');
		headers.append('set-cookie', 'session=AAAAAAAAAAAAAAAAAAAAAAAAAAAA; Path=/');
		headers.append('set-cookie', 'session=+AAAAAAAAAAAAAAAAAAAAAAAAAAA; Max-Age=3600');
		headers.append('set-cookie', 'session=/AAAAAAAAAAAAAAAAAAAAAAAAAAA; Max-Age=3600');
		headers.append('set-cookie', 'session=AAAAAAAAAAAAAAAAAAAAAAAAAAA=; Max-Age=3600');
		headers.append('set-cookie', 'session=éAAAAAAAAAAAAAAAAAAAAAAAAAAA; Max-Age=3600');

		expect(applySessionCookie(headers, { set })).toBe(false);
		expect(set).not.toHaveBeenCalled();
	});
});
