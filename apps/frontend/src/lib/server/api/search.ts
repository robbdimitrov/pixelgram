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
