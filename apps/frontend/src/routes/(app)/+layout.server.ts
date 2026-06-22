import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getCurrent } from '$lib/server/api/users';
import { apiClient } from '$lib/server/api/client';

export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
	const currentUser = await getCurrent(apiClient({ fetch, cookies }));
	if (!currentUser) throw redirect(303, '/login');
	return { currentUser };
};
