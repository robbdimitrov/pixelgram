CREATE TABLE uploads (
  filename varchar(255) PRIMARY KEY,
  user_id integer REFERENCES users ON DELETE CASCADE,
  created timestamp NOT NULL DEFAULT now()
);

CREATE INDEX uploads_user_id_idx ON uploads(user_id);
CREATE INDEX uploads_created_idx ON uploads(created);

CREATE TABLE images (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users ON DELETE CASCADE,
  filename varchar(255) NOT NULL,
  description varchar(255) NOT NULL,
  created timestamp NOT NULL DEFAULT now()
);

CREATE TABLE likes (
  image_id integer REFERENCES images ON DELETE CASCADE,
  user_id integer REFERENCES users ON DELETE CASCADE,
  created timestamp NOT NULL DEFAULT now(),
  UNIQUE(image_id, user_id)
);
