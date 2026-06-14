import {Injectable, signal} from '@angular/core';

@Injectable()
export class PaginationService<T> {
  data = signal<Array<T>>([]);
  perPage = 10;
  page = 0;
  hasMore = signal(true);

  update(data: Array<T>, totalFetched: number = data.length) {
    this.data.update(curr => [...curr, ...data]);
    this.page++;
    this.hasMore.set(totalFetched === this.perPage);
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
    this.page = 0;
    this.data.set([]);
    this.hasMore.set(true);
  }

  count() {
    return this.data().length;
  }
}
