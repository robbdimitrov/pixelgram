package postgres

import (
	"context"
	"errors"
	"fmt"
	"os"
	"reflect"
	"strconv"
	"strings"
	"testing"
	"time"

	"pixelgram/backend/internal/auth"
	"pixelgram/backend/internal/comments"
	"pixelgram/backend/internal/pagination"
	"pixelgram/backend/internal/posts"
	"pixelgram/backend/internal/store"
)

const testSessionSecret = "integration-secret"

type testPost struct {
	ID       int
	PublicID string
}

func openTestClient(t *testing.T) *Client {
	t.Helper()
	if testing.Short() {
		t.Skip("PostgreSQL integration test")
	}
	databaseURL := os.Getenv("PIXELGRAM_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("PIXELGRAM_TEST_DATABASE_URL is not set")
	}
	client, err := New(context.Background(), databaseURL, testSessionSecret)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	t.Cleanup(client.Close)
	_, err = client.db.Pool().Exec(context.Background(),
		`TRUNCATE comments, likes, follows, posts, uploads, sessions,
		 login_failures, users RESTART IDENTITY CASCADE`)
	if err != nil {
		t.Fatalf("truncate error = %v", err)
	}
	return client
}

func createTestUser(t *testing.T, client *Client, suffix string) int {
	t.Helper()
	id, err := client.CreateUser(
		context.Background(),
		"User "+suffix,
		"user_"+suffix,
		suffix+"@example.com",
		"password-hash",
	)
	if err != nil {
		t.Fatalf("CreateUser(%q) error = %v", suffix, err)
	}
	return id
}

func insertTestPost(t *testing.T, client *Client, userID int, filename string, created time.Time) testPost {
	t.Helper()
	var post testPost
	err := client.db.Pool().QueryRow(
		context.Background(),
		`INSERT INTO posts (user_id, filename, created)
		VALUES ($1, $2, $3) RETURNING id, public_id`,
		userID, filename, created,
	).Scan(&post.ID, &post.PublicID)
	if err != nil {
		t.Fatalf("insert post %q error = %v", filename, err)
	}
	return post
}

func postIDs(items []posts.Post) []int {
	ids := make([]int, len(items))
	for i, item := range items {
		ids[i] = item.ID
	}
	return ids
}

func commentIDs(items []comments.Comment) []int {
	ids := make([]int, len(items))
	for i, item := range items {
		ids[i] = item.ID
	}
	return ids
}

func assertIDs(t *testing.T, got, want []int) {
	t.Helper()
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("IDs = %v, want %v", got, want)
	}
}

func assertNoDuplicateIDs(t *testing.T, ids []int) {
	t.Helper()
	seen := make(map[int]struct{}, len(ids))
	for _, id := range ids {
		if _, exists := seen[id]; exists {
			t.Fatalf("duplicate ID %d in %v", id, ids)
		}
		seen[id] = struct{}{}
	}
}

func stringID(id int) string {
	return strconv.Itoa(id)
}

func TestPostgresRepositoryRejectsDuplicateUsernameAndEmail(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	createTestUser(t, client, "unique")

	if _, err := client.CreateUser(ctx, "Duplicate", "user_unique", "other@example.com", "hash"); !errors.Is(err, store.ErrConflict) {
		t.Fatalf("duplicate username error = %v, want conflict", err)
	}
	if _, err := client.CreateUser(ctx, "Duplicate", "other_user", "unique@example.com", "hash"); !errors.Is(err, store.ErrConflict) {
		t.Fatalf("duplicate email error = %v, want conflict", err)
	}
}

