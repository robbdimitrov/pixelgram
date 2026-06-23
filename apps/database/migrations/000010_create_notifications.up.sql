CREATE TABLE notifications (
  id bigserial PRIMARY KEY,
  external_id varchar(255) NOT NULL,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,
  entity_id varchar(255) NOT NULL,
  read bool NOT NULL DEFAULT false,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX notifications_external_id_idx ON notifications(external_id);
CREATE INDEX notifications_user_id_created_idx ON notifications(user_id, created DESC, id DESC);
CREATE INDEX notifications_type_entity_id_idx ON notifications(type, entity_id);
