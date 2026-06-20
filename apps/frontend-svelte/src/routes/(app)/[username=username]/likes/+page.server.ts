import type { PageServerLoad } from './$types';
import { getLikedPosts } from '$lib/server/api/posts';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const username = params.username.slice(1); // remove the @ prefix
  const page = await getLikedPosts(fetch, username);
  return { username, posts: page.items, nextCursor: page.nextCursor };
};
