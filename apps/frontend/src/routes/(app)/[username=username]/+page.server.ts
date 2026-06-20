import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getByUsername, followUser, unfollowUser } from '$lib/server/api/users';
import { getUserPosts } from '$lib/server/api/posts';
import { stripAt } from '$lib/server/username';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const username = stripAt(params.username);
  const [profileUser, postsPage] = await Promise.all([
    getByUsername(fetch, username),
    getUserPosts(fetch, username)
  ]);
  if (!profileUser) throw error(404, 'User not found');
  return {
    profileUser,
    posts: postsPage.items,
    nextCursor: postsPage.nextCursor
  };
};

export const actions: Actions = {
  follow: async ({ fetch, params }) => {
    const username = stripAt(params.username);
    const profileUser = await getByUsername(fetch, username);
    if (!profileUser) return { success: false };
    await followUser(fetch, profileUser.id);
    return { success: true };
  },
  unfollow: async ({ fetch, params }) => {
    const username = stripAt(params.username);
    const profileUser = await getByUsername(fetch, username);
    if (!profileUser) return { success: false };
    await unfollowUser(fetch, profileUser.id);
    return { success: true };
  }
};
