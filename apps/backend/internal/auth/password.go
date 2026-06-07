package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"golang.org/x/crypto/argon2"
)

const (
	argonVersion = 19
	saltSize     = 16
	hashSize     = 32
)

var (
	ErrInvalidHash = errors.New("invalid password hash")
	ErrHashVersion = errors.New("unsupported argon2 version")
)

type PasswordParams struct {
	Memory      uint32
	Iterations  uint32
	Parallelism uint8
}

var DefaultPasswordParams = PasswordParams{
	Memory:      19 * 1024,
	Iterations:  2,
	Parallelism: 1,
}

func HashPassword(password string, params PasswordParams) (string, error) {
	if params.Memory == 0 || params.Iterations == 0 || params.Parallelism == 0 {
		return "", ErrInvalidHash
	}

	salt := make([]byte, saltSize)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	hash := argon2.IDKey([]byte(password), salt, params.Iterations, params.Memory, params.Parallelism, hashSize)
	return encodePHC(params, salt, hash), nil
}

func VerifyPassword(password, encodedHash string) (bool, error) {
	params, salt, expected, err := parsePHC(encodedHash)
	if err != nil {
		return false, err
	}

	actual := argon2.IDKey([]byte(password), salt, params.Iterations, params.Memory, params.Parallelism, uint32(len(expected)))
	return subtle.ConstantTimeCompare(actual, expected) == 1, nil
}

func encodePHC(params PasswordParams, salt, hash []byte) string {
	return fmt.Sprintf(
		"$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argonVersion,
		params.Memory,
		params.Iterations,
		params.Parallelism,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(hash),
	)
}

func parsePHC(encodedHash string) (PasswordParams, []byte, []byte, error) {
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 || parts[0] != "" || parts[1] != "argon2id" {
		return PasswordParams{}, nil, nil, ErrInvalidHash
	}

	version, err := parseVersion(parts[2])
	if err != nil {
		return PasswordParams{}, nil, nil, err
	}
	if version != argonVersion {
		return PasswordParams{}, nil, nil, ErrHashVersion
	}

	params, err := parseParams(parts[3])
	if err != nil {
		return PasswordParams{}, nil, nil, err
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return PasswordParams{}, nil, nil, ErrInvalidHash
	}

	hash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return PasswordParams{}, nil, nil, ErrInvalidHash
	}

	if len(salt) == 0 || len(hash) == 0 {
		return PasswordParams{}, nil, nil, ErrInvalidHash
	}

	return params, salt, hash, nil
}

func parseVersion(value string) (int, error) {
	versionText, ok := strings.CutPrefix(value, "v=")
	if !ok {
		return 0, ErrInvalidHash
	}

	version, err := strconv.Atoi(versionText)
	if err != nil {
		return 0, ErrInvalidHash
	}
	return version, nil
}

func parseParams(value string) (PasswordParams, error) {
	values := map[string]uint64{}
	for _, part := range strings.Split(value, ",") {
		key, raw, ok := strings.Cut(part, "=")
		if !ok {
			return PasswordParams{}, ErrInvalidHash
		}
		parsed, err := strconv.ParseUint(raw, 10, 32)
		if err != nil {
			return PasswordParams{}, ErrInvalidHash
		}
		values[key] = parsed
	}

	memory, hasMemory := values["m"]
	iterations, hasIterations := values["t"]
	parallelism, hasParallelism := values["p"]
	if !hasMemory || !hasIterations || !hasParallelism ||
		memory == 0 || iterations == 0 || parallelism == 0 || parallelism > 255 {
		return PasswordParams{}, ErrInvalidHash
	}

	return PasswordParams{
		Memory:      uint32(memory),
		Iterations:  uint32(iterations),
		Parallelism: uint8(parallelism),
	}, nil
}
