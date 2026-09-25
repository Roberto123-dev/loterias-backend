const { rateLimit } = require("express-rate-limit");

// ⚠️ Armazenamento em memória: vale para 1 instância. Com réplicas, cada uma conta
// separado (o limite real se multiplica); restart/deploy zera os contadores.
// Para escalar: trocar por um store compartilhado (ex.: rate-limit-redis).
function criarLimite({ janelaMs, limite, ...extra }) {
    return rateLimit({
        windowMs: janelaMs,
        limit: limite,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        // JSON no mesmo formato da API — o frontend lê data.message
        message: {
            success: false,
            message: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
        },
        ...extra,
    });
}

// Login: só tentativas que falham contam (não bloqueia quem entra várias vezes do mesmo IP)
const limiteLogin = criarLimite({
    janelaMs: 15 * 60 * 1000,
    limite: 10,
    skipSuccessfulRequests: true,
});
const limiteRegistro = criarLimite({ janelaMs: 60 * 60 * 1000, limite: 5 });
const limiteForgot = criarLimite({ janelaMs: 60 * 60 * 1000, limite: 5 });

module.exports = { limiteLogin, limiteRegistro, limiteForgot };
