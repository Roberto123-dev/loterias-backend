// meus-projetos-principais\meu-projeto\backend\src\middlewares\authMiddleware.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");

const PUBLIC_ROUTES = [
    "/api/auth/login",
    "/api/auth/registro",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
];

const authMiddleware = (req, res, next) => {
    try {
        // 🔓 LIBERAR ROTAS PÚBLICAS
        if (PUBLIC_ROUTES.includes(req.path)) {
            return next();
        }

        // Buscar token no header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message:
                    "Token não fornecido. Faça login para acessar este recurso.",
            });
        }

        // Formato esperado: "Bearer TOKEN"
        const parts = authHeader.split(" ");

        if (parts.length !== 2) {
            return res.status(401).json({
                success: false,
                message: "Formato de token inválido. Use: Bearer {token}",
            });
        }

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme)) {
            return res.status(401).json({
                success: false,
                message: "Formato de token inválido. Use: Bearer {token}",
            });
        }

        // Verificar e decodificar token
        const decoded = jwt.verify(token, JWT_SECRET);

        // ✅ CORRIGIDO: Adiciona a role no objeto req.usuario
        req.usuario = {
            id: decoded.id,
            email: decoded.email,
            nome: decoded.nome,
            plano: decoded.plano,
            role: decoded.role, // ⚠️ ESSENCIAL PARA O PAINEL ADMIN
        };

        // Continuar para próximo middleware/rota
        next();
    } catch (error) {
        console.error("Erro no authMiddleware:", error.message);

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Token inválido",
            });
        }

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expirado. Faça login novamente.",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Erro ao validar token",
        });
    }
};

module.exports = authMiddleware;
