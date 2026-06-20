import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { applySessionCookie, createUser, login } from '$lib/server/api/auth';

export const actions: Actions = {
  default: async ({ request, fetch, cookies }) => {
    const data = await request.formData();
    const name = (data.get('name') as string ?? '').trim();
    const username = (data.get('username') as string ?? '').trim().toLowerCase();
    const email = (data.get('email') as string ?? '').trim();
    const password = (data.get('password') as string ?? '');

    if (!name || !username || !email || !password) {
      return fail(400, { error: 'All fields are required.' });
    }

    const created = await createUser(fetch, name, username, email, password);
    if (!created) {
      return fail(400, { error: 'Could not create account. Please try again.' });
    }

    const res = await login(fetch, email, password);
    if (!res.ok) {
      throw redirect(303, '/login');
    }

    if (!applySessionCookie(res.headers, cookies)) {
      return fail(502, { error: 'Account created, but sign-in failed. Please log in.' });
    }

    throw redirect(303, '/feed');
  }
};
