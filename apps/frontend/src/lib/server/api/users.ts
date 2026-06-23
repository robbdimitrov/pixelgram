import type { User, UserDto, CursorPage } from '$lib/types';
import { mapUser } from '$lib/utils/mappers';
import { unwrap, getCursorPage } from './http';
import type { ApiClient } from './client';

export async function getByUsername(fetch: ApiClient, username: string): Promise<User | null> {
	const res = await fetch(`/users/${encodeURIComponent(username)}`);
	const dto = await unwrap<UserDto>(res);
	return dto ? mapUser(dto) : null;
}

export async function getCurrent(fetch: ApiClient): Promise<User | null> {
	const res = await fetch('/users/me');
	if (res.status === 401) return null;
	const dto = await unwrap<UserDto>(res);
	return dto ? mapUser(dto) : null;
}

export async function getFollowers(
	fetch: ApiClient,
	username: string,
	cursor?: string | null
): Promise<CursorPage<User>> {
	return getCursorPage(fetch, `/users/${encodeURIComponent(username)}/followers`, cursor, mapUser);
}

export async function getFollowing(
	fetch: ApiClient,
	username: string,
	cursor?: string | null
): Promise<CursorPage<User>> {
	return getCursorPage(fetch, `/users/${encodeURIComponent(username)}/following`, cursor, mapUser);
}

export async function updateUser(
	fetch: ApiClient,
	userId: number,
	name: string,
	username: string,
	email: string,
	avatar: string,
	bio: string
): Promise<null> {
	const res = await fetch(`/users/${userId}`, {
		method: 'PUT',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ name, username: username.trim().toLowerCase(), email, avatar, bio })
	});
	return unwrap<null>(res);
}

export async function changePassword(
	fetch: ApiClient,
	userId: number,
	oldPassword: string,
	password: string
): Promise<null> {
	const res = await fetch(`/users/${userId}`, {
		method: 'PUT',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ password, oldPassword })
	});
	return unwrap<null>(res);
}

export async function followUser(fetch: ApiClient, userId: number): Promise<null> {
	const res = await fetch(`/users/${userId}/follow`, { method: 'POST', body: '' });
	return unwrap<null>(res);
}

export async function unfollowUser(fetch: ApiClient, userId: number): Promise<null> {
	const res = await fetch(`/users/${userId}/follow`, { method: 'DELETE' });
	return unwrap<null>(res);
}

export async function getSuggestedUsers(fetch: ApiClient): Promise<{ items: User[] }> {
	const res = await fetch('/users/suggested');
	const dto = await unwrap<{ items: UserDto[] }>(res);
	return { items: (dto?.items ?? []).map(mapUser) };
}
