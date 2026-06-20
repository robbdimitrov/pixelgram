import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getCurrent, changePassword } from '$lib/server/api/users';

export const actions: Actions = {
  default: async ({ fetch, request }) => {
    const currentUser = await getCurrent(fetch);
    if (!currentUser) {
      throw redirect(303, '/login');
    }

    const data = await request.formData();
    const oldPassword = (data.get('oldPassword') as string ?? '');
    const password = (data.get('password') as string ?? '');

    if (!oldPassword || !password) {
      return fail(400, { error: 'Both passwords are required.' });
    }

    if (password.length < 8) {
      return fail(400, { error: 'New password must be at least 8 characters.' });
    }

    await changePassword(fetch, currentUser.id, oldPassword, password);
    throw redirect(303, '/settings');
  }
};
