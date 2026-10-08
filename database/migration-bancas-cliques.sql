-- Migration: contador de cliques das Bancas Parceiras (etapa 11)
-- Idempotente. Sem usuario_id de propósito (LGPD: não registrar quem clicou em qual banca).
-- banca_id = o "id" de frontend/public/data/bancas.json.
BEGIN;
CREATE TABLE IF NOT EXISTS bancas_cliques (
    id         BIGSERIAL PRIMARY KEY,
    banca_id   VARCHAR(40) NOT NULL CHECK (banca_id ~ '^[a-z0-9-]{1,40}$'),  -- o "id" do bancas.json
    criado_em  TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bancas_cliques_banca_data ON bancas_cliques (banca_id, criado_em);
COMMIT;
