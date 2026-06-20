package postgres

import (
	"context"

	"pixelgram/backend/internal/database"
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
	var created bool
	err := r.db.Write(ctx, func() error {
		tag, err := r.db.Pool().Exec(ctx, `INSERT INTO uploads (user_id, filename)
			SELECT $1, $2
			WHERE (SELECT count(*) FROM uploads WHERE user_id = $1) < $3`,
			userID, filename, maxPendingUploads)
		if err != nil {
			return err
		}
		created = tag.RowsAffected() > 0
		return nil
	})
	return created, err
}

func (r *UploadRepository) DeleteExpiredUploads(ctx context.Context) ([]string, error) {
	var filenames []string
	err := r.db.Write(ctx, func() error {
		rows, err := r.db.Pool().Query(ctx, `DELETE FROM uploads
			WHERE created <= now() - $1::interval RETURNING filename`, "1 hour")
		if err != nil {
			return err
		}
		defer rows.Close()
		filenames = []string{}
		for rows.Next() {
			var filename string
			if err := rows.Scan(&filename); err != nil {
				return err
			}
			filenames = append(filenames, filename)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, err
	}
	return filenames, nil
}

var _ uploads.Repository = (*UploadRepository)(nil)
