import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLikedPosts } from '$lib/server/api/posts';

export const GET: RequestHandler = async ({ fetch, url, params }) => {
  const username = params.username.slice(1);
  const cursor = url.searchParams.get('cursor') ?? undefined;
  return json(await getLikedPosts(fetch, username, cursor));
};
