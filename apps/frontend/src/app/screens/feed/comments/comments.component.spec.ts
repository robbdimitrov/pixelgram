import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';

import {CommentsComponent} from './comments.component';
import {APIClient} from '../../../services/api-client.service';
import {PaginationService} from '../../../services/pagination.service';
import {SessionService} from '../../../services/session.service';

describe('CommentsComponent', () => {
  const publicId = '550e8400-e29b-41d4-a716-446655440000';
  it('should advance through comment cursors', async () => {
    const firstPage = Array.from({length: 10}, (_, id) => ({id}));
    const apiClient = {
      getComments: jest.fn()
        .mockReturnValueOnce(of({items: firstPage, nextCursor: 'comments-next'}))
        .mockReturnValue(of({items: [], nextCursor: null}))
    };
    const pagination = {
      data: signal([]),
      cursor: null as string | null,
      hasMore: signal(true),
      update: jest.fn((_items, nextCursor) => {
        pagination.cursor = nextCursor;
        pagination.hasMore.set(nextCursor !== null);
      })
    };

    TestBed.configureTestingModule({
      providers: [
        {provide: APIClient, useValue: apiClient},
        {provide: SessionService, useValue: {userId: () => 1}}
      ]
    });
    TestBed.overrideComponent(CommentsComponent, {
      set: {providers: [{provide: PaginationService, useValue: pagination}]}
    });
    const fixture = TestBed.createComponent(CommentsComponent);
    fixture.componentRef.setInput('publicId', publicId);

    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;

    expect(apiClient.getComments).toHaveBeenCalledWith(publicId, null);
    expect(pagination.update).toHaveBeenCalledWith(firstPage, 'comments-next');

    component.onLoadMore();

    expect(apiClient.getComments).toHaveBeenLastCalledWith(publicId, 'comments-next');
    expect(pagination.update).toHaveBeenLastCalledWith([], null);
  });
});
