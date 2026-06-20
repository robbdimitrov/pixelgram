import type { PageServerLoad } from './$types';
import { getLikedPosts } from '$lib/server/api/posts';
import { stripAt } from '$lib/server/username';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const username = stripAt(params.username);
  const page = await getLikedPosts(fetch, username);
  return { username, posts: page.items, nextCursor: page.nextCursor };
};
