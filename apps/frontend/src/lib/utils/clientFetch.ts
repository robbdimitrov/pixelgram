export async function fetchJson<T>(res: Response): Promise<T> {
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const text = await res.text();
	if (!text) throw new Error('Empty response body');
	return JSON.parse(text) as T;
}
