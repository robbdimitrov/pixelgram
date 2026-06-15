import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {of, Subject, throwError} from 'rxjs';

import {FeedComponent} from './feed.component';
import {APIClient} from '../../services/api-client.service';
import {PaginationService} from '../../services/pagination.service';
import {ActivatedRoute} from '@angular/router';

describe('FeedComponent', () => {
  const publicId = '550e8400-e29b-41d4-a716-446655440000';
  let component: FeedComponent;
  let mockApiClient: any;
  let mockPagination: any;

  beforeEach(() => {
    mockApiClient = {
      getFeed: jest.fn(),
      getLikedPosts: jest.fn(),
      getPost: jest.fn(),
      getUser: jest.fn().mockReturnValue(of({id: 1, username: 'test'})),
      likePost: jest.fn(),
      unlikePost: jest.fn(),
      deletePost: jest.fn()
    };

    mockPagination = {
      data: signal([]),
      cursor: null as string | null,
      hasMore: signal(true),
      update: jest.fn((data, nextCursor) => {
        mockPagination.data.update((curr: any) => [...curr, ...data]);
        mockPagination.cursor = nextCursor;
        mockPagination.hasMore.set(nextCursor !== null);
      }),
      remove: jest.fn(),
      reset: jest.fn(() => {
        mockPagination.cursor = null;
        mockPagination.data.set([]);
        mockPagination.hasMore.set(true);
      }),
      count: jest.fn(() => mockPagination.data().length)
    };
  });

  function createFixture(params: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: APIClient, useValue: mockApiClient},
        {
          provide: ActivatedRoute,
          useValue: {params: of(params)}
        }
      ]
    });
    TestBed.overrideComponent(FeedComponent, {
      set: {providers: [{provide: PaginationService, useValue: mockPagination}]}
    });
    const fixture = TestBed.createComponent(FeedComponent);
    component = fixture.componentInstance;
    return fixture;
  }

  function createComponent(params: Record<string, string> = {}) {
    createFixture(params);
  }

  it('should initialize and load feed if no params provided', () => {
    mockApiClient.getFeed
      .mockReturnValueOnce(of({
        items: [{id: 1, filename: 'test.jpg', userId: 1}],
        nextCursor: 'feed-next'
      }))
      .mockReturnValue(of({items: [], nextCursor: null}));

    createComponent();

    expect(component.username()).toBeUndefined();
    expect(component.publicId()).toBeUndefined();
    expect(mockApiClient.getFeed).toHaveBeenCalledWith(null);
    expect(mockPagination.update).toHaveBeenCalled();
    expect(component.hasLoaded()).toBe(true);

    component.onNextClick();

    expect(mockApiClient.getFeed).toHaveBeenLastCalledWith('feed-next');
  });

  it('should reset pagination and use the likes endpoint after a route change', () => {
    const params = new Subject<Record<string, string>>();
    mockApiClient.getFeed.mockReturnValue(of({items: [], nextCursor: null}));
    mockApiClient.getLikedPosts
      .mockReturnValueOnce(of({items: [], nextCursor: 'likes-next'}))
      .mockReturnValue(of({items: [], nextCursor: null}));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: APIClient, useValue: mockApiClient},
        {provide: ActivatedRoute, useValue: {params}}
      ]
    });
    TestBed.overrideComponent(FeedComponent, {
      set: {providers: [{provide: PaginationService, useValue: mockPagination}]}
    });
    component = TestBed.createComponent(FeedComponent).componentInstance;

    params.next({});
    expect(mockApiClient.getFeed).toHaveBeenCalledWith(null);
    mockPagination.cursor = 'old-feed-cursor';

    params.next({username: 'testuser'});

    expect(mockPagination.reset).toHaveBeenCalledTimes(2);
    expect(mockApiClient.getLikedPosts).toHaveBeenCalledWith('testuser', null);

    component.onNextClick();

    expect(mockApiClient.getLikedPosts).toHaveBeenLastCalledWith('testuser', 'likes-next');
  });

  it('should load specific post if publicId param provided', () => {
    mockApiClient.getPost.mockReturnValue(of({id: 10, publicId, filename: 'test10.jpg', userId: 1}));

    createComponent({publicId});

    expect(component.publicId()).toBe(publicId);
    expect(mockApiClient.getPost).toHaveBeenCalledWith(publicId);
  });

  it('should handle API errors gracefully during loadNextPage', () => {
    mockApiClient.getFeed.mockReturnValue(throwError(() => new Error('API Error')));

    createComponent();

    expect(component.isLoadingNextPage()).toBe(false);
    expect(component.hasLoaded()).toBe(true);
    expect(mockPagination.update).not.toHaveBeenCalled();
  });

  it('should render the empty state after loading an empty feed', () => {
    mockApiClient.getFeed.mockReturnValue(of({items: [], nextCursor: null}));

    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ready for your first post?');
    expect(fixture.nativeElement.textContent).toContain('Share Your First Photo');
  });

  describe('Likes', () => {
    beforeEach(() => {
      mockApiClient.getFeed.mockReturnValue(of({items: [], nextCursor: null}));
      createComponent();
      mockPagination.data.set([{id: 1, publicId, liked: false, likes: 0}]);
    });

    it('should revert optimistic like on error', () => {
      mockApiClient.likePost.mockReturnValue(throwError(() => new Error('Failed to like')));

      mockPagination.data.set([{id: 1, publicId, liked: true, likes: 1}]);

      component.onLike(publicId);

      expect(mockApiClient.likePost).toHaveBeenCalledWith(publicId);
      expect(mockPagination.data()[0].liked).toBe(false);
      expect(mockPagination.data()[0].likes).toBe(0);
    });

    it('should revert optimistic unlike on error', () => {
      mockApiClient.unlikePost.mockReturnValue(throwError(() => new Error('Failed to unlike')));

      mockPagination.data.set([{id: 1, publicId, liked: false, likes: 0}]);

      component.onUnlike(publicId);

      expect(mockApiClient.unlikePost).toHaveBeenCalledWith(publicId);
      expect(mockPagination.data()[0].liked).toBe(true);
      expect(mockPagination.data()[0].likes).toBe(1);
    });
  });
});