func TestPostgresRepositoryFeedSelectionAndStableOrdering(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	viewerID := createTestUser(t, client, "viewer")
	followedID := createTestUser(t, client, "followed")
	otherID := createTestUser(t, client, "other")
	created := time.Date(2026, 6, 15, 10, 0, 0, 0, time.UTC)

	viewerPost := insertTestPost(t, client, viewerID, "viewer", created)
	followedFirst := insertTestPost(t, client, followedID, "followed-1", created)
	otherPost := insertTestPost(t, client, otherID, "other", created)
	followedSecond := insertTestPost(t, client, followedID, "followed-2", created)

	withoutFollows, cursor, err := client.GetFeed(ctx, nil, 10, stringID(viewerID))
	if err != nil {
		t.Fatalf("GetFeed(no follows) error = %v", err)
	}
	if cursor != nil {
		t.Fatalf("GetFeed(no follows) cursor = %+v, want nil", cursor)
	}
	assertIDs(t, postIDs(withoutFollows), []int{followedSecond.ID, otherPost.ID, followedFirst.ID})

	if err := client.FollowUser(ctx, stringID(viewerID), stringID(followedID)); err != nil {
		t.Fatalf("FollowUser() error = %v", err)
	}
	withFollows, cursor, err := client.GetFeed(ctx, nil, 10, stringID(viewerID))
	if err != nil {
		t.Fatalf("GetFeed(with follows) error = %v", err)
	}
	if cursor != nil {
		t.Fatalf("GetFeed(with follows) cursor = %+v, want nil", cursor)
	}
	assertIDs(t, postIDs(withFollows), []int{followedSecond.ID, followedFirst.ID, viewerPost.ID})
}

func TestPostgresRepositoryFeedCursorPaginationAndBoundaries(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	viewerID := createTestUser(t, client, "feed_viewer")
	authorID := createTestUser(t, client, "feed_author")
	base := time.Date(2026, 6, 15, 10, 0, 0, 0, time.UTC)

	var want []int
	for i := 0; i < 5; i++ {
		post := insertTestPost(t, client, authorID, fmt.Sprintf("feed-%d", i), base.Add(time.Duration(i)*time.Minute))
		want = append([]int{post.ID}, want...)
	}

	var got []int
	var cursor *pagination.Cursor
	for {
		items, next, err := client.GetFeed(ctx, cursor, 2, stringID(viewerID))
		if err != nil {
			t.Fatalf("GetFeed(cursor %+v) error = %v", cursor, err)
		}
		got = append(got, postIDs(items)...)
		if next == nil {
			break
		}
		cursor = next
	}
	assertIDs(t, got, want)
	assertNoDuplicateIDs(t, got)

	future := &pagination.Cursor{Created: base.Add(time.Hour), ID: 999999}
	items, _, err := client.GetFeed(ctx, future, 10, stringID(viewerID))
	if err != nil {
		t.Fatalf("GetFeed(future cursor) error = %v", err)
	}
	assertIDs(t, postIDs(items), want)

	past := &pagination.Cursor{Created: base.Add(-time.Hour), ID: 1}
	items, terminal, err := client.GetFeed(ctx, past, 10, stringID(viewerID))
	if err != nil {
		t.Fatalf("GetFeed(past cursor) error = %v", err)
	}
	if len(items) != 0 || terminal != nil {
		t.Fatalf("GetFeed(past cursor) = %v, %+v; want empty terminal page", postIDs(items), terminal)
	}
}

func TestPostgresRepositoryProfilePostCursorPagination(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	authorID := createTestUser(t, client, "profile_author")
	viewerID := createTestUser(t, client, "profile_viewer")
	base := time.Date(2026, 6, 15, 11, 0, 0, 0, time.UTC)

	var want []int
	for i := 0; i < 5; i++ {
		post := insertTestPost(t, client, authorID, fmt.Sprintf("profile-%d", i), base.Add(time.Duration(i)*time.Minute))
		want = append([]int{post.ID}, want...)
	}

	var got []int
	var cursor *pagination.Cursor
	for {
		items, next, err := client.GetPosts(ctx, "user_profile_author", cursor, 2, stringID(viewerID))
		if err != nil {
			t.Fatalf("GetPosts(cursor %+v) error = %v", cursor, err)
		}
		got = append(got, postIDs(items)...)
		if next == nil {
			break
		}
		cursor = next
	}
	assertIDs(t, got, want)
	assertNoDuplicateIDs(t, got)

	if _, _, err := client.GetPosts(ctx, "missing_user", nil, 2, stringID(viewerID)); !errors.Is(err, store.ErrNotFound) {
		t.Fatalf("GetPosts(missing user) error = %v, want not found", err)
	}
}

