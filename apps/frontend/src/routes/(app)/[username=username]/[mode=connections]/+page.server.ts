import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getByUsername, getFollowers, getFollowing } from '$lib/server/api/users';
import { stripAt } from '$lib/server/username';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const username = stripAt(params.username);
  const mode = params.mode as 'followers' | 'following';

  const profileUser = await getByUsername(fetch, username);
  if (!profileUser) throw error(404, 'User not found');

  const page =
    mode === 'followers'
      ? await getFollowers(fetch, username)
      : await getFollowing(fetch, username);

  return {
    profileUser,
    mode,
    users: page.items,
    nextCursor: page.nextCursor
  };
};
