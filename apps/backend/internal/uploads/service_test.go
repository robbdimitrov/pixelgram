package uploads

import (
	"context"
	"errors"
	"testing"
)

type serviceRepository struct {
	expired   []string
	created   bool
	createErr error
}

func (r serviceRepository) CreateUpload(context.Context, string, string) (bool, []string, error) {
	return r.created, r.expired, r.createErr
}

func TestServiceRegisterPreservesExpiredFilesWhenCreateFails(t *testing.T) {
	result, err := NewService(serviceRepository{
		expired: []string{"old-file"}, createErr: errors.New("database unavailable"),
	}).Register(context.Background(), RegisterCommand{UserID: "1", Filename: "new-file"})

	if err == nil || len(result.ExpiredFilenames) != 1 {
		t.Fatalf("Register() = %+v, %v", result, err)
	}
}

func TestServiceRegisterReturnsExpiredFilesAndCapacityOutcome(t *testing.T) {
	result, err := NewService(serviceRepository{
		expired: []string{"old-file"}, created: false,
	}).Register(context.Background(), RegisterCommand{UserID: "1", Filename: "new-file"})

	if err != nil || result.Created || len(result.ExpiredFilenames) != 1 {
		t.Fatalf("Register() = %+v, %v", result, err)
	}
}