func TestPostgresRepositoryLikedPostCursorPagination(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	authorID := createTestUser(t, client, "liked_author")
	likerID := createTestUser(t, client, "liker")
	base := time.Date(2026, 6, 15, 12, 0, 0, 0, time.UTC)

	var want []int
	for i := 0; i < 5; i++ {
		post := insertTestPost(t, client, authorID, fmt.Sprintf("liked-%d", i), base)
		if _, err := client.db.Pool().Exec(
			ctx,
			`INSERT INTO likes (post_id, user_id, created) VALUES ($1, $2, $3)`,
			post.ID, likerID, base.Add(time.Duration(i)*time.Minute),
		); err != nil {
			t.Fatalf("insert like error = %v", err)
		}
		want = append([]int{post.ID}, want...)
	}

	var got []int
	var cursor *pagination.Cursor
	for {
		items, next, err := client.GetLikedPosts(ctx, "user_liker", cursor, 2, stringID(likerID))
		if err != nil {
			t.Fatalf("GetLikedPosts(cursor %+v) error = %v", cursor, err)
		}
		got = append(got, postIDs(items)...)
		if next == nil {
			break
		}
		cursor = next
	}
	assertIDs(t, got, want)
	assertNoDuplicateIDs(t, got)

	if _, _, err := client.GetLikedPosts(ctx, "missing_user", nil, 2, stringID(likerID)); !errors.Is(err, store.ErrNotFound) {
		t.Fatalf("GetLikedPosts(missing user) error = %v, want not found", err)
	}
}

func TestPostgresRepositoryCommentCursorPagination(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	ownerID := createTestUser(t, client, "comment_page_owner")
	commenterID := createTestUser(t, client, "comment_page_author")
	post := insertTestPost(t, client, ownerID, "comment-page-post", time.Now())
	created := time.Date(2026, 6, 15, 13, 0, 0, 0, time.UTC)

	var want []int
	for i := 0; i < 5; i++ {
		var id int
		err := client.db.Pool().QueryRow(
			ctx,
			`INSERT INTO comments (post_id, user_id, body, created)
			VALUES ($1, $2, $3, $4) RETURNING id`,
			post.ID, commenterID, fmt.Sprintf("comment-%d", i), created,
		).Scan(&id)
		if err != nil {
			t.Fatalf("insert comment error = %v", err)
		}
		want = append([]int{id}, want...)
	}

	var got []int
	var cursor *pagination.Cursor
	for {
		items, next, err := client.ListComments(ctx, post.PublicID, cursor, 2)
		if err != nil {
			t.Fatalf("ListComments(cursor %+v) error = %v", cursor, err)
		}
		got = append(got, commentIDs(items)...)
		if next == nil {
			break
		}
		cursor = next
	}
	assertIDs(t, got, want)
	assertNoDuplicateIDs(t, got)

	items, terminal, err := client.ListComments(
		ctx,
		post.PublicID,
		&pagination.Cursor{Created: created, ID: want[len(want)-1]},
		2,
	)
	if err != nil {
		t.Fatalf("ListComments(boundary cursor) error = %v", err)
	}
	if len(items) != 0 || terminal != nil {
		t.Fatalf("ListComments(boundary cursor) = %v, %+v; want empty terminal page", commentIDs(items), terminal)
	}
}

