export function createPagination<T>(
  initial: { items: T[]; nextCursor: string | null },
  fetchPage: (cursor: string) => Promise<{ items: T[]; nextCursor: string | null }>
) {
  let items = $state(initial.items);
  let cursor = $state(initial.nextCursor);
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function more() {
    if (loading || !cursor) return;
    loading = true;
    error = null;
    try {
      const next = await fetchPage(cursor);
      items = [...items, ...next.items];
      cursor = next.nextCursor;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load more';
    } finally {
      loading = false;
    }
  }

  return {
    get items() { return items; },
    get done() { return !cursor; },
    get loading() { return loading; },
    get error() { return error; },
    more
  };
}
