import type { Notification, CursorPage } from '$lib/types';
import { mapNotification } from '$lib/utils/mappers';
import { unwrap, getCursorPage } from './http';
import type { ApiClient } from './client';

export async function getNotifications(
	fetch: ApiClient,
	cursor?: string | null
): Promise<CursorPage<Notification>> {
	return getCursorPage(fetch, '/notifications', cursor, mapNotification);
}

export async function markNotificationRead(fetch: ApiClient, id: number): Promise<null> {
	if (!Number.isInteger(id) || id <= 0) {
		throw new Error('Invalid notification id');
	}
	const res = await fetch(`/notifications/${id}/read`, { method: 'PUT', body: '' });
	return unwrap<null>(res);
}

export async function getUnreadCount(fetch: ApiClient): Promise<number> {
	const res = await fetch('/notifications/unread-count');
	const data = await unwrap<{ count: number }>(res);
	return data?.count ?? 0;
}
