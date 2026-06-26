package noop

import (
	"context"
	"time"

	"phasma/backend/internal/comments"
	"phasma/backend/internal/feed"
	"phasma/backend/internal/httpx"
	"phasma/backend/internal/notifications"
	"phasma/backend/internal/pagination"
	"phasma/backend/internal/posts"
	"phasma/backend/internal/search"
	"phasma/backend/internal/sessions"
	"phasma/backend/internal/uploads"
	"phasma/backend/internal/users"
)

type SessionAuth struct{}

func (SessionAuth) RefreshSession(context.Context, string) (httpx.Session, error) {
	return httpx.Session{}, nil
}

type Users struct{}

func (Users) CreateUser(context.Context, string, string, string, string) (int, error) {
	return 0, nil
}
func (Users) GetUserByUsername(context.Context, string, string) (users.User, bool, error) {
	return users.User{}, false, nil
}
func (Users) GetUserByID(context.Context, string, string) (users.User, bool, error) {
	return users.User{}, false, nil
}
func (Users) ListFollowers(context.Context, string, *pagination.Cursor, int, string) ([]users.User, *pagination.Cursor, error) {
	return nil, nil, nil
}
func (Users) ListFollowing(context.Context, string, *pagination.Cursor, int, string) ([]users.User, *pagination.Cursor, error) {
	return nil, nil, nil
}
func (Users) GetUserWithID(context.Context, string) (users.UserCredentials, bool, error) {
	return users.UserCredentials{}, false, nil
}
func (Users) UpdateUser(context.Context, string, string, string, string, string, *string) (users.UpdateUserResult, error) {
	return users.UpdateUserResult{}, nil
}
func (Users) ChangePassword(context.Context, string, string, string) error          { return nil }
func (Users) FollowUser(context.Context, string, string) error                      { return nil }
func (Users) UnfollowUser(context.Context, string, string) error                    { return nil }
func (Users) ListSuggestedUsers(context.Context, string, int) ([]users.User, error) { return nil, nil }

type Sessions struct{}

func (Sessions) DeleteExpiredSessions(context.Context) error { return nil }
func (Sessions) FindLoginCredentialsByEmail(context.Context, string) (*sessions.UserCredentials, error) {
	return nil, nil
}
func (Sessions) CreateSession(context.Context, string, int, time.Time) (sessions.CreatedSession, error) {
	return sessions.CreatedSession{}, nil
}
func (Sessions) DeleteSession(context.Context, string) error { return nil }
func (Sessions) ListActiveSessions(context.Context, string, string) ([]sessions.Session, error) {
	return []sessions.Session{}, nil
}
func (Sessions) DeleteSessionByID(context.Context, string, string, string) (sessions.DeleteSessionOutcome, error) {
	return sessions.DeleteSessionNotFound, nil
}
func (Sessions) UpdatePasswordHash(context.Context, int, string) error { return nil }

type Uploads struct{}

func (Uploads) CreateUpload(context.Context, string, string) (bool, []string, error) {
	return false, nil, nil
}

type Posts struct{}

func (Posts) CreatePost(context.Context, string, string, *string, []string) (string, bool, error) {
	return "", false, nil
}
func (Posts) GetPosts(context.Context, string, *pagination.Cursor, int, string) ([]posts.Post, *pagination.Cursor, error) {
	return nil, nil, nil
}
func (Posts) GetLikedPosts(context.Context, string, *pagination.Cursor, int, string) ([]posts.Post, *pagination.Cursor, error) {
	return nil, nil, nil
}
func (Posts) GetPost(context.Context, string, string) (posts.Post, bool, error) {
	return posts.Post{}, false, nil
}
func (Posts) DeletePost(context.Context, string, string) (string, error) {
	return "", nil
}
func (Posts) PostExists(context.Context, string) (bool, error)                    { return false, nil }
func (Posts) LikePost(context.Context, string, string) error                      { return nil }
func (Posts) UnlikePost(context.Context, string, string) error                    { return nil }
func (Posts) ListPopularPosts(context.Context, string, int) ([]posts.Post, error) { return nil, nil }

type Comments struct{}

func (Comments) PostExists(context.Context, string) (bool, error) { return false, nil }
func (Comments) CreateComment(context.Context, string, string, string) (comments.Comment, error) {
	return comments.Comment{}, nil
}
func (Comments) ListComments(context.Context, string, *pagination.Cursor, int) ([]comments.Comment, *pagination.Cursor, error) {
	return nil, nil, nil
}
func (Comments) DeleteComment(context.Context, string, string, string) (bool, error) {
	return false, nil
}

type Search struct{}

func (Search) SearchUsers(context.Context, string) ([]search.UserResult, error) {
	return []search.UserResult{}, nil
}
func (Search) SearchHashtags(context.Context, string) ([]search.HashtagResult, error) {
	return []search.HashtagResult{}, nil
}

type Feed struct{}

func (Feed) ListFeed(context.Context, string, *pagination.Cursor, int) ([]posts.Post, *pagination.Cursor, error) {
	return []posts.Post{}, nil, nil
}
func (Feed) InsertEntries(context.Context, []feed.Entry) error                      { return nil }
func (Feed) PruneByFollowee(context.Context, int64, int64) error                    { return nil }
func (Feed) GetFollowers(context.Context, int64) ([]int64, error)                   { return nil, nil }
func (Feed) GetRecentPostEntries(context.Context, int64, int) ([]feed.Entry, error) { return nil, nil }
func (Feed) GetUserFollowerCount(context.Context, int64) (int64, error)             { return 0, nil }

type Notifications struct{}

func (Notifications) ListNotifications(context.Context, int64, *pagination.Cursor, int) ([]notifications.Notification, error) {
	return nil, nil
}
func (Notifications) MarkRead(context.Context, int64, int64) error         { return nil }
func (Notifications) UnreadCount(context.Context, int64) (int, error)      { return 0, nil }
func (Notifications) DeleteByEntity(context.Context, string, string) error { return nil }
func (Notifications) DeleteByActorAndType(context.Context, int64, int64, string, string) error {
	return nil
}
func (Notifications) CreateNotification(context.Context, notifications.Notification) error {
	return nil
}

var (
	_ httpx.SessionStore       = SessionAuth{}
	_ users.Repository         = Users{}
	_ sessions.Repository      = Sessions{}
	_ uploads.Repository       = Uploads{}
	_ posts.Repository         = Posts{}
	_ comments.Repository      = Comments{}
	_ search.Repository        = Search{}
	_ feed.Repository          = Feed{}
	_ notifications.Repository = Notifications{}
)
