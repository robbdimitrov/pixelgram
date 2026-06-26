package uploads

import "context"

type Repository interface {
	CreateUpload(ctx context.Context, userID, filename string) (bool, []string, error)
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
	created, expired, err := s.repository.CreateUpload(ctx, command.UserID, command.Filename)
	return RegisterResult{Created: created, ExpiredFilenames: expired}, err
}
