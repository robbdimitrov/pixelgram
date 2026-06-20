import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { applySessionCookie, login } from '$lib/server/api/auth';

export const actions: Actions = {
  default: async ({ request, fetch, cookies }) => {
    const data = await request.formData();
    const email = (data.get('email') as string ?? '').trim();
    const password = (data.get('password') as string ?? '');

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required.' });
    }

    const res = await login(fetch, email, password);

    if (!res.ok) {
      return fail(res.status, { error: 'Invalid email or password.' });
    }

    // handleFetch targets BACKEND_URL, so the backend cookie must be re-emitted by SvelteKit.
    if (!applySessionCookie(res.headers, cookies)) {
      return fail(502, { error: 'Could not establish a session. Please try again.' });
    }

    throw redirect(303, '/feed');
  }
};
