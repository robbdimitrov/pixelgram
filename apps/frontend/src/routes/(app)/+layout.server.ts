import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getCurrent } from '$lib/server/api/users';
import { getUnreadCount } from '$lib/server/api/notifications';
import { apiClient } from '$lib/server/api/client';

export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
	const client = apiClient({ fetch, cookies });
	const currentUser = await getCurrent(client);
	if (!currentUser) throw redirect(303, '/login');
	const unreadCount = await getUnreadCount(client).catch(() => 0);
	return { currentUser, unreadCount };
};
