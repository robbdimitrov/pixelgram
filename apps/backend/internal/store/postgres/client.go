package postgres

import (
	"context"
	"time"

	"pixelgram/backend/internal/comments"
	"pixelgram/backend/internal/database"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/pagination"
	"pixelgram/backend/internal/posts"
	"pixelgram/backend/internal/sessions"
	"pixelgram/backend/internal/users"
)

// Client owns the shared database lifecycle and implements session
// authentication. Repository constructors retain only the underlying DB.
type Client struct {
	db *database.DB
}

func New(ctx context.Context, databaseURL, sessionSecret string) (*Client, error) {
	db, err := database.Open(ctx, databaseURL, sessionSecret)
	if err != nil {
		return nil, err
	}
	return NewWithDB(db), nil
}

func NewWithDB(db *database.DB) *Client {
	return &Client{db: db}
}

func (c *Client) Close() {
	c.db.Close()
}

func (c *Client) RefreshSession(ctx context.Context, sessionID string) (httpx.Session, error) {
	return NewSessionRepository(c).RefreshSession(ctx, sessionID)
}

// The forwarding methods below preserve the package's integration-test API.
// Application code uses the focused repositories directly.
func (c *Client) CreateUser(ctx context.Context, name, username, email, passwordHash string) (int, error) {
	return NewUserRepository(c).CreateUser(ctx, name, username, email, passwordHash)
}

func (c *Client) GetUserWithEmail(ctx context.Context, email string) (sessions.UserCredentials, bool, error) {
	credentials, err := NewSessionRepository(c).FindLoginCredentialsByEmail(ctx, email)
	if err != nil || credentials == nil {
		return sessions.UserCredentials{}, false, err
	}
	return *credentials, true, nil
}

func (c *Client) GetUserWithID(ctx context.Context, userID string) (users.UserCredentials, bool, error) {
	return NewUserRepository(c).GetUserWithID(ctx, userID)
}

func (c *Client) GetUserByUsername(ctx context.Context, username, currentUserID string) (users.User, bool, error) {
	return NewUserRepository(c).GetUserByUsername(ctx, username, currentUserID)
}

func (c *Client) GetUserByID(ctx context.Context, userID, currentUserID string) (users.User, bool, error) {
	return NewUserRepository(c).GetUserByID(ctx, userID, currentUserID)
}

func (c *Client) FollowUser(ctx context.Context, followerID, followeeID string) error {
	return NewUserRepository(c).FollowUser(ctx, followerID, followeeID)
}

func (c *Client) UnfollowUser(ctx context.Context, followerID, followeeID string) error {
	return NewUserRepository(c).UnfollowUser(ctx, followerID, followeeID)
}

func (c *Client) UpdateUser(ctx context.Context, userID, name, username, email, avatar string, bio *string) (users.UpdateUserResult, error) {
	return NewUserRepository(c).UpdateUser(ctx, userID, name, username, email, avatar, bio)
}

func (c *Client) ChangePassword(ctx context.Context, userID, passwordHash, currentSessionID string) error {
	return NewUserRepository(c).ChangePassword(ctx, userID, passwordHash, currentSessionID)
}

func (c *Client) CreateUpload(ctx context.Context, userID, filename string) (bool, error) {
	return NewUploadRepository(c).CreateUpload(ctx, userID, filename)
}

func (c *Client) DeleteExpiredUploads(ctx context.Context) ([]string, error) {
	return NewUploadRepository(c).DeleteExpiredUploads(ctx)
}

func (c *Client) CreatePost(ctx context.Context, userID, filename string, description *string) (string, bool, error) {
	return NewPostRepository(c).CreatePost(ctx, userID, filename, description)
}

func (c *Client) GetFeed(ctx context.Context, cursor *pagination.Cursor, limit int, currentUserID string) ([]posts.Post, *pagination.Cursor, error) {
	return NewPostRepository(c).GetFeed(ctx, cursor, limit, currentUserID)
}

func (c *Client) GetPosts(ctx context.Context, username string, cursor *pagination.Cursor, limit int, currentUserID string) ([]posts.Post, *pagination.Cursor, error) {
	return NewPostRepository(c).GetPosts(ctx, username, cursor, limit, currentUserID)
}

func (c *Client) GetLikedPosts(ctx context.Context, username string, cursor *pagination.Cursor, limit int, currentUserID string) ([]posts.Post, *pagination.Cursor, error) {
	return NewPostRepository(c).GetLikedPosts(ctx, username, cursor, limit, currentUserID)
}

func (c *Client) GetPost(ctx context.Context, postID, currentUserID string) (posts.Post, bool, error) {
	return NewPostRepository(c).GetPost(ctx, postID, currentUserID)
}

func (c *Client) DeletePost(ctx context.Context, postID, userID string) (string, bool, error) {
	return NewPostRepository(c).DeletePost(ctx, postID, userID)
}

func (c *Client) PostExists(ctx context.Context, postID string) (bool, error) {
	return NewPostRepository(c).PostExists(ctx, postID)
}

func (c *Client) LikePost(ctx context.Context, postID, userID string) error {
	return NewPostRepository(c).LikePost(ctx, postID, userID)
}

func (c *Client) UnlikePost(ctx context.Context, postID, userID string) error {
	return NewPostRepository(c).UnlikePost(ctx, postID, userID)
}

func (c *Client) CreateComment(ctx context.Context, postID, userID, body string) (comments.Comment, error) {
	return NewCommentRepository(c).CreateComment(ctx, postID, userID, body)
}

func (c *Client) ListComments(ctx context.Context, postID string, cursor *pagination.Cursor, limit int) ([]comments.Comment, *pagination.Cursor, error) {
	return NewCommentRepository(c).ListComments(ctx, postID, cursor, limit)
}

func (c *Client) DeleteComment(ctx context.Context, postID, commentID, userID string) (bool, error) {
	return NewCommentRepository(c).DeleteComment(ctx, postID, commentID, userID)
}

func (c *Client) CreateSession(ctx context.Context, sessionID string, userID int, expiresAt time.Time) (sessions.CreatedSession, error) {
	return NewSessionRepository(c).CreateSession(ctx, sessionID, userID, expiresAt)
}

func (c *Client) DeleteExpiredSessions(ctx context.Context) error {
	return NewSessionRepository(c).DeleteExpiredSessions(ctx)
}

func (c *Client) DeleteSession(ctx context.Context, sessionID string) error {
	return NewSessionRepository(c).DeleteSession(ctx, sessionID)
}

func (c *Client) DeleteExpiredLoginFailures(ctx context.Context) error {
	return NewSessionRepository(c).DeleteExpiredLoginFailures(ctx)
}

func (c *Client) GetLoginFailures(ctx context.Context, keys []string) ([]sessions.LoginFailure, error) {
	return NewSessionRepository(c).GetLoginFailures(ctx, keys)
}

func (c *Client) RecordLoginFailure(ctx context.Context, key string, resetAt time.Time) error {
	return NewSessionRepository(c).RecordLoginFailure(ctx, key, resetAt)
}

func (c *Client) ClearLoginFailures(ctx context.Context, keys []string) error {
	return NewSessionRepository(c).ClearLoginFailures(ctx, keys)
}
