CREATE TABLE search_outbox (
  id serial PRIMARY KEY,
  entity_type varchar(20) NOT NULL,
  entity_id varchar(255) NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX search_outbox_id_idx ON search_outbox(id);
