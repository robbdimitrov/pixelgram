package feed

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"pixelgram/backend/internal/pagination"
	"pixelgram/backend/internal/posts"
)

// fakeRepo is a typed fake implementing Repository for unit tests.
type fakeRepo struct {
	insertedEntries       [][]Entry
	insertErr             error
	followers             []int64
	followersErr          error
	recentEntries         []Entry
	recentEntriesErr      error
	followerCount         int64
	followerCountErr      error
	pruneFollowerID       int64
	pruneFolloweeID       int64
	pruneErr              error
	getFollowersCalled    bool
	getRecentCalled       bool
	getFollowerCountCalls []int64
}

func (r *fakeRepo) ListFeed(_ context.Context, _ string, _ *pagination.Cursor, _ int) ([]posts.Post, *pagination.Cursor, error) {
	return nil, nil, nil
}

func (r *fakeRepo) InsertEntries(_ context.Context, entries []Entry) error {
	r.insertedEntries = append(r.insertedEntries, entries)
	return r.insertErr
}

func (r *fakeRepo) PruneByFollowee(_ context.Context, followerID, followeeID int64) error {
	r.pruneFollowerID = followerID
	r.pruneFolloweeID = followeeID
	return r.pruneErr
}

func (r *fakeRepo) GetFollowers(_ context.Context, _ int64) ([]int64, error) {
	r.getFollowersCalled = true
	return r.followers, r.followersErr
}

func (r *fakeRepo) GetRecentPostEntries(_ context.Context, _ int64, _ int) ([]Entry, error) {
	r.getRecentCalled = true
	return r.recentEntries, r.recentEntriesErr
}

func (r *fakeRepo) GetUserFollowerCount(_ context.Context, userID int64) (int64, error) {
	r.getFollowerCountCalls = append(r.getFollowerCountCalls, userID)
	return r.followerCount, r.followerCountErr
}

func newConsumerWithRepo(repo Repository) *Consumer {
	return &Consumer{repo: repo}
}

func entityChangesMsg(authorID int64, postID int64, followerCount int64) []byte {
	payload := entityChangesPayload{
		Table:         "posts",
		Op:            "upsert",
		ID:            postID,
		AuthorID:      fmt.Sprintf("%d", authorID),
		Created:       time.Now().UTC().Format(time.RFC3339Nano),
		FollowerCount: followerCount,
	}
	data, _ := json.Marshal(payload)
	return data
}

func activityMsg(op, actorID, recipientID string) []byte {
	payload := activityPayload{Op: op, ActorID: actorID, RecipientID: recipientID}
	data, _ := json.Marshal(payload)
	return data
}

// handleEntityChanges — celebrity path (FollowerCount > CelebThreshold)

func TestHandleEntityChangesCelebSkipsFanout(t *testing.T) {
	repo := &fakeRepo{followerCount: CelebThreshold + 1}
	c := newConsumerWithRepo(repo)

	c.handleEntityChanges(context.Background(), entityChangesMsg(42, 100, CelebThreshold+1))

	if repo.getFollowersCalled {
		t.Fatal("GetFollowers must not be called for celebrity authors")
	}
	if len(repo.insertedEntries) != 1 {
		t.Fatalf("InsertEntries called %d time(s), want 1", len(repo.insertedEntries))
	}
	batch := repo.insertedEntries[0]
	if len(batch) != 1 {
		t.Fatalf("inserted %d entries, want 1 (author only)", len(batch))
	}
	if batch[0].UserID != 42 || batch[0].PostID != 100 {
		t.Fatalf("entry = %+v, want userID=42 postID=100", batch[0])
	}
}

// handleEntityChanges — normal path (FollowerCount <= CelebThreshold)

func TestHandleEntityChangesNormalFansOut(t *testing.T) {
	repo := &fakeRepo{
		followerCount: CelebThreshold,
		followers:     []int64{10, 11, 12},
	}
	c := newConsumerWithRepo(repo)

	c.handleEntityChanges(context.Background(), entityChangesMsg(42, 100, CelebThreshold))

	if !repo.getFollowersCalled {
		t.Fatal("GetFollowers must be called on the normal path")
	}
	if len(repo.insertedEntries) != 1 {
		t.Fatalf("InsertEntries called %d time(s), want 1", len(repo.insertedEntries))
	}
	// author + 3 followers = 4 entries
	batch := repo.insertedEntries[0]
	if len(batch) != 4 {
		t.Fatalf("inserted %d entries, want 4 (author + followers)", len(batch))
	}
	if batch[0].UserID != 42 {
		t.Fatalf("first entry userID = %d, want 42 (author)", batch[0].UserID)
	}
}

// handleFollow — celebrity recipient skips backfill

func TestHandleFollowCelebSkipsBackfill(t *testing.T) {
	repo := &fakeRepo{followerCount: CelebThreshold + 1}
	c := newConsumerWithRepo(repo)

	c.handleFollow(context.Background(), "1", "999")

	if repo.getRecentCalled {
		t.Fatal("GetRecentPostEntries must not be called when recipient is a celebrity")
	}
	if len(repo.insertedEntries) != 0 {
		t.Fatal("InsertEntries must not be called when recipient is a celebrity")
	}
	if len(repo.getFollowerCountCalls) != 1 || repo.getFollowerCountCalls[0] != 999 {
		t.Fatalf("GetUserFollowerCount calls = %v, want [999]", repo.getFollowerCountCalls)
	}
}

// handleFollow — normal recipient triggers backfill

func TestHandleFollowNormalBackfills(t *testing.T) {
	now := time.Now().UTC()
	repo := &fakeRepo{
		followerCount: CelebThreshold,
		recentEntries: []Entry{
			{UserID: 999, PostID: 201, Created: now},
			{UserID: 999, PostID: 202, Created: now},
		},
	}
	c := newConsumerWithRepo(repo)

	c.handleFollow(context.Background(), "1", "999")

	if !repo.getRecentCalled {
		t.Fatal("GetRecentPostEntries must be called on the normal follow path")
	}
	if len(repo.insertedEntries) != 1 {
		t.Fatalf("InsertEntries called %d time(s), want 1", len(repo.insertedEntries))
	}
	batch := repo.insertedEntries[0]
	if len(batch) != 2 {
		t.Fatalf("inserted %d backfill entries, want 2", len(batch))
	}
	// All entries must be attributed to the actor (follower), not the recipient.
	for _, e := range batch {
		if e.UserID != 1 {
			t.Fatalf("backfill entry userID = %d, want 1 (actor)", e.UserID)
		}
	}
}
