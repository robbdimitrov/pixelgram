import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getComments } from '$lib/server/api/posts';
import { apiClient } from '$lib/server/api/client';

export const GET: RequestHandler = async ({ fetch, cookies, params, url }) => {
	if (!cookies.get('session')) return new Response(null, { status: 401 });
	const cursor = url.searchParams.get('cursor') ?? undefined;
	return json(await getComments(apiClient({ fetch, cookies }), params.publicId, cursor));
};
