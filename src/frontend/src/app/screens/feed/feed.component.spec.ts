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
      getLikedImages: jest.fn(),
      getImage: jest.fn(),
      likeImage: jest.fn(),
      unlikeImage: jest.fn(),
      deleteImage: jest.fn()
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
    expect(component.imageId).toBeUndefined();
    expect(mockApiClient.getFeed).toHaveBeenCalledWith(1);
    expect(mockPagination.update).toHaveBeenCalled();
    expect(component.hasLoaded).toBe(true);
  });

  it('should load specific image if imageId param provided', () => {
    mockRoute.params = of({ imageId: '10' });
    mockApiClient.getImage.mockReturnValue(of({ id: 10, filename: 'test10.jpg' }));

    component = new FeedComponent(mockApiClient, mockPagination, mockRouter, mockRoute);

    expect(component.imageId).toBe(10);
    expect(mockApiClient.getImage).toHaveBeenCalledWith('10');
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
      mockApiClient.likeImage.mockReturnValue(throwError(() => new Error('Failed to like')));
      
      // Assume the UI already updated optimistic state before calling onLike, 
      // but the component actually doesn't optimistically update in onLike, it expects the UI to do it?
      // Wait, let's look at the component code. It only reverts on error.
      // So if it errors, it sets liked = false, likes -= 1
      mockPagination.data[0].liked = true;
      mockPagination.data[0].likes = 1;

      component.onLike(1);

      expect(mockApiClient.likeImage).toHaveBeenCalledWith(1);
      expect(mockPagination.data[0].liked).toBe(false);
      expect(mockPagination.data[0].likes).toBe(0);
    });

    it('should revert optimistic unlike on error', () => {
      mockApiClient.unlikeImage.mockReturnValue(throwError(() => new Error('Failed to unlike')));
      
      mockPagination.data[0].liked = false;
      mockPagination.data[0].likes = 0;

      component.onUnlike(1);

      expect(mockApiClient.unlikeImage).toHaveBeenCalledWith(1);
      expect(mockPagination.data[0].liked).toBe(true);
      expect(mockPagination.data[0].likes).toBe(1);
    });
  });
});
