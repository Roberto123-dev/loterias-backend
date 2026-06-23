// meus-projetos-principais\meu-projeto\backend\src\middlewares\errorHandler.js
// ERROR HANDLER
const errorHandler = (err, req, res, next) => {
    console.error("❌ Erro:", err);

    // Erro de validação do PostgreSQL (ex: violação de constraint)
    if (err.code === "23505") {
        return res.status(409).json({
            success: false,
            message: "Registro duplicado",
            error: err.detail,
        });
    }

    // Erro de tipo de dado inválido
    if (err.code === "22P02") {
        return res.status(400).json({
            success: false,
            message: "ID inválido",
        });
    }

    // Erro genérico
    res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
};

module.exports = errorHandler;
