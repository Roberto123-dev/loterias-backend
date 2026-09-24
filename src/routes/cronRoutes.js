// meus-projetos-principais\meu-projeto\backend\src\routes\cronRoutes.js
const express = require("express");
const router = express.Router();
const { executarAtualizacaoManual } = require("../services/agendador");
const { exigirCronSecret } = require("../middlewares/exigirCronSecret");

router.get("/cron/atualizar", exigirCronSecret, async (req, res) => {
    try {
        console.log("⏰ ROTA /cron/atualizar CHAMADA");

        // Passa pelo executarAtualizacaoManual para herdar a trava atualizacaoEmAndamento
        const execucao = await executarAtualizacaoManual("cron-externo");

        if (execucao.success) {
            return res.json({
                success: true,
                message: "Atualização executada via cron",
                resultado: execucao.resultado,
            });
        }

        // Já em andamento: 200 com success:false, para o cron-job.org não marcar falha
        if (execucao.emAndamento) {
            return res.json({ success: false, message: execucao.message });
        }

        return res.status(500).json({
            success: false,
            message: "Erro ao executar atualização via cron",
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
