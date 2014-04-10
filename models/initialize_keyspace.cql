CREATE KEYSPACE IF NOT EXISTS "getchive"
  WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE getchive;

CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY,
  email text,
  password text,
  first_name text,
  last_name text
);

CREATE INDEX users_email ON users (email);

CREATE TABLE IF NOT EXISTS followers (
  user_id uuid,
  follower_id uuid,
  PRIMARY KEY (user_id, follower_id)
);

CREATE TABLE IF NOT EXISTS followees (
  user_id uuid,
  followee_id uuid,
  PRIMARY KEY (user_id, followee_id)
);

CREATE TABLE IF NOT EXISTS global_links (
  link_id timeuuid PRIMARY KEY,
  url text,
  count int
);

CREATE TABLE IF NOT EXISTS user_links (
  user_id uuid,
  link_id timeuuid,
  url text,
  caption text,
  privacy boolean,
  PRIMARY KEY (user_id, link_id)
) WITH CLUSTERING ORDER BY (link_id DESC);

CREATE TABLE IF NOT EXISTS links_to_tags (
  link_id timeuuid,
  tag text,
  PRIMARY KEY (link_id, tag)
);

CREATE TABLE IF NOT EXISTS tags_to_links (
  link_id timeuuid,
  tag text,
  PRIMARY KEY (tag, link_id)
) WITH CLUSTERING ORDER BY (link_id DESC);