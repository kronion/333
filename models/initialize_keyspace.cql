CREATE KEYSPACE IF NOT EXISTS "blabrr"
  WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 3};

USE blabrr;

CREATE TABLE IF NOT EXISTS users (
  userid uuid PRIMARY KEY,
  name text,
  email text,
  password text,
  followers set<uuid>,
  followees set<uuid>
);

CREATE TABLE IF NOT EXISTS global_links (
  linkid uuid PRIMARY KEY,
  url text,
  datetime timestamp,
  count int,
  tags set<text>
);

CREATE TABLE IF NOT EXISTS user_links (
  userid uuid,
  linkid uuid,
  url text,
  privacy boolean,
  PRIMARY KEY (userid, linkid)
);