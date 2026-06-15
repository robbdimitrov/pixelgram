import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ProfileHeaderComponent} from './profile-header.component';
import {APIClient} from '../../../services/api-client.service';
import {SessionService} from '../../../services/session.service';
import {User} from '../../../models/user.model';
import {of, throwError} from 'rxjs';
import {provideRouter} from '@angular/router';

describe('ProfileHeaderComponent', () => {
  let fixture: ComponentFixture<ProfileHeaderComponent>;
  let component: ProfileHeaderComponent;
  let apiClientSpy: jest.Mocked<APIClient>;
  let sessionServiceSpy: {userId: jest.Mock};

  beforeEach(async () => {
    apiClientSpy = {
      followUser: jest.fn().mockReturnValue(of(undefined)),
      unfollowUser: jest.fn().mockReturnValue(of(undefined))
    } as any;

    sessionServiceSpy = {
      userId: jest.fn().mockReturnValue(1)
    };

    await TestBed.configureTestingModule({
      imports: [ProfileHeaderComponent],
      providers: [
        provideRouter([]),
        {provide: APIClient, useValue: apiClientSpy},
        {provide: SessionService, useValue: sessionServiceSpy}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should toggle follow and increment followers optimistically', () => {
    const user = new User(2, 'Test User', 'testuser', 'test@test.com', null, null, 0, 0, 10, 5, false, new Date());
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    const followButton = fixture.nativeElement.querySelector('button');
    expect(followButton.textContent).toContain('Follow');

    followButton.click();
    fixture.detectChanges();

    expect(apiClientSpy.followUser).toHaveBeenCalledWith(2);
    expect(user.followers).toBe(11);
    expect(user.isFollowing).toBe(true);
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Unfollow');
  });

  it('should rollback follow if API fails', () => {
    apiClientSpy.followUser.mockReturnValue(throwError(() => new Error('API Error')));

    const user = new User(2, 'Test User', 'testuser', 'test@test.com', null, null, 0, 0, 10, 5, false, new Date());
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    const followButton = fixture.nativeElement.querySelector('button');
    followButton.click();
    fixture.detectChanges();

    expect(apiClientSpy.followUser).toHaveBeenCalledWith(2);
    expect(user.followers).toBe(10);
    expect(user.isFollowing).toBe(false);
  });

  it('should toggle unfollow and decrement followers optimistically', () => {
    const user = new User(2, 'Test User', 'testuser', 'test@test.com', null, null, 0, 0, 10, 5, true, new Date());
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    const followButton = fixture.nativeElement.querySelector('button');
    expect(followButton.textContent).toContain('Unfollow');

    followButton.click();
    fixture.detectChanges();

    expect(apiClientSpy.unfollowUser).toHaveBeenCalledWith(2);
    expect(user.followers).toBe(9);
    expect(user.isFollowing).toBe(false);
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Follow');
  });

  it('should rollback unfollow if API fails', () => {
    apiClientSpy.unfollowUser.mockReturnValue(throwError(() => new Error('API Error')));

    const user = new User(2, 'Test User', 'testuser', 'test@test.com', null, null, 0, 0, 10, 5, true, new Date());
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    const followButton = fixture.nativeElement.querySelector('button');
    followButton.click();
    fixture.detectChanges();

    expect(apiClientSpy.unfollowUser).toHaveBeenCalledWith(2);
    expect(user.followers).toBe(10);
    expect(user.isFollowing).toBe(true);
  });
});
