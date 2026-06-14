import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {of, Subject} from 'rxjs';

import {EditProfileComponent} from './edit-profile.component';
import {APIClient} from '../../../services/api-client.service';
import {SessionService} from '../../../services/session.service';
import {ImageFilenameDto} from '../../../models/post.model';

describe('EditProfileComponent', () => {
  it('should block duplicate submissions and reset after an upload error', () => {
    const upload = new Subject<ImageFilenameDto>();
    const apiClient = {
      getUser: jest.fn().mockReturnValue(of({
        id: 1,
        name: 'Test User',
        username: 'test',
        email: 'test@example.com'
      })),
      uploadImage: jest.fn().mockReturnValue(upload),
      updateUser: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: APIClient, useValue: apiClient},
        {provide: SessionService, useValue: {userId: () => 1}}
      ]
    });
    const component = TestBed.createComponent(EditProfileComponent).componentInstance;
    component.ngOnInit();
    component.selectedFile.set(new File(['image'], 'avatar.jpg', {type: 'image/jpeg'}));

    component.onSubmit();
    component.onSubmit();

    expect(component.isSubmitting()).toBe(true);
    expect(apiClient.uploadImage).toHaveBeenCalledTimes(1);

    upload.error(new Error('Upload failed'));

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('Upload failed');
    expect(apiClient.updateUser).not.toHaveBeenCalled();
  });
});
