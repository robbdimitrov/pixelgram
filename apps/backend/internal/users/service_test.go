package users

import (
	"bytes"
	"context"
	"errors"
	"strings"
	"testing"

	"phasma/backend/internal/auth"
	"phasma/backend/internal/blobstore"
	"phasma/backend/internal/pagination"
	"phasma/backend/internal/store"
)

type fakeRepository struct {
	createID              int
	createErr             error
	createdPasswordHash   string
	user                  User
	users                 []User
	nextCursor            *pagination.Cursor
	listQuery             ListQuery
	found                 bool
	err                   error
	credentials           UserCredentials
	updateResult          UpdateUserResult
	updateCommand         UpdateProfileCommand
	updatedPasswordHash   string
	deleteSessionsUserID  string
	deleteSessionsCurrent string
	followFollowerID      string
	followFolloweeID      string
	unfollowFollowerID    string
	unfollowFolloweeID    string
}

func (r *fakeRepository) CreateUser(_ context.Context, _, _, _, passwordHash string) (int, error) {
	r.createdPasswordHash = passwordHash
	return r.createID, r.createErr
}

func (r *fakeRepository) GetUserByUsername(_ context.Context, _, _ string) (User, bool, error) {
	return r.user, r.found, r.err
}

func (r *fakeRepository) GetUserByID(_ context.Context, _, _ string) (User, bool, error) {
	return r.user, r.found, r.err
}

func (r *fakeRepository) ListFollowers(_ context.Context, username string, cursor *pagination.Cursor, limit int, currentUserID string) ([]User, *pagination.Cursor, error) {
	r.listQuery = ListQuery{Username: username, CurrentUserID: currentUserID, Cursor: cursor, Limit: limit}
	return r.users, r.nextCursor, r.err
}

func (r *fakeRepository) ListFollowing(_ context.Context, username string, cursor *pagination.Cursor, limit int, currentUserID string) ([]User, *pagination.Cursor, error) {
	r.listQuery = ListQuery{Username: username, CurrentUserID: currentUserID, Cursor: cursor, Limit: limit}
	return r.users, r.nextCursor, r.err
}

func (r *fakeRepository) GetUserWithID(_ context.Context, _ string) (UserCredentials, bool, error) {
	return r.credentials, r.found, r.err
}

func (r *fakeRepository) UpdateUser(
	_ context.Context,
	userID, name, username, email, avatar string,
	bio *string,
) (UpdateUserResult, error) {
	r.updateCommand = UpdateProfileCommand{
		UserID: userID, Name: name, Username: username, Email: email, Avatar: avatar, Bio: bio,
	}
	return r.updateResult, r.err
}

func (r *fakeRepository) ChangePassword(_ context.Context, userID, passwordHash, currentSessionID string) error {
	r.updatedPasswordHash = passwordHash
	r.deleteSessionsUserID = userID
	r.deleteSessionsCurrent = currentSessionID
	return r.err
}

func (r *fakeRepository) FollowUser(_ context.Context, followerID, followeeID string) error {
	r.followFollowerID = followerID
	r.followFolloweeID = followeeID
	return r.err
}

func (r *fakeRepository) UnfollowUser(_ context.Context, followerID, followeeID string) error {
	r.unfollowFollowerID = followerID
	r.unfollowFolloweeID = followeeID
	return r.err
}

func (r *fakeRepository) ListSuggestedUsers(_ context.Context, _ string, _ int) ([]User, error) {
	return r.users, r.err
}

var _ Repository = (*fakeRepository)(nil)

func TestServiceCreateUserHashesPassword(t *testing.T) {
	repository := &fakeRepository{createID: 42}
	service := NewService(repository, blobstore.NewMemoryStore())

	id, err := service.CreateUser(context.Background(), CreateUserCommand{
		Name: "Test", Username: "test", Email: "test@example.com", Password: "password123",
	})

	if err != nil || id != 42 {
		t.Fatalf("CreateUser() = %d, %v", id, err)
	}
	if !strings.HasPrefix(repository.createdPasswordHash, "$argon2id$") {
		t.Fatalf("password hash = %q", repository.createdPasswordHash)
	}
	valid, err := auth.VerifyPassword(context.Background(), "password123", repository.createdPasswordHash)
	if err != nil || !valid {
		t.Fatalf("VerifyPassword() = %v, %v", valid, err)
	}
}

func TestServiceUpdateProfileOutcomes(t *testing.T) {
	t.Run("invalid avatar", func(t *testing.T) {
		service := NewService(&fakeRepository{updateResult: UpdateUserResult{}}, blobstore.NewMemoryStore())

		outcome, err := service.UpdateProfile(context.Background(), UpdateProfileCommand{UserID: "1"})

		if err != nil || outcome != UpdateProfileInvalidAvatar {
			t.Fatalf("UpdateProfile() = %v, %v", outcome, err)
		}
	})

	t.Run("removes unused avatar", func(t *testing.T) {
		store := blobstore.NewMemoryStore()
		avatarKey := "aabbccddeeff00112233445566778899"
		_ = store.Put(context.Background(), avatarKey, "image/jpeg", bytes.NewReader([]byte{0xff}), 1)
		repository := &fakeRepository{updateResult: UpdateUserResult{Updated: true, UnusedAvatar: avatarKey}}
		service := NewService(repository, store)

		outcome, err := service.UpdateProfile(context.Background(), UpdateProfileCommand{UserID: "1"})

		if err != nil || outcome != UpdateProfileUpdated {
			t.Fatalf("UpdateProfile() = %v, %v", outcome, err)
		}
		_, _, _, err = store.Get(context.Background(), avatarKey)
		if !errors.Is(err, blobstore.ErrNotFound) {
			t.Fatal("unused avatar should have been deleted from the blob store")
		}
	})
}

