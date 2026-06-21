package sessions

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/valkey-io/valkey-go"
)

// LoginThrottle tracks and limits repeated login failures by key (IP or email).
// Keys auto-expire after the reset window, so no periodic cleanup is needed.
type LoginThrottle interface {
	GetFailures(ctx context.Context, keys []string) ([]LoginFailure, error)
	RecordFailure(ctx context.Context, key string) error
	Clear(ctx context.Context, keys []string) error
}

// recordFailureLua atomically increments the counter and sets a TTL on the
// first write so the key self-expires after the reset window.
const recordFailureLua = `
local n = redis.call('INCR', KEYS[1])
if n == 1 then
  redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[1]))
end
return n
`

const throttleKeyPrefix = "login:"

type DragonflyLoginThrottle struct {
	client valkey.Client
	script *valkey.Lua
	window time.Duration
}

func NewDragonflyLoginThrottle(dragonflyURL, password string) (*DragonflyLoginThrottle, error) {
	opt, err := valkey.ParseURL(dragonflyURL)
	if err != nil {
		return nil, fmt.Errorf("login throttle: parse dragonfly url: %w", err)
	}
	if password != "" {
		opt.Password = password
	}
	client, err := valkey.NewClient(opt)
	if err != nil {
		return nil, fmt.Errorf("login throttle: connect to dragonfly: %w", err)
	}
	return &DragonflyLoginThrottle{
		client: client,
		script: valkey.NewLuaScript(recordFailureLua),
		window: rateLimitDuration,
	}, nil
}

func (t *DragonflyLoginThrottle) GetFailures(ctx context.Context, keys []string) ([]LoginFailure, error) {
	vkeys := make([]string, len(keys))
	for i, k := range keys {
		vkeys[i] = throttleKeyPrefix + k
	}
	res, err := t.client.Do(ctx, t.client.B().Mget().Key(vkeys...).Build()).ToArray()
	if err != nil {
		return nil, err
	}
	var failures []LoginFailure
	for i, msg := range res {
		s, err := msg.ToString()
		if err != nil {
			continue // nil = key not set (no failures yet)
		}
		count, err := strconv.Atoi(s)
		if err != nil || count <= 0 {
			continue
		}
		failures = append(failures, LoginFailure{
			Key:     keys[i],
			Count:   count,
			ResetAt: time.Now().Add(t.window),
		})
	}
	return failures, nil
}

func (t *DragonflyLoginThrottle) RecordFailure(ctx context.Context, key string) error {
	windowMs := strconv.FormatInt(t.window.Milliseconds(), 10)
	return t.script.Exec(ctx, t.client,
		[]string{throttleKeyPrefix + key},
		[]string{windowMs},
	).Error()
}

func (t *DragonflyLoginThrottle) Clear(ctx context.Context, keys []string) error {
	vkeys := make([]string, len(keys))
	for i, k := range keys {
		vkeys[i] = throttleKeyPrefix + k
	}
	return t.client.Do(ctx, t.client.B().Del().Key(vkeys...).Build()).Error()
}

type NoopLoginThrottle struct{}

func (NoopLoginThrottle) GetFailures(_ context.Context, _ []string) ([]LoginFailure, error) {
	return nil, nil
}

func (NoopLoginThrottle) RecordFailure(_ context.Context, _ string) error { return nil }
func (NoopLoginThrottle) Clear(_ context.Context, _ []string) error       { return nil }
