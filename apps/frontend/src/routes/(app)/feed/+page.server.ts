import type { PageServerLoad } from './$types';
import { getFeed } from '$lib/server/api/posts';
import { apiClient } from '$lib/server/api/client';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const page = await getFeed(apiClient({ fetch, cookies }));
	return { posts: page.items, nextCursor: page.nextCursor };
};
