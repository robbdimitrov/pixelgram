import type { Session, SessionDto } from '$lib/types';
import { mapSession } from '$lib/utils/mappers';
import type { ApiClient } from './client';
import { unwrap } from './http';

export async function getSessions(fetch: ApiClient): Promise<Session[]> {
	const res = await fetch('/sessions');
	const body = await unwrap<{ sessions: SessionDto[] }>(res);
	return (body?.sessions ?? []).map(mapSession);
}

export async function deleteSession(fetch: ApiClient, sessionID: string): Promise<null> {
	const res = await fetch(`/sessions/${encodeURIComponent(sessionID)}`, { method: 'DELETE' });
	return unwrap<null>(res);
}
