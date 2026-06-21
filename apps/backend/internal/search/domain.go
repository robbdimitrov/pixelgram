package search

type UserResult struct {
	Username string  `json:"username"`
	Avatar   *string `json:"avatar"`
}

type HashtagResult struct {
	Name      string `json:"name"`
	PostCount int    `json:"postCount"`
}

type PostResult struct {
	ID          string `json:"id"`
	Username    string `json:"username"`
	Description string `json:"description"`
}
