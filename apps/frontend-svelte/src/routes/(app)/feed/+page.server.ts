import type { PageServerLoad } from './$types';
import { getFeed } from '$lib/server/api/posts';

export const load: PageServerLoad = async ({ fetch }) => {
  const page = await getFeed(fetch);
  return { posts: page.items, nextCursor: page.nextCursor };
};
