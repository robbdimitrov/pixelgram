import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { logout } from '$lib/server/api/auth';

export const actions: Actions = {
  default: async ({ fetch, cookies }) => {
    await logout(fetch).catch(() => {});
    cookies.delete('session', { path: '/' });
    throw redirect(303, '/login');
  }
};
