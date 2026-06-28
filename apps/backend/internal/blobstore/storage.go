package blobstore

import (
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

const storageTimeout = 10 * time.Second

type StorageStore struct {
	client *s3.Client
	bucket string
}

func NewStorageStore(ctx context.Context, endpoint, bucket, region, accessKey, secretKey string) (*StorageStore, error) {
	cfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("blobstore: load config: %w", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
	})

	store := &StorageStore{client: client, bucket: bucket}
	if err := store.ensureBucket(ctx); err != nil {
		return nil, fmt.Errorf("blobstore: ensure bucket: %w", err)
	}
	return store, nil
}

func (s *StorageStore) ensureBucket(ctx context.Context) error {
	tctx, cancel := context.WithTimeout(ctx, storageTimeout)
	defer cancel()
	_, err := s.client.HeadBucket(tctx, &s3.HeadBucketInput{Bucket: aws.String(s.bucket)})
	if err == nil {
		return nil
	}
	cctx, ccancel := context.WithTimeout(context.Background(), storageTimeout)
	defer ccancel()
	_, err = s.client.CreateBucket(cctx, &s3.CreateBucketInput{Bucket: aws.String(s.bucket)})
	return err
}

func (s *StorageStore) Put(ctx context.Context, key, contentType string, r io.Reader, size int64) error {
	ctx, cancel := context.WithTimeout(ctx, storageTimeout)
	defer cancel()
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(key),
		Body:          r,
		ContentType:   aws.String(contentType),
		ContentLength: aws.Int64(size),
	})
	return err
}

func (s *StorageStore) Get(ctx context.Context, key string) (io.ReadCloser, string, int64, error) {
	ctx, cancel := context.WithTimeout(ctx, storageTimeout)
	resp, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		cancel()
		var noSuchKey *types.NoSuchKey
		if errors.As(err, &noSuchKey) {
			return nil, "", 0, ErrNotFound
		}
		return nil, "", 0, err
	}
	var size int64
	if resp.ContentLength != nil {
		size = *resp.ContentLength
	}
	ct := ""
	if resp.ContentType != nil {
		ct = *resp.ContentType
	}
	// cancel is called when the body is closed so the 10s timeout covers the
	// full streaming operation, not just the initial response headers.
	return &cancelBody{ReadCloser: resp.Body, cancel: cancel}, ct, size, nil
}

type cancelBody struct {
	io.ReadCloser
	cancel context.CancelFunc
}

func (b *cancelBody) Close() error {
	err := b.ReadCloser.Close()
	b.cancel()
	return err
}

func (s *StorageStore) Delete(ctx context.Context, key string) error {
	ctx, cancel := context.WithTimeout(ctx, storageTimeout)
	defer cancel()
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	return err
}

var _ Store = (*StorageStore)(nil)
