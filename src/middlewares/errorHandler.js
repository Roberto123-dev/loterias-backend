// meus-projetos-principais\meu-projeto\backend\src\middlewares\errorHandler.js
// ERROR HANDLER
const errorHandler = (err, req, res, next) => {
    console.error("❌ Erro:", err);

    // Erro de validação do PostgreSQL (ex: violação de constraint)
    if (err.code === "23505") {
        return res.status(409).json({
            success: false,
            message: "Registro já existe",
        });
    }

    // Erro de tipo de dado inválido
    if (err.code === "22P02") {
        return res.status(400).json({
            success: false,
            message: "ID inválido",
        });
    }

    // Corpo da requisição grande demais (ex.: análises, limite de 100 KB)
    if (err.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Dados enviados grandes demais.",
        });
    }

    // JSON malformado no corpo
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Dados enviados em formato inválido.",
        });
    }

    // Erro genérico
    res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
    });
};

module.exports = errorHandler;
