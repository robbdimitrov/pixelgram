import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFollowers, getFollowing } from '$lib/server/api/users';
import { stripAt } from '$lib/server/username';
import { apiClient } from '$lib/server/api/client';

export const GET: RequestHandler = async ({ fetch, cookies, params, url }) => {
  const api = apiClient({ fetch, cookies });
  const username = stripAt(params.username);
  const mode = params.mode as 'followers' | 'following';
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const page =
    mode === 'followers'
      ? await getFollowers(api, username, cursor)
      : await getFollowing(api, username, cursor);
  return json(page);
};
