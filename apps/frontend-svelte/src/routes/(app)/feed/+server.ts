import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFeed } from '$lib/server/api/posts';

export const GET: RequestHandler = async ({ fetch, url }) => {
  const cursor = url.searchParams.get('cursor') ?? undefined;
  return json(await getFeed(fetch, cursor));
};
