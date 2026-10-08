// Bancas Parceiras — só o contador de cliques (a lista fica em frontend/public/data/bancas.json).
//
// Privacidade: não registramos QUEM clicou em QUAL banca.
// - a tabela bancas_cliques não tem usuario_id;
// - esta rota não aparece no log com o id do usuário (req.semLogDeUsuario, lido por
//   verificarToken) e o log de requisições grava o caminho sem a banca (index.js);
// - o limite por usuário fica só em memória (express-rate-limit, MemoryStore).
const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { verificarToken } = require("../middlewares/auth");
const { limiteCliqueBanca } = require("../middlewares/rateLimit");

const ID_BANCA = /^[a-z0-9-]{1,40}$/; // mesmo CHECK da tabela

function semLogDeUsuario(req, res, next) {
    req.semLogDeUsuario = true;
    next();
}

// POST /api/bancas/:id/clique → 204
router.post("/:id/clique", semLogDeUsuario, verificarToken, limiteCliqueBanca, async (req, res) => {
    const { id } = req.params;
    if (!ID_BANCA.test(id)) {
        return res.status(400).json({ success: false, message: "Banca inválida." });
    }

    try {
        await pool.query("INSERT INTO bancas_cliques (banca_id) VALUES ($1)", [id]);
        res.status(204).end();
    } catch (error) {
        // só o código do erro: a mensagem do Postgres pode trazer os dados da linha
        console.error("[BANCAS] Erro ao registrar clique:", error.code || "desconhecido");
        res.status(500).json({ success: false, message: "Erro ao registrar clique." });
    }
});

module.exports = router;
