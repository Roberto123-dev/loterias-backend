// meus-projetos-principais\meu-projeto\backend\src\routes\atualizadorRoutes.js
const express = require("express");
const router = express.Router();
const { executarAtualizacaoManual } = require("../services/agendador.js");
const {
    atualizarLoteria,
    buscarConcursoCaixa,
    LOTERIAS_CONFIG,
} = require("../services/atualizadorLoterias.js");

/**
 * Middleware: exige o CRON_SECRET na query string.
 * Protege todas as rotas que disparam atualização (Caixa + banco).
 */
function exigirSecret(req, res, next) {
    if (req.query.secret !== process.env.CRON_SECRET) {
        return res.status(403).json({
            success: false,
            message: "Acesso não autorizado",
        });
    }
    next();
}

/**
 * GET /api/atualizar/forcar
 * Força atualização manual (protegida + trava de concorrência).
 */
router.get("/forcar", exigirSecret, async (req, res) => {
    console.log("🔥 ROTA /forcar CHAMADA");

    const resultado = await executarAtualizacaoManual("rota-manual");

    return res.status(resultado.success ? 200 : 500).json({
        success: resultado.success,
        message: resultado.message,
    });
});

/**
 * GET /api/atualizar/status/loterias
 * Status de cada loteria (apenas leitura).
 * Deixei ABERTA por ser só informativa — adicione `exigirSecret` se quiser fechar.
 */
router.get("/status/loterias", async (req, res) => {
    try {
        const pool = require("../config/database");
        const status = {};

        for (const [id, config] of Object.entries(LOTERIAS_CONFIG)) {
            const result = await pool.query(
                `SELECT MAX(concurso) as ultimo, COUNT(*) as total FROM ${config.tabela}`,
            );

            status[id] = {
                nome: config.nome,
                ultimoConcurso: result.rows[0].ultimo,
                totalConcursos: parseInt(result.rows[0].total),
            };
        }

        res.json({
            success: true,
            data: status,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error("Erro ao buscar status:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar status",
        });
    }
});

/**
 * GET /api/atualizar/testar/:loteria/:concurso
 * Testa a busca de um concurso na API da Caixa (debug) — protegida.
 */
router.get("/testar/:loteria/:concurso", exigirSecret, async (req, res) => {
    try {
        const { loteria, concurso } = req.params;

        if (!LOTERIAS_CONFIG[loteria]) {
            return res.status(400).json({
                success: false,
                message: "Loteria inválida",
            });
        }

        const dados = await buscarConcursoCaixa(loteria, concurso);

        if (!dados) {
            return res.status(404).json({
                success: false,
                message: "Concurso não encontrado na API da Caixa",
            });
        }

        res.json({
            success: true,
            data: dados,
        });
    } catch (error) {
        console.error("Erro ao buscar concurso:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar concurso",
        });
    }
});

/**
 * GET /api/atualizar/:loteria
 * Atualiza uma loteria específica — protegida.
 */
router.get("/:loteria", exigirSecret, async (req, res) => {
    try {
        const { loteria } = req.params;

        if (!LOTERIAS_CONFIG[loteria]) {
            return res.status(400).json({
                success: false,
                message: "Loteria inválida",
                loteriasDisponiveis: Object.keys(LOTERIAS_CONFIG),
            });
        }

        const resultado = await atualizarLoteria(loteria);

        res.json({
            success: true,
            message: "Atualização concluída",
            data: resultado,
        });
    } catch (error) {
        console.error(`Erro ao atualizar ${req.params.loteria}:`, error);
        res.status(500).json({
            success: false,
            message: "Erro ao atualizar loteria",
        });
    }
});

/**
 * GET /api/atualizar
 * Atualiza todas as loterias — protegida + trava de concorrência.
 * Passa pelo executarAtualizacaoManual pra herdar a flag atualizacaoEmAndamento.
 */
router.get("/", exigirSecret, async (req, res) => {
    const resultado = await executarAtualizacaoManual("rota-manual");

    return res.status(resultado.success ? 200 : 500).json({
        success: resultado.success,
        message: resultado.message,
    });
});

module.exports = router;
