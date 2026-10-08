-- Lotomania: dezena 100 → 00 nos jogos salvos (etapa 12, fix/regras-loterias)
--
-- O gerador antigo usava o volante 1–100; o oficial é 00–99 e o 00 é gravado como 0
-- (é assim que vem nos resultados da tabela lotomania). Jogos salvos com 100 nunca
-- acertam o 00 na conferência.
--
-- Rodar em produção DEPOIS do deploy do backend fix/regras-loterias (com
-- COMPAT_GERADOR_ANTIGO = true, que já grava 100 como 0) — ver DEPLOY.md, passo 7.
--
-- Idempotente: só altera jogos que ainda têm 100 e não têm 0; rodar de novo não muda nada.
-- Jogos com 100 E 0 ao mesmo tempo ficariam com o 0 repetido: não são alterados (o aviso
-- no fim mostra quantos sobraram, para decidir à parte).
-- O resultado já gravado da conferência (acertos) não muda aqui: o próximo "Conferir"
-- recalcula com o 00.

BEGIN;

UPDATE jogos_salvos
SET dezenas = (
        SELECT array_agg(d ORDER BY d)
        FROM unnest(array_replace(dezenas, 100, 0)) AS d
    ),
    updated_at = NOW()
WHERE loteria = 'lotomania'
  AND 100 = ANY (dezenas)
  AND NOT (0 = ANY (dezenas));

DO $$
DECLARE
    restantes integer;
BEGIN
    SELECT count(*) INTO restantes
    FROM jogos_salvos
    WHERE loteria = 'lotomania' AND 100 = ANY (dezenas);

    IF restantes > 0 THEN
        RAISE NOTICE 'Lotomania: % jogo(s) ainda com 100 (têm 0 também) — não alterados', restantes;
    ELSE
        RAISE NOTICE 'Lotomania: nenhum jogo com 100';
    END IF;
END $$;

COMMIT;
