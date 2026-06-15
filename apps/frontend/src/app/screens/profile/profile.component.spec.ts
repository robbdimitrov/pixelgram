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
    const apiClient = {getUserByUsername: jest.fn()};
    const pagination = {
      data: signal([]),
      cursor: null,
      hasMore: signal(false),
      reset: jest.fn(),
      count: jest.fn(() => 0)
    };

    TestBed.configureTestingModule({
      providers: [
        {provide: APIClient, useValue: apiClient},
        {provide: SessionService, useValue: {userId: () => null}},
        {provide: ActivatedRoute, useValue: {params: of({})}}
      ]
    });
    TestBed.overrideComponent(ProfileComponent, {
      set: {providers: [{provide: PaginationService, useValue: pagination}]}
    });

    const component = TestBed.createComponent(ProfileComponent).componentInstance;

    expect(component.user()).toBeUndefined();
    expect(component.hasLoadedPosts()).toBe(true);
    expect(pagination.reset).toHaveBeenCalled();
    expect(apiClient.getUserByUsername).not.toHaveBeenCalled();
  });

  it('renders the profile and empty state after asynchronous responses', () => {
    const userResponse = new Subject<User>();
    const postsResponse = new Subject<{items: never[]; nextCursor: null}>();
    const apiClient = {
      getUserByUsername: jest.fn().mockReturnValue(userResponse),
      getPosts: jest.fn().mockReturnValue(postsResponse)
    };

    TestBed.configureTestingModule({
      providers: [
        {provide: APIClient, useValue: apiClient},
        {provide: SessionService, useValue: {userId: () => 20}},
        {provide: ActivatedRoute, useValue: {params: of({username: 'profiletest'})}}
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
    postsResponse.next({items: [], nextCursor: null});
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Profile Test');
    expect(fixture.nativeElement.textContent).toContain('No uploads yet');
  });

  it('should reset pagination and fetch each profile from a fresh cursor', () => {
    const params = new Subject<Record<string, string>>();
    const apiClient = {
      getUserByUsername: jest.fn((username: string) => of(new User(
        username === 'first' ? 20 : 21, 'Profile', username, 'profile@example.com',
        null, null, 0, 0, 0, 0, false, new Date()
      ))),
      getPosts: jest.fn()
        .mockReturnValueOnce(of({items: [], nextCursor: null}))
        .mockReturnValueOnce(of({items: [], nextCursor: 'profile-next'}))
        .mockReturnValue(of({items: [], nextCursor: null}))
    };
    const pagination = {
      data: signal([]),
      cursor: null as string | null,
      hasMore: signal(true),
      reset: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    };
    pagination.reset.mockImplementation(() => {
      pagination.cursor = null;
      pagination.data.set([]);
      pagination.hasMore.set(true);
    });
    pagination.update.mockImplementation((_items, nextCursor) => {
      pagination.cursor = nextCursor;
      pagination.hasMore.set(nextCursor !== null);
    });
    pagination.count.mockImplementation(() => pagination.data().length);

    TestBed.configureTestingModule({
      providers: [
        {provide: APIClient, useValue: apiClient},
        {provide: SessionService, useValue: {userId: () => 1}},
        {provide: ActivatedRoute, useValue: {params}}
      ]
    });
    TestBed.overrideComponent(ProfileComponent, {
      set: {providers: [{provide: PaginationService, useValue: pagination}]}
    });
    const component = TestBed.createComponent(ProfileComponent).componentInstance;

    params.next({username: 'first'});
    pagination.cursor = 'old-profile-cursor';
    params.next({username: 'second'});

    expect(pagination.reset).toHaveBeenCalledTimes(2);
    expect(apiClient.getPosts).toHaveBeenNthCalledWith(1, 'first', null);
    expect(apiClient.getPosts).toHaveBeenNthCalledWith(2, 'second', null);

    component.onNextClick();

    expect(apiClient.getPosts).toHaveBeenNthCalledWith(3, 'second', 'profile-next');
  });
});
