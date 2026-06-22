import type { Cookies } from '@sveltejs/kit';
import type { UserIdDto } from '$lib/types';
import { unwrap } from './http';
import type { ApiClient } from './client';

const sessionCookiePattern = /^session=([A-Za-z0-9_-]{28})(?:;|$)/;
const maxAgePattern = /(?:^|;\s*)Max-Age=(\d+)(?:;|$)/i;

export function applySessionCookie(headers: Headers, cookies: Pick<Cookies, 'set'>): boolean {
	for (const header of headers.getSetCookie()) {
		const sessionID = sessionCookiePattern.exec(header)?.[1];
		const maxAge = Number(maxAgePattern.exec(header)?.[1]);
		if (!sessionID || !Number.isSafeInteger(maxAge) || maxAge <= 0) continue;

		cookies.set('session', sessionID, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge
		});
		return true;
	}
	return false;
}

export async function createUser(
	fetch: ApiClient,
	name: string,
	username: string,
	email: string,
	password: string
): Promise<UserIdDto | null> {
	const res = await fetch('/users', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ name, username: username.trim().toLowerCase(), email, password })
	});
	return unwrap<UserIdDto>(res);
}

export async function login(fetch: ApiClient, email: string, password: string): Promise<Response> {
	return fetch('/sessions', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ email, password })
	});
}

export async function logout(fetch: ApiClient): Promise<null> {
	const res = await fetch('/sessions', { method: 'DELETE' });
	return unwrap<null>(res);
}
