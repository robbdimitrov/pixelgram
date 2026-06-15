import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {of, Subject} from 'rxjs';

import {ProfileComponent} from './profile.component';
import {APIClient} from '../../services/api-client.service';
import {PaginationService} from '../../services/pagination.service';
import {SessionService} from '../../services/session.service';
import {User} from '../../models/user.model';

describe('ProfileComponent', () => {
  it('should not load an invalid user route', () => {
    const apiClient = {getUser: jest.fn()};
    const pagination = {
      data: signal([]),
      page: 1,
      hasMore: signal(false),
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

    expect(component.user()).toBeUndefined();
    expect(component.hasLoadedPosts()).toBe(true);
    expect(pagination.reset).toHaveBeenCalled();
    expect(apiClient.getUser).not.toHaveBeenCalled();
  });

  it('renders the profile and empty state after asynchronous responses', () => {
    const userResponse = new Subject<User>();
    const postsResponse = new Subject<never[]>();
    const apiClient = {
      getUser: jest.fn().mockReturnValue(userResponse),
      getPosts: jest.fn().mockReturnValue(postsResponse)
    };

    TestBed.configureTestingModule({
      providers: [
        {provide: APIClient, useValue: apiClient},
        {provide: SessionService, useValue: {userId: () => 20}},
        {provide: ActivatedRoute, useValue: {params: of({userId: '20'})}}
      ]
    });

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    userResponse.next({
      id: 20,
      name: 'Profile Test',
      username: 'profiletest',
      email: 'profile@example.com',
      avatar: null,
      bio: null,
      posts: 0,
      likes: 0,
      followers: 0,
      following: 0,
      isFollowing: false,
      created: new Date()
    });
    postsResponse.next([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Profile Test');
    expect(fixture.nativeElement.textContent).toContain('No uploads yet');
  });
});
