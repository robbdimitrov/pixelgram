import type { PageServerLoad } from './$types';
import { getLikedPosts } from '$lib/server/api/posts';
import { stripAt } from '$lib/server/username';
import { apiClient } from '$lib/server/api/client';

export const load: PageServerLoad = async ({ fetch, cookies, params }) => {
	const username = stripAt(params.username);
	const page = await getLikedPosts(apiClient({ fetch, cookies }), username);
	return { username, posts: page.items, nextCursor: page.nextCursor };
};
