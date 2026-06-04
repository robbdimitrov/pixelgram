import { FeedComponent } from './feed.component';
import { of, throwError } from 'rxjs';

describe('FeedComponent', () => {
  let component: FeedComponent;
  let mockApiClient: any;
  let mockPagination: any;
  let mockRouter: any;
  let mockRoute: any;

  beforeEach(() => {
    mockApiClient = {
      getFeed: jest.fn(),
      getLikedPosts: jest.fn(),
      getPost: jest.fn(),
      likePost: jest.fn(),
      unlikePost: jest.fn(),
      deletePost: jest.fn()
    };

    mockPagination = {
      data: [],
      page: 1,
      hasMore: true,
      update: jest.fn((data, length) => {
        mockPagination.data = [...mockPagination.data, ...data];
      }),
      remove: jest.fn(),
      count: jest.fn(() => mockPagination.data.length)
    };

    mockRouter = {
      navigate: jest.fn()
    };

    // Set a default empty route params
    mockRoute = {
      params: of({})
    };
  });

  it('should initialize and load feed if no params provided', () => {
    mockApiClient.getFeed.mockReturnValue(of([{ id: 1, filename: 'test.jpg' }]));

    component = new FeedComponent(mockApiClient, mockPagination, mockRouter, mockRoute);

    expect(component.userId).toBeUndefined();
    expect(component.postId).toBeUndefined();
    expect(mockApiClient.getFeed).toHaveBeenCalledWith(1);
    expect(mockPagination.update).toHaveBeenCalled();
    expect(component.hasLoaded).toBe(true);
  });

  it('should load specific post if postId param provided', () => {
    mockRoute.params = of({ postId: '10' });
    mockApiClient.getPost.mockReturnValue(of({ id: 10, filename: 'test10.jpg' }));

    component = new FeedComponent(mockApiClient, mockPagination, mockRouter, mockRoute);

    expect(component.postId).toBe(10);
    expect(mockApiClient.getPost).toHaveBeenCalledWith('10');
  });

  it('should handle API errors gracefully during loadNextPage', () => {
    mockApiClient.getFeed.mockReturnValue(throwError(() => new Error('API Error')));
    
    component = new FeedComponent(mockApiClient, mockPagination, mockRouter, mockRoute);
    
    expect(component.isLoadingNextPage).toBe(false);
    expect(component.hasLoaded).toBe(true);
    expect(mockPagination.update).not.toHaveBeenCalled();
  });

  describe('Likes', () => {
    beforeEach(() => {
      mockRoute.params = of({});
      mockApiClient.getFeed.mockReturnValue(of([]));
      component = new FeedComponent(mockApiClient, mockPagination, mockRouter, mockRoute);
      mockPagination.data = [{ id: 1, liked: false, likes: 0 }];
    });

    it('should revert optimistic like on error', () => {
      mockApiClient.likePost.mockReturnValue(throwError(() => new Error('Failed to like')));

      mockPagination.data[0].liked = true;
      mockPagination.data[0].likes = 1;

      component.onLike(1);

      expect(mockApiClient.likePost).toHaveBeenCalledWith(1);
      expect(mockPagination.data[0].liked).toBe(false);
      expect(mockPagination.data[0].likes).toBe(0);
    });

    it('should revert optimistic unlike on error', () => {
      mockApiClient.unlikePost.mockReturnValue(throwError(() => new Error('Failed to unlike')));

      mockPagination.data[0].liked = false;
      mockPagination.data[0].likes = 0;

      component.onUnlike(1);

      expect(mockApiClient.unlikePost).toHaveBeenCalledWith(1);
      expect(mockPagination.data[0].liked).toBe(true);
      expect(mockPagination.data[0].likes).toBe(1);
    });
  });
});
