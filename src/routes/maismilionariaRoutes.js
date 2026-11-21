// meus-projetos-principais\meu-projeto\backend\src\routes\maismilionariaRoutes.js
const express = require("express");
const router = express.Router();
const maismilionariaController = require("../controllers/maismilionariaController");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

router.get("/", maismilionariaController.listarTodos);
router.get("/ultimo", maismilionariaController.buscarUltimo);
router.get(
    "/estatisticas",
    cacheResposta,
    maismilionariaController.estatisticas,
);
router.get(
    "/:concurso",
    maismilionariaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    limiteNumero,
    maismilionariaController.buscarPorNumero,
);

module.exports = router;
