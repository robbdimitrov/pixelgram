import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFollowers, getFollowing } from '$lib/server/api/users';

export const GET: RequestHandler = async ({ fetch, params, url }) => {
  const username = params.username.slice(1);
  const mode = params.mode as 'followers' | 'following';
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const page =
    mode === 'followers'
      ? await getFollowers(fetch, username, cursor)
      : await getFollowing(fetch, username, cursor);
  return json(page);
};
