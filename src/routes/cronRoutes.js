// meus-projetos-principais\meu-projeto\backend\src\routes\cronRoutes.js
const express = require("express");
const router = express.Router();
const { atualizarTodasLoterias } = require("../services/atualizadorLoterias");
const { exigirCronSecret } = require("../middlewares/exigirCronSecret");

router.get("/cron/atualizar", exigirCronSecret, async (req, res) => {
    try {
        console.log("⏰ ROTA /cron/atualizar CHAMADA");

        const resultado = await atualizarTodasLoterias();

        return res.json({
            success: true,
            message: "Atualização executada via cron",
            resultado,
        });
    } catch (err) {
        console.error("❌ Erro na rota /cron/atualizar:", err);

        return res.status(500).json({
            success: false,
            message: "Erro ao executar atualização via cron",
        });
    }
});

module.exports = router;
