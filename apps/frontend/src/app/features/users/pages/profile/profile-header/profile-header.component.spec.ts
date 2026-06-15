import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ProfileHeaderComponent} from './profile-header.component';
import {UserService} from '../../../services/user.service';
import {SessionService} from '../../../../auth/session.service';
import {User} from '../../../models/user.model';
import {of, Subject, throwError} from 'rxjs';
import {provideRouter} from '@angular/router';

describe('ProfileHeaderComponent', () => {
  let fixture: ComponentFixture<ProfileHeaderComponent>;
  let component: ProfileHeaderComponent;
  let userServiceSpy: import('vitest').Mocked<UserService>;
  let sessionServiceSpy: {userId: import('vitest').Mock};

  beforeEach(async () => {
    userServiceSpy = {
      followUser: vi.fn().mockReturnValue(of(undefined)),
      unfollowUser: vi.fn().mockReturnValue(of(undefined))
    } as any;

    sessionServiceSpy = {
      userId: vi.fn().mockReturnValue(1)
    };

    await TestBed.configureTestingModule({
      imports: [ProfileHeaderComponent],
      providers: [
        provideRouter([]),
        {provide: UserService, useValue: userServiceSpy},
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

    expect(userServiceSpy.followUser).toHaveBeenCalledWith(2);
    expect(user.followers).toBe(11);
    expect(user.isFollowing).toBe(true);
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Unfollow');
  });

  it('should rollback follow if API fails', () => {
    userServiceSpy.followUser.mockReturnValue(throwError(() => new Error('API Error')));

    const user = new User(2, 'Test User', 'testuser', 'test@test.com', null, null, 0, 0, 10, 5, false, new Date());
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    const followButton = fixture.nativeElement.querySelector('button');
    followButton.click();
    fixture.detectChanges();

    expect(userServiceSpy.followUser).toHaveBeenCalledWith(2);
    expect(user.followers).toBe(10);
    expect(user.isFollowing).toBe(false);
  });

  it('should ignore additional toggles while a follow request is pending', () => {
    const followResponse = new Subject<void>();
    userServiceSpy.followUser.mockReturnValue(followResponse);

    const user = new User(2, 'Test User', 'testuser', 'test@test.com', null, null, 0, 0, 10, 5, false, new Date());
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    const followButton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    followButton.click();
    fixture.detectChanges();

    expect(followButton.disabled).toBe(true);
    component.toggleFollow();

    expect(userServiceSpy.followUser).toHaveBeenCalledTimes(1);
    expect(userServiceSpy.unfollowUser).not.toHaveBeenCalled();
    expect(user.followers).toBe(11);
    expect(user.isFollowing).toBe(true);

    followResponse.complete();
    fixture.detectChanges();

    expect(followButton.disabled).toBe(false);
  });

  it('should toggle unfollow and decrement followers optimistically', () => {
    const user = new User(2, 'Test User', 'testuser', 'test@test.com', null, null, 0, 0, 10, 5, true, new Date());
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    const followButton = fixture.nativeElement.querySelector('button');
    expect(followButton.textContent).toContain('Unfollow');

    followButton.click();
    fixture.detectChanges();

    expect(userServiceSpy.unfollowUser).toHaveBeenCalledWith(2);
    expect(user.followers).toBe(9);
    expect(user.isFollowing).toBe(false);
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Follow');
  });

  it('should rollback unfollow if API fails', () => {
    userServiceSpy.unfollowUser.mockReturnValue(throwError(() => new Error('API Error')));

    const user = new User(2, 'Test User', 'testuser', 'test@test.com', null, null, 0, 0, 10, 5, true, new Date());
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    const followButton = fixture.nativeElement.querySelector('button');
    followButton.click();
    fixture.detectChanges();

    expect(userServiceSpy.unfollowUser).toHaveBeenCalledWith(2);
    expect(user.followers).toBe(10);
    expect(user.isFollowing).toBe(true);
  });
});
