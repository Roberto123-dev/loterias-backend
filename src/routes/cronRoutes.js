// meus-projetos-principais\meu-projeto\backend\src\routes\cronRoutes.js
const express = require("express");
const router = express.Router();
const { atualizarTodasLoterias } = require("../services/atualizadorLoterias");

router.get("/cron/atualizar", async (req, res) => {
    if (req.query.secret !== process.env.CRON_SECRET) {
        return res.status(401).json({
            success: false,
            message: "Não autorizado",
        });
    }

    try {
        console.log("⏰ ROTA /cron/atualizar CHAMADA");

        const resultado = await atualizarTodasLoterias();

        return res.json({
            success: true,
            message: "Atualização executada via cron",
            resultado,
        });
    } catch (err) {
        console.error("❌ Erro na rota /cron/atualizar:", err.message);

        return res.status(500).json({
            success: false,
            message: "Erro ao executar atualização via cron",
            error: err.message,
        });
    }
});

module.exports = router;
