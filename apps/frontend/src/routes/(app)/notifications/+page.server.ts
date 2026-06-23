import type { PageServerLoad } from './$types';
import { getNotifications, markNotificationRead } from '$lib/server/api/notifications';
import { apiClient } from '$lib/server/api/client';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const client = apiClient({ fetch, cookies });
	const page = await getNotifications(client);

	// Mark all unread notifications as read on page visit; failures are best-effort.
	await Promise.allSettled(
		page.items.filter((n) => !n.read).map((n) => markNotificationRead(client, n.id))
	);

	return { notifications: page.items, nextCursor: page.nextCursor };
};
