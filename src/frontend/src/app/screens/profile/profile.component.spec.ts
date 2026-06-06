import {TestBed} from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';

import {ProfileComponent} from './profile.component';
import {APIClient} from '../../services/api-client.service';
import {PaginationService} from '../../services/pagination.service';
import {SessionService} from '../../services/session.service';

describe('ProfileComponent', () => {
  it('should not load an invalid user route', () => {
    const apiClient = {getUser: jest.fn()};
    const pagination = {
      data: [],
      page: 1,
      hasMore: false,
      reset: jest.fn(),
      count: jest.fn(() => 0)
    };

    TestBed.configureTestingModule({
      providers: [
        {provide: APIClient, useValue: apiClient},
        {provide: SessionService, useValue: {userId: () => null}},
        {provide: ActivatedRoute, useValue: {params: of({userId: 'invalid'})}}
      ]
    });
    TestBed.overrideComponent(ProfileComponent, {
      set: {providers: [{provide: PaginationService, useValue: pagination}]}
    });

    const component = TestBed.createComponent(ProfileComponent).componentInstance;

    expect(component.user).toBeUndefined();
    expect(component.hasLoadedPosts).toBe(true);
    expect(pagination.reset).toHaveBeenCalled();
    expect(apiClient.getUser).not.toHaveBeenCalled();
  });
});
