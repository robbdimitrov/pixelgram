import {Injectable} from '@angular/core';

@Injectable()
export class PaginationService<T> {
  data: Array<T> = [];
  perPage = 10;
  page = 0;
  hasMore = true;

  update(data: Array<T>, totalFetched: number = data.length) {
    this.data.push(...data);
    this.page++;
    this.hasMore = totalFetched === this.perPage;
  }

  remove(item: T) {
    const index = this.data.indexOf(item);
    if (index > -1) {
      this.data.splice(index, 1);
    }
  }

  reset() {
    this.page = 0;
    this.data = [];
    this.hasMore = true;
  }

  count() {
    return this.data.length;
  }
}
