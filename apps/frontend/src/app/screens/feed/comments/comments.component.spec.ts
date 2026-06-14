import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';

import {CommentsComponent} from './comments.component';
import {APIClient} from '../../../services/api-client.service';
import {PaginationService} from '../../../services/pagination.service';
import {SessionService} from '../../../services/session.service';

describe('CommentsComponent', () => {
  it('should load comments after the required post input is bound', async () => {
    const apiClient = {getComments: jest.fn().mockReturnValue(of([]))};
    const pagination = {
      data: signal([]),
      page: 1,
      hasMore: signal(false),
      update: jest.fn()
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
    fixture.componentRef.setInput('postId', 42);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(apiClient.getComments).toHaveBeenCalledWith(42, 1);
    expect(pagination.update).toHaveBeenCalledWith([], 0);
  });
});
