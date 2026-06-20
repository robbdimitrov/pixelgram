import type { User, UserDto, CursorPage } from '$lib/types';
import { mapUser } from '$lib/utils/mappers';
import { unwrap, getCursorPage } from './http';

type Fetch = typeof globalThis.fetch;

export async function getByUsername(fetch: Fetch, username: string): Promise<User | null> {
  const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
  const dto = await unwrap<UserDto>(res);
  return dto ? mapUser(dto) : null;
}

export async function getCurrent(fetch: Fetch): Promise<User | null> {
  const res = await fetch('/api/users/me');
  if (res.status === 401) return null;
  const dto = await unwrap<UserDto>(res);
  return dto ? mapUser(dto) : null;
}

export async function getFollowers(
  fetch: Fetch,
  username: string,
  cursor?: string | null
): Promise<CursorPage<User>> {
  return getCursorPage(fetch, `/api/users/${encodeURIComponent(username)}/followers`, cursor, mapUser);
}

export async function getFollowing(
  fetch: Fetch,
  username: string,
  cursor?: string | null
): Promise<CursorPage<User>> {
  return getCursorPage(fetch, `/api/users/${encodeURIComponent(username)}/following`, cursor, mapUser);
}

export async function updateUser(
  fetch: Fetch,
  userId: number,
  name: string,
  username: string,
  email: string,
  avatar: string,
  bio: string
): Promise<null> {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, username: username.trim().toLowerCase(), email, avatar, bio })
  });
  return unwrap<null>(res);
}

export async function changePassword(
  fetch: Fetch,
  userId: number,
  oldPassword: string,
  password: string
): Promise<null> {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password, oldPassword })
  });
  return unwrap<null>(res);
}

export async function followUser(fetch: Fetch, userId: number): Promise<null> {
  const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST', body: '' });
  return unwrap<null>(res);
}

export async function unfollowUser(fetch: Fetch, userId: number): Promise<null> {
  const res = await fetch(`/api/users/${userId}/follow`, { method: 'DELETE' });
  return unwrap<null>(res);
}
