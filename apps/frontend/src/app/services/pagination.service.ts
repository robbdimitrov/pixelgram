import {Injectable, signal} from '@angular/core';

@Injectable()
export class PaginationService<T> {
  data = signal<Array<T>>([]);
  cursor: string | null = null;
  hasMore = signal(true);

  update(data: Array<T>, nextCursor: string | null) {
    this.data.update(curr => [...curr, ...data]);
    this.cursor = nextCursor;
    this.hasMore.set(nextCursor !== null);
  }

  remove(item: T) {
    this.data.update(curr => {
      const index = curr.indexOf(item);
      if (index > -1) {
        const next = [...curr];
        next.splice(index, 1);
        return next;
      }
      return curr;
    });
  }

  reset() {
    this.cursor = null;
    this.data.set([]);
    this.hasMore.set(true);
  }

  count() {
    return this.data().length;
  }
}
