CREATE TABLE comments (
  id        serial PRIMARY KEY,
  image_id  integer NOT NULL REFERENCES images ON DELETE CASCADE,
  user_id   integer NOT NULL REFERENCES users  ON DELETE CASCADE,
  body      varchar(2200) NOT NULL CHECK (char_length(body) > 0),
  created   timestamp NOT NULL DEFAULT now()
);
CREATE INDEX comments_image_id_idx ON comments(image_id);
