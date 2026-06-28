import { json, type RequestEvent } from '@sveltejs/kit';
import { apiClient, type ApiClient } from '$lib/server/api/client';

type CursorEndpointEvent = Pick<RequestEvent, 'fetch' | 'cookies' | 'url'>;

export async function cursorEndpoint<T>(
	event: CursorEndpointEvent,
	loadPage: (client: ApiClient, cursor: string | undefined) => Promise<T>
) {
	if (!event.cookies.get('session')) return new Response(null, { status: 401 });
	const cursor = event.url.searchParams.get('cursor') ?? undefined;
	return json(await loadPage(apiClient(event), cursor));
}
