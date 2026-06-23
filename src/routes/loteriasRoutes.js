// meus-projetos-principais\meu-projeto\backend\src\routes\loteriasRoutes.js
// ============================================
// ROTAS DE LOTERIAS - VERSÃO FINAL CORRIGIDA
// ============================================
// Arquivo: backend/src/routes/loteriasRoutes.js

const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ============================================
// GET /api/loterias/:loteria/resultado/:concurso
// ============================================
router.get("/:loteria/resultado/:concurso", async (req, res) => {
    try {
        const { loteria, concurso } = req.params;

        console.log(`🔍 Buscando resultado: ${loteria} - Concurso ${concurso}`);

        // Validar loteria
        const loteriasValidas = [
            "megasena",
            "lotofacil",
            "quina",
            "lotomania",
            "duplasena",
            "timemania",
            "diadasorte",
            "maismilionaria",
        ];

        if (!loteriasValidas.includes(loteria)) {
            return res.status(400).json({
                success: false,
                message: "Loteria inválida",
            });
        }

        let query;
        let result;

        // Tratamento especial para Dupla Sena
        if (loteria === "duplasena") {
            query = `
        SELECT 
          concurso,
          dezenas_1,
          dezenas_2,
          ARRAY(SELECT DISTINCT unnest(dezenas_1 || dezenas_2)) as "dezenasSorteadas"
        FROM duplasena
        WHERE concurso = $1
        LIMIT 1
      `;
            result = await pool.query(query, [concurso]);
        } else {
            // Outras loterias
            query = `
        SELECT 
          concurso,
          dezenas as "dezenasSorteadas"
        FROM ${loteria}
        WHERE concurso = $1
        LIMIT 1
      `;
            result = await pool.query(query, [concurso]);
        }

        if (result.rows.length === 0) {
            console.log(`⚠️ Resultado não encontrado: ${loteria} ${concurso}`);
            return res.status(404).json({
                success: false,
                message: `Resultado do concurso ${concurso} não encontrado`,
            });
        }

        console.log(`✅ Resultado encontrado: ${loteria} ${concurso}`);

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("❌ Erro ao buscar resultado:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar resultado do concurso",
            error: error.message,
        });
    }
});

// ============================================
// GET /api/loterias/:loteria/ultimo
// ============================================
router.get("/:loteria/ultimo", async (req, res) => {
    try {
        const { loteria } = req.params;

        // Validar loteria
        const loteriasValidas = [
            "megasena",
            "lotofacil",
            "quina",
            "lotomania",
            "duplasena",
            "timemania",
            "diadasorte",
            "maismilionaria",
        ];

        if (!loteriasValidas.includes(loteria)) {
            return res.status(400).json({
                success: false,
                message: "Loteria inválida",
            });
        }

        let query;

        if (loteria === "duplasena") {
            query = `
        SELECT 
          concurso,
          dezenas_1,
          dezenas_2,
          ARRAY(SELECT DISTINCT unnest(dezenas_1 || dezenas_2)) as "todasDezenas"
        FROM duplasena
        ORDER BY concurso DESC
        LIMIT 1
      `;
        } else {
            query = `
        SELECT 
          concurso,
          dezenas
        FROM ${loteria}
        ORDER BY concurso DESC
        LIMIT 1
      `;
        }

        const result = await pool.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Nenhum resultado encontrado para ${loteria}`,
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Erro ao buscar último concurso:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar último concurso",
            error: error.message,
        });
    }
});

// ============================================
// GET /api/loterias/:loteria/ultimos/:quantidade
// ============================================
router.get("/:loteria/ultimos/:quantidade", async (req, res) => {
    try {
        const { loteria, quantidade } = req.params;
        const limit = Math.min(parseInt(quantidade) || 10, 100);

        const loteriasValidas = [
            "megasena",
            "lotofacil",
            "quina",
            "lotomania",
            "duplasena",
            "timemania",
            "diadasorte",
            "maismilionaria",
        ];

        if (!loteriasValidas.includes(loteria)) {
            return res.status(400).json({
                success: false,
                message: "Loteria inválida",
            });
        }

        const query = `
      SELECT concurso, dezenas
      FROM ${loteria}
      ORDER BY concurso DESC
      LIMIT $1
    `;

        const result = await pool.query(query, [limit]);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
        });
    } catch (error) {
        console.error("Erro ao buscar concursos:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar concursos",
            error: error.message,
        });
    }
});

module.exports = router;
