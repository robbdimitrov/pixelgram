package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"regexp"
)

const SessionIDLength = 28

var sessionIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{28}$`)

func GenerateSessionID() (string, error) {
	bytes := make([]byte, 21)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func ValidSessionID(sessionID string) bool {
	return len(sessionID) == SessionIDLength && sessionIDPattern.MatchString(sessionID)
}

func HashSessionToken(token, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(token))
	return hex.EncodeToString(mac.Sum(nil))
}
