import type { PageServerLoad } from './$types';
import { search, type SearchType } from '$lib/server/api/search';
import { apiClient } from '$lib/server/api/client';

const MAX_Q_LENGTH = 50;

function resolveType(q: string, param: string | null): SearchType {
	if (param === 'users' || param === 'posts' || param === 'hashtags') return param;
	if (q.startsWith('@')) return 'users';
	if (q.startsWith('#')) return 'hashtags';
	return 'posts';
}

export const load: PageServerLoad = async (event) => {
	const q = event.url.searchParams.get('q') ?? '';
	const typeParam = event.url.searchParams.get('type');
	const type = resolveType(q, typeParam);

	if (!q || q.length > MAX_Q_LENGTH) {
		return { q, type, items: [], nextCursor: null };
	}

	const page = await search(apiClient(event), { q, type });
	return { q, type, items: page.items, nextCursor: page.nextCursor };
};
