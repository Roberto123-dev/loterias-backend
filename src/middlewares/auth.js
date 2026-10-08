// meus-projetos-principais\meu-projeto\backend\src\middlewares\auth.js
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const { JWT_SECRET } = require("../config/jwt");
const { limiteGeralUsuario } = require("./rateLimit");

/**
 * Middleware de autenticação (único — use em toda rota que exige login).
 * Busca o usuário no banco a cada requisição: usuário removido perde o acesso
 * na hora, sem esperar o token expirar. Aplica também o limite geral por usuário.
 * Sistema gratuito: não há verificação de plano.
 */
const verificarToken = async (req, res, next) => {
    try {
        // Pegar token do header
        const token = req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Acesso negado. Token não fornecido.",
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);

        // ✅ CORRIGIDO: Adicionada a coluna 'role' no SELECT
        const result = await pool.query(
            "SELECT id, nome, email, plano, plano_expira_em, role FROM usuarios WHERE id = $1",
            [decoded.id],
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Usuário não encontrado.",
            });
        }

        const usuario = result.rows[0];

        // ✅ CORRIGIDO: Adicionada a 'role' no objeto req.usuario
        req.usuario = {
            id: usuario.id,
            email: usuario.email,
            nome: usuario.nome,
            plano: usuario.plano,
            plano_expira_em: usuario.plano_expira_em,
            role: usuario.role,
        };

        // Sem nome/e-mail no log (dado pessoal). Rotas marcadas com req.semLogDeUsuario
        // (ex.: clique em banca parceira) não registram nem o id.
        if (!req.semLogDeUsuario) console.log(`✅ [AUTH] Usuário ${usuario.id}`);

        return limiteGeralUsuario(req, res, next);
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expirado. Faça login novamente.",
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Token inválido.",
            });
        }

        console.error("Erro ao verificar token:", error);
        return res.status(500).json({
            success: false,
            message: "Erro ao verificar autenticação.",
        });
    }
};

/**
 * Middleware para exigir que o usuário seja admin.
 * Deve rodar DEPOIS de verificarToken (que preenche req.usuario).
 */
const verificarAdmin = (req, res, next) => {
    if (!req.usuario || req.usuario.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Acesso negado. Apenas administradores.",
        });
    }
    next();
};

/**
 * Middleware opcional (não bloqueia se não tiver token)
 */
const verificarTokenOpcional = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);

            // ✅ CORRIGIDO: Adicionada a coluna 'role' no SELECT
            const result = await pool.query(
                "SELECT id, nome, email, plano, plano_expira_em, role FROM usuarios WHERE id = $1",
                [decoded.id],
            );

            if (result.rows.length > 0) {
                const usuario = result.rows[0];
                // ✅ CORRIGIDO: Adicionada a 'role' no objeto req.usuario
                req.usuario = {
                    id: usuario.id,
                    email: usuario.email,
                    nome: usuario.nome,
                    plano: usuario.plano,
                    plano_expira_em: usuario.plano_expira_em,
                    role: usuario.role,
                };
            }
        }

        next();
    } catch (error) {
        // Se token inválido, apenas continua sem usuário
        next();
    }
};

module.exports = {
    verificarToken,
    verificarTokenOpcional,
    verificarAdmin,
};
