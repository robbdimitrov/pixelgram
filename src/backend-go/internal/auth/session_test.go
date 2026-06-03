package auth

import "testing"

func TestGenerateSessionIDMatchesNodeShape(t *testing.T) {
	sessionID, err := GenerateSessionID()
	if err != nil {
		t.Fatalf("GenerateSessionID returned error: %v", err)
	}

	if !ValidSessionID(sessionID) {
		t.Fatalf("generated invalid session ID: %q", sessionID)
	}
}

func TestValidSessionID(t *testing.T) {
	tests := []struct {
		name      string
		sessionID string
		want      bool
	}{
		{name: "valid", sessionID: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA", want: true},
		{name: "too short", sessionID: "AAAAAAAAAAAAAAAAAAAAAAAAAAA", want: false},
		{name: "invalid chars", sessionID: "AAAAAAAAAAAAAAAAAAAAAAAAAAA-", want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ValidSessionID(tt.sessionID); got != tt.want {
				t.Fatalf("ValidSessionID() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestHashSessionTokenMatchesNodeImplementation(t *testing.T) {
	got := HashSessionToken("AAAAAAAAAAAAAAAAAAAAAAAAAAAA", "test-secret")
	const want = "df8c58689953eb751ea48ebd2f91c1f44497874b4168716449a76cb7626828aa"

	if got != want {
		t.Fatalf("HashSessionToken() = %q, want %q", got, want)
	}
}

func TestHashSessionTokenDefaultSecret(t *testing.T) {
	got := HashSessionToken("AAAAAAAAAAAAAAAAAAAAAAAAAAAA", "")
	const want = "9b51d73b223c2562eb7b76ddb20dca2eece534f9e703243a37c289a6fc474af7"

	if got != want {
		t.Fatalf("HashSessionToken() = %q, want %q", got, want)
	}
}
