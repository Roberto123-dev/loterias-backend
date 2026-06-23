// meus-projetos-principais\meu-projeto\backend\src\routes\baseRoutes.js
const express = require("express");

function criarRotas(controller) {
    const router = express.Router();

    // Rotas especiais (devem vir antes das rotas com parâmetros)
    router.get("/ultimo", controller.buscarUltimo);
    router.get("/estatisticas", controller.estatisticas);
    router.get("/numero/:numero", controller.buscarPorNumero);

    // Rotas CRUD padrão
    router.get("/", controller.listarTodos);
    router.get("/:concurso", controller.buscarPorConcurso);
    router.post("/", controller.criar);
    router.delete("/:concurso", controller.deletar);

    return router;
}

module.exports = criarRotas;
