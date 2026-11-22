-- Migration: PRIMARY KEY (id) e UNIQUE (concurso) na megasena
-- Alinha a megasena com as outras 7 loterias e com a produção (Neon).
--
-- Idempotente: cada constraint só é criada se ainda não existir, então pode
-- rodar com segurança no Neon, que já tem as duas.
--
-- Pré-requisito: sem ids nem concursos duplicados. Se houver, o ALTER falha
-- e a transação inteira é desfeita — nada fica pela metade. Conferir antes com:
--   SELECT id, COUNT(*) FROM megasena GROUP BY id HAVING COUNT(*) > 1;
--   SELECT concurso, COUNT(*) FROM megasena GROUP BY concurso HAVING COUNT(*) > 1;

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.megasena'::regclass
          AND conname = 'megasena_pkey'
    ) THEN
        ALTER TABLE ONLY public.megasena
            ADD CONSTRAINT megasena_pkey PRIMARY KEY (id);
        RAISE NOTICE 'megasena_pkey criada';
    ELSE
        RAISE NOTICE 'megasena_pkey já existe — nada a fazer';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.megasena'::regclass
          AND conname = 'megasena_concurso_key'
    ) THEN
        ALTER TABLE ONLY public.megasena
            ADD CONSTRAINT megasena_concurso_key UNIQUE (concurso);
        RAISE NOTICE 'megasena_concurso_key criada';
    ELSE
        RAISE NOTICE 'megasena_concurso_key já existe — nada a fazer';
    END IF;
END
$$;

COMMIT;
