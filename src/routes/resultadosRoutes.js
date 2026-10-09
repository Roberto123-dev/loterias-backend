// meus-projetos-principais\meu-projeto\backend\src\routes\resultadosRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const resultadosCache = require("../services/resultadosCache");

router.get("/ultimos-todos", async (req, res) => {
    try {
        const emCache = resultadosCache.get();
        if (emCache) {
            return res.json({ success: true, data: emCache, cached: true });
        }

        // Datas como texto AAAA-MM-DD (to_char), para o fuso não deslocar o dia no JSON.
        const query = `
        WITH
        m AS (
            SELECT 'megasena' AS loteria, concurso, dezenas,
                acumulou,
                premiacoes,
                valor_estimado_proximo,
                to_char(data_sorteio, 'YYYY-MM-DD') AS data_sorteio,
                to_char(data_proximo_concurso, 'YYYY-MM-DD') AS data_proximo_concurso,
                NULL::int[] AS dezenas_2,
                NULL::int[] AS trevos,
                NULL::text  AS mes_sorte,
                NULL::text  AS time_coracao
            FROM megasena
            ORDER BY concurso DESC
            LIMIT 1
        ),
        lf AS (
            SELECT 'lotofacil', concurso, dezenas,
                acumulou,
                premiacoes,
                valor_estimado_proximo,
                to_char(data_sorteio, 'YYYY-MM-DD') AS data_sorteio,
                to_char(data_proximo_concurso, 'YYYY-MM-DD') AS data_proximo_concurso,
                NULL::int[],
                NULL::int[],
                NULL::text,
                NULL::text
            FROM lotofacil
            ORDER BY concurso DESC
            LIMIT 1
        ),
        q AS (
            SELECT 'quina', concurso, dezenas,
                acumulou,
                premiacoes,
                valor_estimado_proximo,
                to_char(data_sorteio, 'YYYY-MM-DD') AS data_sorteio,
                to_char(data_proximo_concurso, 'YYYY-MM-DD') AS data_proximo_concurso,
                NULL::int[],
                NULL::int[],
                NULL::text,
                NULL::text
            FROM quina
            ORDER BY concurso DESC
            LIMIT 1
        ),
        lm AS (
            SELECT 'lotomania', concurso, dezenas,
                acumulou,
                premiacoes,
                valor_estimado_proximo,
                to_char(data_sorteio, 'YYYY-MM-DD') AS data_sorteio,
                to_char(data_proximo_concurso, 'YYYY-MM-DD') AS data_proximo_concurso,
                NULL::int[],
                NULL::int[],
                NULL::text,
                NULL::text
            FROM lotomania
            ORDER BY concurso DESC
            LIMIT 1
        ),
        ds AS (
            SELECT 'duplasena', concurso, dezenas_1 AS dezenas,
                acumulou,
                premiacoes,
                valor_estimado_proximo,
                to_char(data_sorteio, 'YYYY-MM-DD') AS data_sorteio,
                to_char(data_proximo_concurso, 'YYYY-MM-DD') AS data_proximo_concurso,
                dezenas_2,
                NULL::int[],
                NULL::text,
                NULL::text
            FROM duplasena
            ORDER BY concurso DESC
            LIMIT 1
        ),
        tm AS (
            SELECT 'timemania', concurso, dezenas,
                acumulou,
                premiacoes,
                valor_estimado_proximo,
                to_char(data_sorteio, 'YYYY-MM-DD') AS data_sorteio,
                to_char(data_proximo_concurso, 'YYYY-MM-DD') AS data_proximo_concurso,
                NULL::int[],
                NULL::int[],
                NULL::text,
                time_coracao
            FROM timemania
            ORDER BY concurso DESC
            LIMIT 1
        ),
        dd AS (
            SELECT 'diadasorte', concurso, dezenas,
                acumulou,
                premiacoes,
                valor_estimado_proximo,
                to_char(data_sorteio, 'YYYY-MM-DD') AS data_sorteio,
                to_char(data_proximo_concurso, 'YYYY-MM-DD') AS data_proximo_concurso,
                NULL::int[],
                NULL::int[],
                mes_sorte,
                NULL::text
            FROM diadasorte
            ORDER BY concurso DESC
            LIMIT 1
        ),
        mm AS (
            SELECT 'maismilionaria', concurso, dezenas,
                acumulou,
                premiacoes,
                valor_estimado_proximo,
                to_char(data_sorteio, 'YYYY-MM-DD') AS data_sorteio,
                to_char(data_proximo_concurso, 'YYYY-MM-DD') AS data_proximo_concurso,
                NULL::int[],
                trevos,
                NULL::text,
                NULL::text
            FROM maismilionaria
            ORDER BY concurso DESC
            LIMIT 1
        )

        SELECT * FROM m
        UNION ALL SELECT * FROM lf
        UNION ALL SELECT * FROM q
        UNION ALL SELECT * FROM lm
        UNION ALL SELECT * FROM ds
        UNION ALL SELECT * FROM tm
        UNION ALL SELECT * FROM dd
        UNION ALL SELECT * FROM mm;
        `;

        const result = await pool.query(query);

        const resultados = {};
        result.rows.forEach((row) => {
            resultados[row.loteria] = row;
        });

        resultadosCache.set(resultados);

        res.json({
            success: true,
            data: resultados,
            cached: false,
        });
    } catch (error) {
        console.error("Erro ao buscar resultados:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar resultados",
        });
    }
});

module.exports = router;