func TestPostgresRepositoryConsumesUploadAndRollsBackFailedPost(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	userID := createTestUser(t, client, "upload_owner")

	if created, err := client.CreateUpload(ctx, stringID(userID), "successful-upload"); err != nil || !created {
		t.Fatalf("CreateUpload(successful) = %v, %v", created, err)
	}
	publicID, created, err := client.CreatePost(ctx, stringID(userID), "successful-upload", nil)
	if err != nil || !created || publicID == "" {
		t.Fatalf("CreatePost(successful) = %q, %v, %v", publicID, created, err)
	}

	var uploadExists bool
	if err := client.db.Pool().QueryRow(
		ctx,
		`SELECT EXISTS (SELECT 1 FROM uploads WHERE filename = 'successful-upload')`,
	).Scan(&uploadExists); err != nil {
		t.Fatalf("successful upload query error = %v", err)
	}
	if uploadExists {
		t.Fatal("successful upload was not consumed")
	}

	if created, err := client.CreateUpload(ctx, stringID(userID), "rollback-upload"); err != nil || !created {
		t.Fatalf("CreateUpload(rollback) = %v, %v", created, err)
	}
	tooLong := strings.Repeat("x", 1001)
	if _, _, err := client.CreatePost(ctx, stringID(userID), "rollback-upload", &tooLong); err == nil {
		t.Fatal("CreatePost(invalid description) error = nil, want constraint failure")
	}
	if err := client.db.Pool().QueryRow(
		ctx,
		`SELECT EXISTS (SELECT 1 FROM uploads WHERE filename = 'rollback-upload')`,
	).Scan(&uploadExists); err != nil || !uploadExists {
		t.Fatalf("rollback upload exists = %v, error = %v", uploadExists, err)
	}

	if publicID, created, err := client.CreatePost(ctx, stringID(userID), "missing-upload", nil); err != nil || created || publicID != "" {
		t.Fatalf("CreatePost(missing upload) = %q, %v, %v", publicID, created, err)
	}
}

func TestPostgresRepositoryProfileAvatarOwnershipAndUnusedAvatar(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	userID := createTestUser(t, client, "profile_owner")
	otherID := createTestUser(t, client, "profile_other")

	if created, err := client.CreateUpload(ctx, stringID(otherID), "foreign-avatar"); err != nil || !created {
		t.Fatalf("CreateUpload(foreign) = %v, %v", created, err)
	}
	result, err := client.UpdateUser(
		ctx, stringID(userID), "Owner", "user_profile_owner",
		"profile_owner@example.com", "foreign-avatar", nil,
	)
	if err != nil {
		t.Fatalf("UpdateUser(foreign avatar) error = %v", err)
	}
	if result.Updated {
		t.Fatalf("UpdateUser(foreign avatar) = %+v, want not updated", result)
	}

	for _, avatar := range []string{"first-avatar", "second-avatar"} {
		if created, err := client.CreateUpload(ctx, stringID(userID), avatar); err != nil || !created {
			t.Fatalf("CreateUpload(%q) = %v, %v", avatar, created, err)
		}
	}
	result, err = client.UpdateUser(
		ctx, stringID(userID), "Owner", "user_profile_owner",
		"profile_owner@example.com", "first-avatar", nil,
	)
	if err != nil || !result.Updated || result.UnusedAvatar != "" {
		t.Fatalf("UpdateUser(first avatar) = %+v, %v", result, err)
	}
	result, err = client.UpdateUser(
		ctx, stringID(userID), "Owner", "user_profile_owner",
		"profile_owner@example.com", "second-avatar", nil,
	)
	if err != nil {
		t.Fatalf("UpdateUser(second avatar) error = %v", err)
	}
	if !result.Updated || result.UnusedAvatar != "first-avatar" {
		t.Fatalf("UpdateUser(second avatar) = %+v, want unused first-avatar", result)
	}

	var remaining int
	if err := client.db.Pool().QueryRow(
		ctx,
		`SELECT count(*) FROM uploads WHERE user_id = $1 AND filename IN ('first-avatar', 'second-avatar')`,
		userID,
	).Scan(&remaining); err != nil || remaining != 0 {
		t.Fatalf("owned avatar uploads remaining = %d, error = %v", remaining, err)
	}
}

