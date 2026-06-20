export function createPagination<T>(
  getInitial: () => { items: T[]; nextCursor: string | null },
  fetchPage: (cursor: string) => Promise<{ items: T[]; nextCursor: string | null }>
) {
  const initial = getInitial();
  let source = initial.items;
  let items = $state(initial.items);
  let cursor = $state(initial.nextCursor);
  let loading = $state(false);
  let error = $state<string | null>(null);

  // Reset when the page's initial data changes (client-side navigation reuses
  // the component, so a fresh `data.items` reference must replace stale state).
  $effect(() => {
    const next = getInitial();
    if (next.items !== source) {
      source = next.items;
      items = next.items;
      cursor = next.nextCursor;
      error = null;
    }
  });

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