func TestServiceChangePassword(t *testing.T) {
	oldHash, err := auth.HashPassword(context.Background(), "old-password", auth.DefaultPasswordParams)
	if err != nil {
		t.Fatal(err)
	}
	repository := &fakeRepository{
		found:       true,
		credentials: UserCredentials{ID: 1, PasswordHash: oldHash},
	}
	service := NewService(repository, blobstore.NewMemoryStore())

	outcome, err := service.ChangePassword(context.Background(), ChangePasswordCommand{
		UserID: "1", CurrentPassword: "old-password", NewPassword: "new-password",
		CurrentSessionID: "current-session",
	})

	if err != nil || outcome != ChangePasswordChanged {
		t.Fatalf("ChangePassword() = %v, %v", outcome, err)
	}
	valid, err := auth.VerifyPassword(context.Background(), "new-password", repository.updatedPasswordHash)
	if err != nil || !valid {
		t.Fatalf("new password hash is invalid: %v, %v", valid, err)
	}
	if repository.deleteSessionsUserID != "1" || repository.deleteSessionsCurrent != "current-session" {
		t.Fatalf("deleted sessions with %q, %q", repository.deleteSessionsUserID, repository.deleteSessionsCurrent)
	}
}

func TestServiceChangePasswordStopsForInvalidCredentials(t *testing.T) {
	oldHash, err := auth.HashPassword(context.Background(), "old-password", auth.DefaultPasswordParams)
	if err != nil {
		t.Fatal(err)
	}
	tests := []struct {
		name       string
		repository *fakeRepository
		outcome    ChangePasswordOutcome
	}{
		{"missing user", &fakeRepository{}, ChangePasswordUserNotFound},
		{
			"wrong password",
			&fakeRepository{found: true, credentials: UserCredentials{PasswordHash: oldHash}},
			ChangePasswordWrongPassword,
		},
		{
			"invalid hash",
			&fakeRepository{found: true, credentials: UserCredentials{PasswordHash: "invalid"}},
			ChangePasswordWrongPassword,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			outcome, err := NewService(test.repository, blobstore.NewMemoryStore()).ChangePassword(
				context.Background(),
				ChangePasswordCommand{
					UserID: "1", CurrentPassword: "wrong-password", NewPassword: "new-password",
				},
			)

			if err != nil || outcome != test.outcome {
				t.Fatalf("ChangePassword() = %v, %v", outcome, err)
			}
			if test.repository.updatedPasswordHash != "" {
				t.Fatal("password was updated")
			}
		})
	}
}

func TestServiceFollowLooksUpTargetByUsername(t *testing.T) {
	repository := &fakeRepository{found: true, user: User{ID: 2}}
	service := NewService(repository, blobstore.NewMemoryStore())
	command := FollowCommand{FollowerID: "1", FolloweeUsername: "alice"}

	if err := service.FollowUser(context.Background(), command); err != nil {
		t.Fatal(err)
	}
	if err := service.UnfollowUser(context.Background(), command); err != nil {
		t.Fatal(err)
	}
	if repository.followFollowerID != "1" || repository.followFolloweeID != "2" {
		t.Fatalf("follow IDs = %q, %q", repository.followFollowerID, repository.followFolloweeID)
	}
	if repository.unfollowFollowerID != "1" || repository.unfollowFolloweeID != "2" {
		t.Fatalf("unfollow IDs = %q, %q", repository.unfollowFollowerID, repository.unfollowFolloweeID)
	}
}

func TestServiceFollowRejectsSelf(t *testing.T) {
	repository := &fakeRepository{found: true, user: User{ID: 1}}
	service := NewService(repository, blobstore.NewMemoryStore())

	err := service.FollowUser(context.Background(), FollowCommand{FollowerID: "1", FolloweeUsername: "self"})

	if !errors.Is(err, ErrSelfFollow) {
		t.Fatalf("FollowUser(self) = %v, want ErrSelfFollow", err)
	}
}

func TestServiceFollowReturnsNotFoundWhenUserMissing(t *testing.T) {
	repository := &fakeRepository{found: false}
	service := NewService(repository, blobstore.NewMemoryStore())

	err := service.FollowUser(context.Background(), FollowCommand{FollowerID: "1", FolloweeUsername: "missing"})

	if !errors.Is(err, store.ErrNotFound) {
		t.Fatalf("FollowUser(missing) = %v, want ErrNotFound", err)
	}
}

func TestServiceListFollowers(t *testing.T) {
	cursor := &pagination.Cursor{ID: 7}
	repository := &fakeRepository{users: []User{{ID: 2}}, nextCursor: cursor}
	service := NewService(repository, blobstore.NewMemoryStore())

	items, next, err := service.ListFollowers(context.Background(), ListQuery{
		Username: "test", CurrentUserID: "1", Cursor: cursor, Limit: 20,
	})

	if err != nil || len(items) != 1 || next != cursor {
		t.Fatalf("ListFollowers() = %#v, %#v, %v", items, next, err)
	}
	if repository.listQuery.Username != "test" || repository.listQuery.CurrentUserID != "1" || repository.listQuery.Limit != 20 {
		t.Fatalf("query = %#v", repository.listQuery)
	}
}
