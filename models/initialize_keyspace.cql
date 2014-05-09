CREATE KEYSPACE IF NOT EXISTS "getchive"
  WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE getchive;

CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY,
  fbid text,
  email text,
  password text,
  first_name text,
  last_name text,
  image text,
  ver_code timeuuid,
  verified boolean
);

CREATE INDEX IF NOT EXISTS users_email ON users (email);

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
  img_url text,
  descrip text,
  title text,
  count int
);

CREATE TABLE IF NOT EXISTS url_to_links (
  url text PRIMARY KEY,
  link_id timeuuid
);

CREATE TABLE IF NOT EXISTS user_links (
  user_id uuid,
  user_link_id timeuuid,
  url text,
  img_url text,
  descrip text,
  title text,
  caption text,
  privacy boolean,
  PRIMARY KEY (user_id, user_link_id)
) WITH CLUSTERING ORDER BY (user_link_id DESC);

CREATE TABLE IF NOT EXISTS user_link_id_to_user (
  user_link_id timeuuid PRIMARY KEY,
  user_id uuid
);

CREATE TABLE IF NOT EXISTS comments (
  user_link_id timeuuid,
  comment_id timeuuid,
  user_id uuid,
  author text,
  body text,
  PRIMARY KEY(user_link_id, comment_id)
) WITH CLUSTERING ORDER BY (comment_id ASC);

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

CREATE TABLE IF NOT EXISTS timeline (
  user_id uuid,
  user_link_id timeuuid,
  owner_id uuid,
  url text,
  img_url text,
  descrip text,
  title text,
  caption text,
  PRIMARY KEY (user_id, user_link_id)
) WITH CLUSTERING ORDER BY (user_link_id DESC);
