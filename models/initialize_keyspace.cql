CREATE KEYSPACE IF NOT EXISTS "blabrr"
  WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 3};

USE blabrr;
