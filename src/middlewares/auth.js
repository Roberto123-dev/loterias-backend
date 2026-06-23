// meus-projetos-principais\meu-projeto\backend\src\middlewares\auth.js
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_aqui";

/**
 * Middleware para verificar JWT
 * IMPORTANTE: Busca dados atualizados do usuário no banco (incluindo plano)
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

        // Verificar se plano PRO expirou
        if (usuario.plano === "pro" && usuario.plano_expira_em) {
            const agora = new Date();
            const expiracao = new Date(usuario.plano_expira_em);

            if (expiracao < agora) {
                // Plano expirado - fazer downgrade automático
                await pool.query(
                    "UPDATE usuarios SET plano = $1, plano_expira_em = NULL WHERE id = $2",
                    ["free", usuario.id],
                );
                usuario.plano = "free";
                console.log(
                    `⚠️ Plano PRÓ do usuário ${usuario.id} expirou automaticamente`,
                );
            }
        }

        // ✅ CORRIGIDO: Adicionada a 'role' no objeto req.usuario
        req.usuario = {
            id: usuario.id,
            email: usuario.email,
            nome: usuario.nome,
            plano: usuario.plano,
            plano_expira_em: usuario.plano_expira_em,
            role: usuario.role,
        };

        console.log(
            `✅ [AUTH] Usuário ${usuario.id} (${usuario.nome}) - Plano: ${usuario.plano} - Role: ${usuario.role}`,
        );

        next();
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
