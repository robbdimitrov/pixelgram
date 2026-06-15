import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {of, Subject} from 'rxjs';

import {EditProfileComponent} from './edit-profile.component';
import {UserService} from '../../../services/user.service';
import {PostService} from '../../../../posts/services/post.service';
import {SessionService} from '../../../../auth/session.service';
import {ImageFilenameDto} from '../../../../posts/models/post.model';

describe('EditProfileComponent', () => {
  it('should block duplicate submissions and reset after an upload error', () => {
    const upload = new Subject<ImageFilenameDto>();
    const userService = {
      updateUser: vi.fn(),
      getCurrentUser: vi.fn()
    };
    const postService = {
      uploadImage: vi.fn().mockReturnValue(upload)
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: UserService, useValue: userService},
        {provide: PostService, useValue: postService},
        {provide: SessionService, useValue: {
          userId: () => 1,
          currentUser: () => ({
            id: 1,
            name: 'Test User',
            username: 'test',
            email: 'test@example.com',
            avatar: null,
            bio: null
          })
        }}
      ]
    });
    const component = TestBed.createComponent(EditProfileComponent).componentInstance;
    component.ngOnInit();
    component.selectedFile.set(new File(['image'], 'avatar.jpg', {type: 'image/jpeg'}));

    component.onSubmit();
    component.onSubmit();

    expect(component.isSubmitting()).toBe(true);
    expect(postService.uploadImage).toHaveBeenCalledTimes(1);

    upload.error(new Error('Upload failed'));

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('Upload failed');
    expect(userService.updateUser).not.toHaveBeenCalled();
  });
});
