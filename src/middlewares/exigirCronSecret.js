const crypto = require("crypto");
const { CRON_SECRET } = require("../config/cron");

// O sha256 deixa os dois lados com 32 bytes: o timingSafeEqual exige tamanhos iguais,
// e assim nem o tamanho do segredo vaza pelo tempo de resposta.
function segredoConfere(recebido) {
    const a = crypto.createHash("sha256").update(recebido).digest();
    const b = crypto.createHash("sha256").update(CRON_SECRET).digest();
    return crypto.timingSafeEqual(a, b);
}

// Exige o CRON_SECRET nas rotas que disparam atualização (Caixa + banco).
// Só aceita o header "Authorization: Bearer <segredo>". Segredo na query string
// não autentica: vazaria em logs de proxy e no histórico do navegador.
function exigirCronSecret(req, res, next) {
    // Defesa em profundidade: nunca aceitar se o segredo configurado estiver vazio
    if (!CRON_SECRET) {
        console.error("❌ CRON_SECRET vazio — rota de atualização bloqueada.");
        return res.status(503).json({
            success: false,
            message: "Serviço indisponível",
        });
    }

    if (req.query.secret !== undefined) {
        console.warn("⚠️ CRON: segredo na query string não é mais aceito — use Authorization: Bearer");
    }

    const auth = req.get("authorization") || "";
    const match = auth.match(/^Bearer\s+(.+)$/i);
    const recebido = match ? match[1] : null;

    if (!recebido || !segredoConfere(recebido)) {
        return res.status(401).json({
            success: false,
            message: "Acesso não autorizado",
        });
    }

    next();
}

module.exports = { exigirCronSecret };
