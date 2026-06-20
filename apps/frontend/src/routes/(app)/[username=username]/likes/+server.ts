import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLikedPosts } from '$lib/server/api/posts';
import { stripAt } from '$lib/server/username';

export const GET: RequestHandler = async ({ fetch, url, params }) => {
  const username = stripAt(params.username);
  const cursor = url.searchParams.get('cursor') ?? undefined;
  return json(await getLikedPosts(fetch, username, cursor));
};
