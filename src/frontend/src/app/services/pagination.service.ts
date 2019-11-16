import { Injectable } from '@angular/core';

@Injectable()
export class PaginationService<T> {
  data: Array<T> = [];
  perPage = 10;
  page = 0;

  update(data: Array<T>) {
    this.data.push(...data);
    this.updatePage();
  }

  remove(item: T) {
    const index = this.data.indexOf(item);
    if (index > -1) {
      this.data.splice(index, 1);
    }
    this.updatePage();
  }

  reset() {
    this.page = 0;
    this.data = [];
  }

  count() {
    return this.data.length;
  }

  private updatePage() {
    this.page = Math.floor(this.data.length / this.perPage);
  }
}
