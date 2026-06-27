CREATE ROLE phasma_connect;

GRANT CONNECT ON DATABASE phasma TO phasma_connect;
GRANT USAGE ON SCHEMA public TO phasma_connect;
GRANT SELECT ON outbox TO phasma_connect;
GRANT SELECT ON users TO phasma_connect;
