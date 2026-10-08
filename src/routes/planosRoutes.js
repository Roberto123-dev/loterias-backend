// meus-projetos-principais\meu-projeto\backend\src\routes\planosRoutes.js
const express = require("express");
const router = express.Router();
const { verificarToken } = require("../middlewares/auth");
const pool = require("../config/database");

/**
 * GET /api/planos/meu-plano
 * Sistema gratuito: mantida só por compatibilidade com o frontend antigo, que ainda
 * a chama até o deploy do frontend sem planos. Remover depois desse deploy.
 */
router.get("/meu-plano", verificarToken, async (req, res) => {
    try {
        const { id } = req.usuario;

        const result = await pool.query(
            "SELECT plano, plano_expira_em FROM usuarios WHERE id = $1",
            [id],
        );

        const usuario = result.rows[0];

        res.json({
            success: true,
            data: {
                plano: usuario.plano,
                expiraEm: usuario.plano_expira_em,
                recursos: getRecursosPorPlano(usuario.plano),
            },
        });
    } catch (error) {
        console.error("Erro ao buscar plano:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar plano",
        });
    }
});

// Função auxiliar - recursos por plano
function getRecursosPorPlano(plano) {
    const recursos = {
        free: {
            verResultados: true,
            conferirJogos: false,
            mapaDezenas: false,
            verDetalhes: false,
            limite: "3 consultas por dia",
        },
        pro: {
            verResultados: true,
            conferirJogos: true,
            mapaDezenas: true,
            verDetalhes: true,
            limite: "Ilimitado",
        },
    };

    return recursos[plano] || recursos.free;
}

module.exports = router;
