package search

import "context"

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) SearchUsers(ctx context.Context, q string) ([]UserResult, error) {
	return s.repository.SearchUsers(ctx, q)
}

func (s *Service) SearchHashtags(ctx context.Context, q string) ([]HashtagResult, error) {
	return s.repository.SearchHashtags(ctx, q)
}
