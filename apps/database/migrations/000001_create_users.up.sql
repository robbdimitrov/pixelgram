CREATE TABLE users (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  username varchar(255) UNIQUE NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password varchar(255) NOT NULL,
  avatar varchar(255) DEFAULT '',
  bio varchar(160) DEFAULT '',
  created timestamptz NOT NULL DEFAULT now()
);
