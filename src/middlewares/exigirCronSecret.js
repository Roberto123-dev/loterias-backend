const { CRON_SECRET } = require("../config/cron");

// Exige o CRON_SECRET nas rotas que disparam atualização (Caixa + banco).
function exigirCronSecret(req, res, next) {
    // Defesa em profundidade: nunca aceitar se o segredo configurado estiver vazio
    if (!CRON_SECRET) {
        console.error("❌ CRON_SECRET vazio — rota de atualização bloqueada.");
        return res.status(503).json({
            success: false,
            message: "Serviço indisponível",
        });
    }

    if (req.query.secret !== CRON_SECRET) {
        return res.status(401).json({
            success: false,
            message: "Acesso não autorizado",
        });
    }
    next();
}

module.exports = { exigirCronSecret };
