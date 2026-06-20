import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserPosts } from '$lib/server/api/posts';
import { stripAt } from '$lib/server/username';

export const GET: RequestHandler = async ({ fetch, params, url }) => {
  const username = stripAt(params.username);
  const cursor = url.searchParams.get('cursor') ?? undefined;
  return json(await getUserPosts(fetch, username, cursor));
};