func TestPostgresRepositoryFollowIsIdempotentAndRejectsMissingTarget(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	followerID := createTestUser(t, client, "follower")
	followeeID := createTestUser(t, client, "followee")

	if err := client.FollowUser(ctx, stringID(followerID), "999999"); !errors.Is(err, store.ErrNotFound) {
		t.Fatalf("FollowUser(missing target) error = %v, want not found", err)
	}
	for i := 0; i < 2; i++ {
		if err := client.FollowUser(ctx, stringID(followerID), stringID(followeeID)); err != nil {
			t.Fatalf("FollowUser(attempt %d) error = %v", i+1, err)
		}
	}
	var count int
	if err := client.db.Pool().QueryRow(
		ctx,
		`SELECT count(*) FROM follows WHERE follower_id = $1 AND followee_id = $2`,
		followerID, followeeID,
	).Scan(&count); err != nil || count != 1 {
		t.Fatalf("follow count = %d, error = %v", count, err)
	}
}

func TestPostgresRepositoryCommentOwnershipAndNotFoundOutcomes(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	postOwnerID := createTestUser(t, client, "comment_post_owner")
	commentOwnerID := createTestUser(t, client, "comment_owner")
	otherID := createTestUser(t, client, "comment_other")
	post := insertTestPost(t, client, postOwnerID, "comment-workflow", time.Now())

	comment, err := client.CreateComment(ctx, post.PublicID, stringID(commentOwnerID), "hello")
	if err != nil {
		t.Fatalf("CreateComment() error = %v", err)
	}
	if comment.UserID != commentOwnerID || comment.Body != "hello" {
		t.Fatalf("CreateComment() = %+v", comment)
	}
	if _, err := client.CreateComment(ctx, "00000000-0000-0000-0000-000000000000", stringID(commentOwnerID), "missing"); !errors.Is(err, store.ErrNotFound) {
		t.Fatalf("CreateComment(missing post) error = %v, want not found", err)
	}

	deleted, err := client.DeleteComment(ctx, post.PublicID, stringID(comment.ID), stringID(otherID))
	if !deleted || !errors.Is(err, store.ErrForbidden) {
		t.Fatalf("DeleteComment(non-owner) = %v, %v; want true, forbidden", deleted, err)
	}
	deleted, err = client.DeleteComment(ctx, post.PublicID, stringID(comment.ID), stringID(commentOwnerID))
	if err != nil || !deleted {
		t.Fatalf("DeleteComment(owner) = %v, %v", deleted, err)
	}
	deleted, err = client.DeleteComment(ctx, post.PublicID, stringID(comment.ID), stringID(commentOwnerID))
	if err != nil || deleted {
		t.Fatalf("DeleteComment(missing) = %v, %v; want false, nil", deleted, err)
	}
	deleted, err = client.DeleteComment(ctx, "00000000-0000-0000-0000-000000000000", "999999", stringID(commentOwnerID))
	if err != nil || deleted {
		t.Fatalf("DeleteComment(missing post) = %v, %v; want false, nil", deleted, err)
	}
}

