import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';

import {CommentsComponent} from './comments.component';
import {PostService} from '../../../services/post.service';
import {PaginationService} from '../../../../../shared/services/pagination.service';
import {SessionService} from '../../../../auth/session.service';

describe('CommentsComponent', () => {
  const publicId = '550e8400-e29b-41d4-a716-446655440000';
  it('should advance through comment cursors', async () => {
    const firstPage = Array.from({length: 10}, (_, id) => ({id}));
    const postService = {
      getComments: vi.fn()
        .mockReturnValueOnce(of({items: firstPage, nextCursor: 'comments-next'}))
        .mockReturnValue(of({items: [], nextCursor: null}))
    };
    const pagination = {
      data: signal([]),
      cursor: null as string | null,
      hasMore: signal(true),
      update: vi.fn((_items, nextCursor) => {
        pagination.cursor = nextCursor;
        pagination.hasMore.set(nextCursor !== null);
      })
    };

    TestBed.configureTestingModule({
      providers: [
        {provide: PostService, useValue: postService},
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

    expect(postService.getComments).toHaveBeenCalledWith(publicId, null);
    expect(pagination.update).toHaveBeenCalledWith(firstPage, 'comments-next');

    component.onLoadMore();

    expect(postService.getComments).toHaveBeenLastCalledWith(publicId, 'comments-next');
    expect(pagination.update).toHaveBeenLastCalledWith([], null);
  });
});
