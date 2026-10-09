const { rateLimit } = require("express-rate-limit");

// ⚠️ Armazenamento em memória: vale para 1 instância. Com réplicas, cada uma conta
// separado (o limite real se multiplica); restart/deploy zera os contadores.
// Para escalar: trocar por um store compartilhado (ex.: rate-limit-redis).
//
// Resposta 429 (todas): { success: false, code: "LIMITE_ATINGIDO", message, tenteNovamenteEm }
// tenteNovamenteEm = segundos até liberar; a message já diz o tempo de espera em texto
// (as telas de login/cadastro mostram a message direto).
function formatarEspera(segundos) {
    if (segundos < 60) return `${segundos} segundo${segundos === 1 ? "" : "s"}`;
    const minutos = Math.ceil(segundos / 60);
    if (minutos < 60) return `${minutos} minuto${minutos === 1 ? "" : "s"}`;
    const horas = Math.ceil(minutos / 60);
    return `${horas} hora${horas === 1 ? "" : "s"}`;
}

function criarLimite({ janelaMs, limite, mensagem = "Muitas tentativas.", ...extra }) {
    return rateLimit({
        windowMs: janelaMs,
        limit: limite,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        handler: (req, res, next, opcoes) => {
            const resetEm = req.rateLimit?.resetTime;
            const segundos = resetEm
                ? Math.max(1, Math.ceil((resetEm.getTime() - Date.now()) / 1000))
                : Math.ceil(janelaMs / 1000);
            res.status(opcoes.statusCode).json({
                success: false,
                code: "LIMITE_ATINGIDO",
                message: `${mensagem} Tente novamente em ${formatarEspera(segundos)}.`,
                tenteNovamenteEm: segundos,
            });
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

// ============================================
// Limites por USUÁRIO logado — rodam depois de verificarToken (req.usuario)
// ============================================
function criarLimitePorUsuario(opcoes) {
    return criarLimite({
        mensagem: "Você fez muitas consultas em pouco tempo.",
        keyGenerator: (req) => `usuario:${req.usuario.id}`,
        ...opcoes,
    });
}

// Rede de segurança para qualquer rota autenticada (aplicado dentro de verificarToken)
const limiteGeralUsuario = criarLimitePorUsuario({ janelaMs: 60 * 1000, limite: 300 });
// POST /api/analise/* — varre o histórico a cada chamada
const limiteAnalise = criarLimitePorUsuario({ janelaMs: 5 * 60 * 1000, limite: 30 });
// GET /<loteria>/numero/:numero
const limiteNumero = criarLimitePorUsuario({ janelaMs: 60 * 1000, limite: 60 });
// POST /api/bancas/clique — contador de cliques das Bancas Parceiras
const limiteCliqueBanca = criarLimitePorUsuario({ janelaMs: 60 * 60 * 1000, limite: 30 });
// POST /api/jogos/conferir-todos-simples — ~3 consultas por jogo salvo
const limiteConferirTodos = criarLimitePorUsuario({ janelaMs: 60 * 60 * 1000, limite: 10 });

module.exports = {
    limiteLogin,
    limiteRegistro,
    limiteForgot,
    limiteGeralUsuario,
    limiteAnalise,
    limiteNumero,
    limiteConferirTodos,
    limiteCliqueBanca,
};