func TestPostgresRepositorySessionHashExpirationAndConditionalRefresh(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	userID := createTestUser(t, client, "session_user")

	freshToken := "fresh-session-token"
	freshExpiry := time.Now().Add(6 * 24 * time.Hour).Truncate(time.Microsecond)
	if _, err := client.CreateSession(ctx, freshToken, userID, freshExpiry); err != nil {
		t.Fatalf("CreateSession(fresh) error = %v", err)
	}
	hashedFresh := auth.HashSessionToken(freshToken, testSessionSecret)
	var persistedID string
	if err := client.db.Pool().QueryRow(
		ctx, `SELECT id FROM sessions WHERE user_id = $1`, userID,
	).Scan(&persistedID); err != nil {
		t.Fatalf("fresh session query error = %v", err)
	}
	if persistedID != hashedFresh || persistedID == freshToken {
		t.Fatalf("persisted session ID = %q, want hash %q", persistedID, hashedFresh)
	}

	session, err := client.RefreshSession(ctx, freshToken)
	if err != nil || session.UserID != stringID(userID) || session.ID != hashedFresh {
		t.Fatalf("RefreshSession(fresh) = %+v, %v", session, err)
	}
	var unchangedExpiry time.Time
	if err := client.db.Pool().QueryRow(
		ctx, `SELECT expires_at FROM sessions WHERE id = $1`, hashedFresh,
	).Scan(&unchangedExpiry); err != nil {
		t.Fatalf("fresh expiry query error = %v", err)
	}
	if !unchangedExpiry.Equal(freshExpiry) {
		t.Fatalf("fresh expiry = %v, want unchanged %v", unchangedExpiry, freshExpiry)
	}

	staleToken := "stale-session-token"
	staleExpiry := time.Now().Add(24 * time.Hour)
	if _, err := client.CreateSession(ctx, staleToken, userID, staleExpiry); err != nil {
		t.Fatalf("CreateSession(stale) error = %v", err)
	}
	beforeRefresh := time.Now()
	session, err = client.RefreshSession(ctx, staleToken)
	if err != nil || session.UserID != stringID(userID) {
		t.Fatalf("RefreshSession(stale) = %+v, %v", session, err)
	}
	var refreshedExpiry time.Time
	if err := client.db.Pool().QueryRow(
		ctx, `SELECT expires_at FROM sessions WHERE id = $1`,
		auth.HashSessionToken(staleToken, testSessionSecret),
	).Scan(&refreshedExpiry); err != nil {
		t.Fatalf("stale expiry query error = %v", err)
	}
	if !refreshedExpiry.After(beforeRefresh.Add(6 * 24 * time.Hour)) {
		t.Fatalf("stale expiry = %v, want approximately seven days", refreshedExpiry)
	}

	expiredToken := "expired-session-token"
	if _, err := client.CreateSession(ctx, expiredToken, userID, time.Now().Add(-time.Minute)); err != nil {
		t.Fatalf("CreateSession(expired) error = %v", err)
	}
	session, err = client.RefreshSession(ctx, expiredToken)
	if err != nil || session.UserID != "" || session.ID != "" {
		t.Fatalf("RefreshSession(expired) = %+v, %v; want zero session", session, err)
	}
}

func TestPostgresRepositoryChangePasswordRemovesOtherSessions(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	userID := createTestUser(t, client, "password_user")
	currentToken := "current-session-token"
	otherToken := "other-session-token"

	for _, token := range []string{currentToken, otherToken} {
		if _, err := client.CreateSession(ctx, token, userID, time.Now().Add(time.Hour)); err != nil {
			t.Fatalf("CreateSession(%q) error = %v", token, err)
		}
	}
	if err := client.ChangePassword(ctx, stringID(userID), "new-password-hash", currentToken); err != nil {
		t.Fatalf("ChangePassword() error = %v", err)
	}

	var password string
	if err := client.db.Pool().QueryRow(
		ctx, `SELECT password FROM users WHERE id = $1`, userID,
	).Scan(&password); err != nil {
		t.Fatalf("password query error = %v", err)
	}
	if password != "new-password-hash" {
		t.Fatalf("password = %q, want new-password-hash", password)
	}
	var sessionIDs []string
	rows, err := client.db.Pool().Query(ctx, `SELECT id FROM sessions ORDER BY id`)
	if err != nil {
		t.Fatalf("session query error = %v", err)
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			t.Fatalf("session scan error = %v", err)
		}
		sessionIDs = append(sessionIDs, id)
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("session rows error = %v", err)
	}
	want := []string{auth.HashSessionToken(currentToken, testSessionSecret)}
	if !reflect.DeepEqual(sessionIDs, want) {
		t.Fatalf("sessions = %v, want %v", sessionIDs, want)
	}
}

