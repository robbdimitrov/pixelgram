package postgres

import (
	"context"

	"pixelgram/backend/internal/database"
	"pixelgram/backend/internal/store"
	"pixelgram/backend/internal/uploads"
)

const maxPendingUploads = 20

type UploadRepository struct {
	db *database.DB
}

func NewUploadRepository(client *Client) *UploadRepository {
	return &UploadRepository{db: client.db}
}

func (r *UploadRepository) CreateUpload(ctx context.Context, userID, filename string) (bool, error) {
	if err := r.db.Allow(); err != nil {
		return false, store.ErrUnavailable
	}
	tag, err := r.db.Pool().Exec(ctx, `INSERT INTO uploads (user_id, filename)
		SELECT $1, $2
		WHERE (SELECT count(*) FROM uploads WHERE user_id = $1) < $3`,
		userID, filename, maxPendingUploads)
	if err != nil {
		r.db.Failure(err)
		return false, err
	}
	r.db.Success()
	return tag.RowsAffected() > 0, nil
}

func (r *UploadRepository) DeleteExpiredUploads(ctx context.Context) ([]string, error) {
	if err := r.db.Allow(); err != nil {
		return nil, store.ErrUnavailable
	}
	rows, err := r.db.Pool().Query(ctx, `DELETE FROM uploads
		WHERE created <= now() - $1::interval RETURNING filename`, "1 hour")
	if err != nil {
		r.db.Failure(err)
		return nil, err
	}
	defer rows.Close()
	filenames := []string{}
	for rows.Next() {
		var filename string
		if err := rows.Scan(&filename); err != nil {
			return nil, err
		}
		filenames = append(filenames, filename)
	}
	if err := rows.Err(); err != nil {
		r.db.Failure(err)
		return nil, err
	}
	r.db.Success()
	return filenames, nil
}

var _ uploads.Repository = (*UploadRepository)(nil)
