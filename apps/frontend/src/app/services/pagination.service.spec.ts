import {PaginationService} from './pagination.service';

describe('PaginationService', () => {
  it('should advance and reset cursor state', () => {
    const pagination = new PaginationService<number>();

    pagination.update([1, 2], 'next');

    expect(pagination.data()).toEqual([1, 2]);
    expect(pagination.cursor).toBe('next');
    expect(pagination.hasMore()).toBe(true);

    pagination.update([3], null);

    expect(pagination.data()).toEqual([1, 2, 3]);
    expect(pagination.cursor).toBeNull();
    expect(pagination.hasMore()).toBe(false);

    pagination.reset();

    expect(pagination.data()).toEqual([]);
    expect(pagination.cursor).toBeNull();
    expect(pagination.hasMore()).toBe(true);
  });
});
