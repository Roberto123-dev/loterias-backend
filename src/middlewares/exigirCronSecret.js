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
// Aceita "Authorization: Bearer <segredo>" (preferido) ou ?secret= (legado).
function exigirCronSecret(req, res, next) {
    // Defesa em profundidade: nunca aceitar se o segredo configurado estiver vazio
    if (!CRON_SECRET) {
        console.error("❌ CRON_SECRET vazio — rota de atualização bloqueada.");
        return res.status(503).json({
            success: false,
            message: "Serviço indisponível",
        });
    }

    const auth = req.get("authorization") || "";
    const match = auth.match(/^Bearer\s+(.+)$/i);
    const viaHeader = match ? match[1] : null;
    const viaQuery = typeof req.query.secret === "string" ? req.query.secret : null;
    const recebido = viaHeader ?? viaQuery;

    if (!recebido || !segredoConfere(recebido)) {
        return res.status(401).json({
            success: false,
            message: "Acesso não autorizado",
        });
    }

    if (!viaHeader) {
        console.warn(
            "⚠️ CRON_SECRET recebido via query string (legado) — migre para Authorization: Bearer",
        );
    }
    next();
}

module.exports = { exigirCronSecret };
