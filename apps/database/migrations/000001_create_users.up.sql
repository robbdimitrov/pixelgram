CREATE TABLE users (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  username varchar(30) UNIQUE NOT NULL
    CHECK (username ~ '^[a-z0-9._]{3,30}$'),
  email varchar(255) UNIQUE NOT NULL,
  password varchar(255) NOT NULL,
  avatar varchar(255) DEFAULT '',
  bio varchar(300) DEFAULT '',
  created timestamptz NOT NULL DEFAULT now()
);
