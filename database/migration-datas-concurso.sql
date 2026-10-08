-- Migration: datas oficiais do concurso (etapa 8 do redesign "loteria ativa")
-- Idempotente: pode rodar mais de uma vez.
-- data_sorteio          = dataApuracao da Caixa
-- data_proximo_concurso = dataProximoConcurso da Caixa (pega sorteios fora da grade)
-- Concursos antigos ficam com NULL (o atualizador preenche o último de cada loteria
-- na próxima rodada, ao revalidá-lo). Rodar ANTES de publicar o backend novo.
BEGIN;
ALTER TABLE lotofacil      ADD COLUMN IF NOT EXISTS data_sorteio DATE, ADD COLUMN IF NOT EXISTS data_proximo_concurso DATE;
ALTER TABLE megasena       ADD COLUMN IF NOT EXISTS data_sorteio DATE, ADD COLUMN IF NOT EXISTS data_proximo_concurso DATE;
ALTER TABLE quina          ADD COLUMN IF NOT EXISTS data_sorteio DATE, ADD COLUMN IF NOT EXISTS data_proximo_concurso DATE;
ALTER TABLE lotomania      ADD COLUMN IF NOT EXISTS data_sorteio DATE, ADD COLUMN IF NOT EXISTS data_proximo_concurso DATE;
ALTER TABLE duplasena      ADD COLUMN IF NOT EXISTS data_sorteio DATE, ADD COLUMN IF NOT EXISTS data_proximo_concurso DATE;
ALTER TABLE timemania      ADD COLUMN IF NOT EXISTS data_sorteio DATE, ADD COLUMN IF NOT EXISTS data_proximo_concurso DATE;
ALTER TABLE diadasorte     ADD COLUMN IF NOT EXISTS data_sorteio DATE, ADD COLUMN IF NOT EXISTS data_proximo_concurso DATE;
ALTER TABLE maismilionaria ADD COLUMN IF NOT EXISTS data_sorteio DATE, ADD COLUMN IF NOT EXISTS data_proximo_concurso DATE;
COMMIT;
