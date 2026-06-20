import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserPosts } from '$lib/server/api/posts';

export const GET: RequestHandler = async ({ fetch, params, url }) => {
  const username = params.username.slice(1);
  const cursor = url.searchParams.get('cursor') ?? undefined;
  return json(await getUserPosts(fetch, username, cursor));
};
