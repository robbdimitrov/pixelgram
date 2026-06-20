import { fail, redirect } from '@sveltejs/kit';
import { parse as parseSetCookie } from 'set-cookie-parser';
import type { Actions } from './$types';
import { login } from '$lib/server/api/auth';

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

    // handleFetch rewrites /api/ → BACKEND_URL (cross-origin) so Set-Cookie is NOT auto-applied.
    // We must manually parse and re-emit it.
    const setCookieHeader = res.headers.get('set-cookie') ?? '';
    for (const c of parseSetCookie(setCookieHeader, { map: false })) {
      cookies.set(c.name, c.value, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: c.maxAge
      });
    }

    throw redirect(303, '/feed');
  }
};