func TestPostgresRepositoryChangePasswordRollsBackWhenSessionRemovalFails(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	userID := createTestUser(t, client, "password_rollback")
	currentToken := "rollback-current-token"
	otherToken := "rollback-other-token"
	for _, token := range []string{currentToken, otherToken} {
		if _, err := client.CreateSession(ctx, token, userID, time.Now().Add(time.Hour)); err != nil {
			t.Fatalf("CreateSession(%q) error = %v", token, err)
		}
	}

	_, err := client.db.Pool().Exec(ctx, `
		CREATE FUNCTION fail_session_delete() RETURNS trigger
		LANGUAGE plpgsql AS $$
		BEGIN
		  RAISE EXCEPTION 'forced session delete failure';
		END;
		$$;
		CREATE TRIGGER fail_session_delete
		BEFORE DELETE ON sessions
		FOR EACH STATEMENT EXECUTE FUNCTION fail_session_delete();
	`)
	if err != nil {
		t.Fatalf("create failure trigger error = %v", err)
	}
	t.Cleanup(func() {
		_, _ = client.db.Pool().Exec(
			context.Background(),
			`DROP TRIGGER IF EXISTS fail_session_delete ON sessions;
			DROP FUNCTION IF EXISTS fail_session_delete();`,
		)
	})

	if err := client.ChangePassword(ctx, stringID(userID), "should-roll-back", currentToken); err == nil {
		t.Fatal("ChangePassword() error = nil, want forced delete failure")
	}
	var password string
	if err := client.db.Pool().QueryRow(
		ctx, `SELECT password FROM users WHERE id = $1`, userID,
	).Scan(&password); err != nil {
		t.Fatalf("password query error = %v", err)
	}
	if password != "password-hash" {
		t.Fatalf("password = %q, want original password-hash", password)
	}
	var sessionCount int
	if err := client.db.Pool().QueryRow(
		ctx, `SELECT count(*) FROM sessions WHERE user_id = $1`, userID,
	).Scan(&sessionCount); err != nil || sessionCount != 2 {
		t.Fatalf("session count = %d, error = %v; want 2", sessionCount, err)
	}
}

func TestPostgresRepositoryDeletePostCascadesLikesCommentsAndClearsAvatar(t *testing.T) {
	client := openTestClient(t)
	ctx := context.Background()
	ownerID := createTestUser(t, client, "delete_owner")
	otherID := createTestUser(t, client, "delete_other")
	post := insertTestPost(t, client, ownerID, "shared-post-file", time.Now())

	if _, err := client.db.Pool().Exec(
		ctx, `UPDATE users SET avatar = 'shared-post-file' WHERE id = $1`, ownerID,
	); err != nil {
		t.Fatalf("set avatar error = %v", err)
	}
	if err := client.LikePost(ctx, post.PublicID, stringID(otherID)); err != nil {
		t.Fatalf("LikePost() error = %v", err)
	}
	if _, err := client.CreateComment(ctx, post.PublicID, stringID(otherID), "delete me"); err != nil {
		t.Fatalf("CreateComment() error = %v", err)
	}

	filename, deleted, err := client.DeletePost(ctx, post.PublicID, stringID(ownerID))
	if err != nil || !deleted || filename != "shared-post-file" {
		t.Fatalf("DeletePost() = %q, %v, %v", filename, deleted, err)
	}
	var posts, likes, comments int
	if err := client.db.Pool().QueryRow(
		ctx,
		`SELECT
		  (SELECT count(*) FROM posts WHERE id = $1),
		  (SELECT count(*) FROM likes WHERE post_id = $1),
		  (SELECT count(*) FROM comments WHERE post_id = $1)`,
		post.ID,
	).Scan(&posts, &likes, &comments); err != nil {
		t.Fatalf("cascade query error = %v", err)
	}
	if posts != 0 || likes != 0 || comments != 0 {
		t.Fatalf("remaining post data = posts %d, likes %d, comments %d", posts, likes, comments)
	}
	var avatar string
	if err := client.db.Pool().QueryRow(
		ctx, `SELECT avatar FROM users WHERE id = $1`, ownerID,
	).Scan(&avatar); err != nil {
		t.Fatalf("avatar query error = %v", err)
	}
	if avatar != "" {
		t.Fatalf("avatar = %q, want cleared", avatar)
	}
}
