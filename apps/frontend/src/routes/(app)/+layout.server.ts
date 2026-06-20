import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getCurrent } from '$lib/server/api/users';

export const load: LayoutServerLoad = async ({ fetch }) => {
  const currentUser = await getCurrent(fetch);
  if (!currentUser) {
    throw redirect(303, '/login');
  }
  return { currentUser };
};
