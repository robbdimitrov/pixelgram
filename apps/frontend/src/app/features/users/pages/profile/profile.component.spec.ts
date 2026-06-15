import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {of, Subject} from 'rxjs';

import {ProfileComponent} from './profile.component';
import {UserService} from '../../services/user.service';
import {PaginationService} from '../../../../shared/services/pagination.service';
import {SessionService} from '../../../auth/session.service';
import {User} from '../../models/user.model';
import {PostService} from '../../../posts/services/post.service';

describe('ProfileComponent', () => {
  it('should not load an invalid user route', () => {
    const userService = {getUserByUsername: vi.fn()};
    const pagination = {
      data: signal([]),
      cursor: null,
      hasMore: signal(false),
      reset: vi.fn(),
      count: vi.fn(() => 0)
    };

    TestBed.configureTestingModule({
      providers: [
        {provide: UserService, useValue: userService},
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
    expect(userService.getUserByUsername).not.toHaveBeenCalled();
  });

  it('renders the profile and empty state after asynchronous responses', () => {
    const userResponse = new Subject<User>();
    const postsResponse = new Subject<{items: never[]; nextCursor: null}>();
    const userService = {
      getUserByUsername: vi.fn().mockReturnValue(userResponse)
    };
    const postService = {
      getPosts: vi.fn().mockReturnValue(postsResponse)
    };

    TestBed.configureTestingModule({
      providers: [
        {provide: UserService, useValue: userService},
        {provide: PostService, useValue: postService},
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
    expect(fixture.nativeElement.textContent.replace(/\s+/g, ' ')).toContain('No uploads yet');
  });

  it('should reset pagination and fetch each profile from a fresh cursor', () => {
    const params = new Subject<Record<string, string>>();
    const userService = {
      getUserByUsername: vi.fn((username: string) => of(new User(
        username === 'first' ? 20 : 21, 'Profile', username, 'profile@example.com',
        null, null, 0, 0, 0, 0, false, new Date()
      )))
    };
    const postService = {
      getPosts: vi.fn()
        .mockReturnValueOnce(of({items: [], nextCursor: null}))
        .mockReturnValueOnce(of({items: [], nextCursor: 'profile-next'}))
        .mockReturnValue(of({items: [], nextCursor: null}))
    };
    const pagination = {
      data: signal([]),
      cursor: null as string | null,
      hasMore: signal(true),
      reset: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
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
        {provide: UserService, useValue: userService},
        {provide: PostService, useValue: postService},
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
    expect(postService.getPosts).toHaveBeenNthCalledWith(1, 'first', null);
    expect(postService.getPosts).toHaveBeenNthCalledWith(2, 'second', null);

    component.onNextClick();

    expect(postService.getPosts).toHaveBeenNthCalledWith(3, 'second', 'profile-next');
  });
});
