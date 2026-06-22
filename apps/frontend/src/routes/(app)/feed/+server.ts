import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFeed } from '$lib/server/api/posts';
import { apiClient } from '$lib/server/api/client';

export const GET: RequestHandler = async ({ fetch, cookies, url }) => {
	const cursor = url.searchParams.get('cursor') ?? undefined;
	return json(await getFeed(apiClient({ fetch, cookies }), cursor));
};
