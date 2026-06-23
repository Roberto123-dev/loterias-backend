// meus-projetos-principais\meu-projeto\backend\src\routes\emailNotifRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const authMiddleware = require("../middlewares/authMiddleware");

// Inscrever
router.post("/inscrever", authMiddleware, async (req, res) => {
    const { email, nome, id } = req.usuario;

    try {
        await pool.query(
            `
      INSERT INTO email_subscriptions (email, nome, usuario_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET ativo = TRUE
    `,
            [email, nome, id],
        );

        res.json({ success: true, message: "Notificações ativadas!" });
    } catch (err) {
        console.error("[NOTIF] Erro ao inscrever:", err);
        res.status(500).json({ error: "Erro ao inscrever." });
    }
});

// Cancelar
router.post("/cancelar", authMiddleware, async (req, res) => {
    const { email } = req.usuario;

    try {
        await pool.query(
            "UPDATE email_subscriptions SET ativo = FALSE WHERE email = $1",
            [email],
        );
        res.json({ success: true, message: "Notificações desativadas." });
    } catch (err) {
        res.status(500).json({ error: "Erro ao cancelar." });
    }
});

// Status
router.get("/status", authMiddleware, async (req, res) => {
    const { email } = req.usuario;

    const { rows } = await pool.query(
        "SELECT ativo FROM email_subscriptions WHERE email = $1",
        [email],
    );

    res.json({ inscrito: rows[0]?.ativo || false });
});

module.exports = router;
