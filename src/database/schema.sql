CREATE DATABASE pixelgram;
\connect pixelgram;

-- Users

CREATE TABLE users (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  username varchar(255) UNIQUE NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password varchar(255) NOT NULL,
  avatar varchar(255) DEFAULT '',
  bio varchar(255) DEFAULT '',
  created timestamp NOT NULL DEFAULT now()
);

-- Images

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

-- Sessions

CREATE TABLE sessions (
  id varchar(255) PRIMARY KEY,
  user_id integer REFERENCES users ON DELETE CASCADE,
  created timestamp NOT NULL DEFAULT now()
);

-- Utils

CREATE FUNCTION time_format(origin timestamp)
RETURNS text AS $$
BEGIN
  RETURN to_char(origin, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
END;
$$ LANGUAGE plpgsql;
