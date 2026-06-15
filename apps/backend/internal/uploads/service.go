package uploads

import "context"

type Repository interface {
	DeleteExpiredUploads(ctx context.Context) ([]string, error)
	CreateUpload(ctx context.Context, userID, filename string) (bool, error)
}

type RegisterCommand struct {
	UserID   string
	Filename string
}

type RegisterResult struct {
	Created          bool
	ExpiredFilenames []string
}

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) Register(ctx context.Context, command RegisterCommand) (RegisterResult, error) {
	expired, err := s.repository.DeleteExpiredUploads(ctx)
	if err != nil {
		return RegisterResult{}, err
	}
	created, err := s.repository.CreateUpload(ctx, command.UserID, command.Filename)
	return RegisterResult{Created: created, ExpiredFilenames: expired}, err
}
