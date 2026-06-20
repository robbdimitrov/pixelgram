import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getComments } from '$lib/server/api/posts';

export const GET: RequestHandler = async ({ fetch, params, url }) => {
  const cursor = url.searchParams.get('cursor') ?? undefined;
  return json(await getComments(fetch, params.publicId, cursor));
};
