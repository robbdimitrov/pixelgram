export async function fetchJson<T>(res: Response): Promise<T> {
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const text = await res.text();
	return text ? (JSON.parse(text) as T) : (null as T);
}
