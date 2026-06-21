package search

type UserResult struct {
	Username string  `json:"username"`
	Avatar   *string `json:"avatar"`
}

type HashtagResult struct {
	Name      string `json:"name"`
	PostCount int    `json:"postCount"`
}
