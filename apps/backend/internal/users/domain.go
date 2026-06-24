package users

import (
	"time"

	"phasma/backend/internal/pagination"
)

type User struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Username    string    `json:"username"`
	Email       string    `json:"email"`
	Avatar      *string   `json:"avatar"`
	Bio         *string   `json:"bio"`
	Posts       int       `json:"posts"`
	Likes       int       `json:"likes"`
	Followers   int       `json:"followers"`
	Following   int       `json:"following"`
	IsFollowing bool      `json:"isFollowing"`
	Created     time.Time `json:"created"`
}

type UserCredentials struct {
	ID           int
	PasswordHash string
}

type UpdateUserResult struct {
	Updated      bool
	UnusedAvatar string
}

type CreateUserCommand struct {
	Name     string
	Username string
	Email    string
	Password string
}

type UpdateProfileCommand struct {
	UserID   string
	Name     string
	Username string
	Email    string
	Avatar   string
	Bio      *string
}

type ChangePasswordCommand struct {
	UserID           string
	CurrentPassword  string
	NewPassword      string
	CurrentSessionID string
}

type FollowCommand struct {
	FollowerID string
	FolloweeID string
}

type ListQuery struct {
	Username      string
	CurrentUserID string
	Cursor        *pagination.Cursor
	Limit         int
}

type UpdateProfileOutcome uint8

const (
	UpdateProfileUpdated UpdateProfileOutcome = iota
	UpdateProfileInvalidAvatar
)

type ChangePasswordOutcome uint8

const (
	ChangePasswordChanged ChangePasswordOutcome = iota
	ChangePasswordUserNotFound
	ChangePasswordWrongPassword
)
