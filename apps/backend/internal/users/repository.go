package users

import "context"

type Repository interface {
	CreateUser(ctx context.Context, name, username, email, passwordHash string) (int, error)
	GetUserByUsername(ctx context.Context, username, currentUserID string) (User, bool, error)
	GetUserByID(ctx context.Context, userID, currentUserID string) (User, bool, error)
	GetUserWithID(ctx context.Context, userID string) (UserCredentials, bool, error)
	UpdateUser(ctx context.Context, userID, name, username, email, avatar string, bio *string) (UpdateUserResult, error)
	ChangePassword(ctx context.Context, userID, passwordHash, currentSessionID string) error
	FollowUser(ctx context.Context, followerID, followeeID string) error
	UnfollowUser(ctx context.Context, followerID, followeeID string) error
}
