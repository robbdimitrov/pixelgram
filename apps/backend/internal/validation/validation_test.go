package validation

import "testing"

func TestValidEmail(t *testing.T) {
	tests := []struct {
		email string
		want  bool
	}{
		{email: "test@example.com", want: true},
		{email: "test+label@example.co.uk", want: true},
		{email: "missing-at.example.com", want: false},
		{email: "missing-host@", want: false},
		{email: "has space@example.com", want: false},
	}

	for _, tt := range tests {
		t.Run(tt.email, func(t *testing.T) {
			if got := ValidEmail(tt.email); got != tt.want {
				t.Fatalf("ValidEmail() = %v, want %v", got, tt.want)
			}
		})
	}
}
