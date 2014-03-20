CREATE KEYSPACE IF NOT EXISTS "blabrr"
  WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 3};

USE blabrr;

CREATE TABLE IF NOT EXISTS users (
  username text PRIMARY KEY,
  password text
);
