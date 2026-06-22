import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchUsers, searchHashtags } from '$lib/server/api/search';
import { apiClient } from '$lib/server/api/client';

const VALID_TYPES = new Set(['users', 'hashtags']);
const MAX_Q_LENGTH = 50;

export const GET: RequestHandler = async (event) => {
	const type = event.url.searchParams.get('type') ?? '';
	const q = event.url.searchParams.get('q') ?? '';

	if (!VALID_TYPES.has(type)) {
		throw error(400, JSON.stringify({ message: 'type must be users or hashtags' }));
	}
	if (q.length < 1 || q.length > MAX_Q_LENGTH) {
		throw error(400, JSON.stringify({ message: 'q must be 1–50 characters' }));
	}

	const client = apiClient(event);
	const results = type === 'users' ? await searchUsers(client, q) : await searchHashtags(client, q);

	return json(results);
};
