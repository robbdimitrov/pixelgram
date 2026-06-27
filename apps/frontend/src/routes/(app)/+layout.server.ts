import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getCurrent } from '$lib/server/api/users';
import { getUnreadCount } from '$lib/server/api/notifications';
import { apiClient } from '$lib/server/api/client';

export const load: LayoutServerLoad = async ({ fetch, cookies, depends }) => {
	depends('app:unreadCount');
	const client = apiClient({ fetch, cookies });
	const fullUser = await getCurrent(client);
	if (!fullUser) throw redirect(303, '/login');
	const { email: _, ...currentUser } = fullUser;
	const unreadCount = await getUnreadCount(client).catch(() => 0);
	return { currentUser, unreadCount };
};
