// meus-projetos-principais\meu-projeto\backend\src\middlewares\verificarPlano.js
// VERIFICAR PLANO
function verificarPlano(planoNecessario = "pro") {
    return (req, res, next) => {
        try {
            const usuario = req.usuario;

            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: "Usuário não autenticado",
                    code: "AUTH_REQUIRED",
                });
            }

            if (usuario.plano !== planoNecessario) {
                return res.status(403).json({
                    success: false,
                    message: "Recurso disponível apenas para usuários PRÓ",
                    planoAtual: usuario.plano,
                    planoNecessario: planoNecessario,
                    code: "UPGRADE_REQUIRED",
                });
            }

            if (usuario.plano === "pro" && usuario.plano_expira_em) {
                const agora = new Date();
                const expiracao = new Date(usuario.plano_expira_em);

                if (expiracao < agora) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "Seu plano PRÓ expirou. Renove para continuar acessando.",
                        planoExpirado: true,
                        code: "PLAN_EXPIRED",
                    });
                }
            }

            console.log(
                `✅ [PLANO] Usuário ${usuario.id} (${usuario.plano}) acessou recurso PRÓ`,
            );
            next();
        } catch (error) {
            console.error("❌ [PLANO] Erro ao verificar plano:", error);
            res.status(500).json({
                success: false,
                message: "Erro ao verificar plano",
            });
        }
    };
}

module.exports = { verificarPlano };
