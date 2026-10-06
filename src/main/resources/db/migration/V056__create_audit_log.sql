-- V056: append-only audit trail for sensitive actions
-- (finance mutations, payment confirmations, role changes, membership/committee
-- changes, pastoral records). Application code only ever INSERTs.
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(255) PRIMARY KEY,
    actor_id VARCHAR(255) NOT NULL,
    actor_roles VARCHAR(500),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    detail VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
