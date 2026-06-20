export function createPagination<T>(
  initial: { items: T[]; nextCursor: string | null },
  fetchPage: (cursor: string) => Promise<{ items: T[]; nextCursor: string | null }>
) {
  let items = $state(initial.items);
  let cursor = $state(initial.nextCursor);
  let loading = $state(false);

  async function more() {
    if (loading || !cursor) return;
    loading = true;
    try {
      const next = await fetchPage(cursor);
      items = [...items, ...next.items];
      cursor = next.nextCursor;
    } finally {
      loading = false;
    }
  }

  return {
    get items() { return items; },
    get done() { return !cursor; },
    get loading() { return loading; },
    more
  };
}
