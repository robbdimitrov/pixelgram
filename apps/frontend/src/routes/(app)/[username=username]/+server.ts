import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserPosts } from '$lib/server/api/posts';
import { stripAt } from '$lib/server/username';
import { apiClient } from '$lib/server/api/client';

export const GET: RequestHandler = async ({ fetch, cookies, params, url }) => {
  const username = stripAt(params.username);
  const cursor = url.searchParams.get('cursor') ?? undefined;
  return json(await getUserPosts(apiClient({ fetch, cookies }), username, cursor));
};
