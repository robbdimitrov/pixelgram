import { ImageUploadComponent } from './image-upload.component';
import { of, throwError } from 'rxjs';
import * as imageResizer from '../../shared/utils/image-resizer';

jest.mock('../../shared/utils/image-resizer', () => ({
  maxUploadSizeBytes: 1000,
  supportedUploadMimeTypes: ['image/jpeg'],
  resizeImageForUpload: jest.fn()
}));

describe('ImageUploadComponent', () => {
  let component: ImageUploadComponent;
  let mockApiClient: any;
  let mockRouter: any;

  beforeEach(() => {
    mockApiClient = {
      uploadImage: jest.fn(),
      createPost: jest.fn()
    };

    mockRouter = {
      navigate: jest.fn()
    };

    component = new ImageUploadComponent(mockRouter, mockApiClient);
    
    // Mock FileReader
    (global as any).FileReader = class {
      onload: any;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
      result = 'data:image/jpeg;base64,fake';
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('selectFile', () => {
    it('should select file and generate preview if resizing succeeds', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      (imageResizer.resizeImageForUpload as jest.Mock).mockResolvedValue(mockFile);

      await component['selectFile'](mockFile);
      
      // Wait for FileReader setTimeout
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(component.errorMessage).toBe('');
      expect(component.imagePreview).toBe('data:image/jpeg;base64,fake');
      expect(component['selectedFile']).toBe(mockFile);
      expect(component.canShare()).toBe(true);
    });

    it('should set errorMessage if resizing fails', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      (imageResizer.resizeImageForUpload as jest.Mock).mockRejectedValue(new Error('Resize failed'));

      await component['selectFile'](mockFile);

      expect(component.errorMessage).toBe('Resize failed');
      expect(component.imagePreview).toBe('');
      expect(component['selectedFile']).toBeUndefined();
      expect(component.canShare()).toBe(false);
    });
  });

  describe('onSubmitClick', () => {
    it('should upload and create post, then navigate to home', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component['selectedFile'] = mockFile;
      component.imageDescription = '   My Cool Photo   '; // Test trimming

      mockApiClient.uploadImage.mockReturnValue(of({ filename: 'uploaded.jpg' }));
      mockApiClient.createPost.mockReturnValue(of({ id: 1 }));

      component.onSubmitClick();

      expect(component.isSubmitting).toBe(false); // due to finalize
      expect(mockApiClient.uploadImage).toHaveBeenCalledWith(mockFile);
      expect(mockApiClient.createPost).toHaveBeenCalledWith('uploaded.jpg', 'My Cool Photo');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should set errorMessage if upload fails', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component['selectedFile'] = mockFile;

      mockApiClient.uploadImage.mockReturnValue(throwError(() => new Error('Upload failed')));

      component.onSubmitClick();

      expect(component.isSubmitting).toBe(false);
      expect(component.errorMessage).toBe('Upload failed');
      expect(mockApiClient.createPost).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });
});
