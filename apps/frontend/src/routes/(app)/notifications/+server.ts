import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getNotifications, markNotificationRead } from '$lib/server/api/notifications';
import { apiClient } from '$lib/server/api/client';

export const GET: RequestHandler = async ({ fetch, cookies, url }) => {
	const cursor = url.searchParams.get('cursor') ?? undefined;
	const client = apiClient({ fetch, cookies });
	const page = await getNotifications(client, cursor);

	// Mark newly loaded unread notifications as read; failures are best-effort.
	await Promise.allSettled(
		page.items.filter((n) => !n.read).map((n) => markNotificationRead(client, n.id))
	);

	return json(page);
};
