export async function fetchJson<T>(res: Response): Promise<T> {
	if (!res.ok) {
		if (res.status === 401) throw new Error('Please sign in to continue.');
		if (res.status === 429) throw new Error('Too many requests. Please try again later.');
		throw new Error('Could not load more items. Please try again.');
	}
	const text = await res.text();
	if (!text) throw new Error('Empty response body');
	return JSON.parse(text) as T;
}
