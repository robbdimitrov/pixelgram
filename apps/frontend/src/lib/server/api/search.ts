import type { ApiClient } from './client';
import { unwrap } from './http';

export interface UserSuggestion {
	username: string;
	name: string;
}

export interface HashtagSuggestion {
	name: string;
}

export async function searchUsers(fetch: ApiClient, q: string): Promise<UserSuggestion[]> {
	const res = await fetch(`/users/search?q=${encodeURIComponent(q)}`);
	return (await unwrap<UserSuggestion[]>(res)) ?? [];
}

export async function searchHashtags(fetch: ApiClient, q: string): Promise<HashtagSuggestion[]> {
	const res = await fetch(`/hashtags/search?q=${encodeURIComponent(q)}`);
	return (await unwrap<HashtagSuggestion[]>(res)) ?? [];
}

export type SearchType = 'users' | 'posts' | 'hashtags';

export interface SearchUserItem {
	id: string;
	username: string;
	name: string;
}

export interface SearchPostItem {
	id: string;
	username: string;
	description: string;
}

export interface SearchHashtagItem {
	id: string;
	name: string;
	post_count: number;
}

export type SearchItem = SearchUserItem | SearchPostItem | SearchHashtagItem;

export interface SearchPage {
	items: SearchItem[];
	nextCursor: string | null;
}

export async function search(
	fetch: ApiClient,
	params: { q: string; type: SearchType; cursor?: string }
): Promise<SearchPage> {
	const qs = new URLSearchParams({ q: params.q, type: params.type });
	if (params.cursor) qs.set('cursor', params.cursor);
	const res = await fetch(`/search?${qs.toString()}`);
	const page = await unwrap<{ items: SearchItem[]; nextCursor: string | null }>(res);
	return { items: page?.items ?? [], nextCursor: page?.nextCursor ?? null };
}
