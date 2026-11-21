// meus-projetos-principais\meu-projeto\backend\src\routes\diadasorteRoutes.js
const express = require("express");
const router = express.Router();
const diadasorteController = require("../controllers/diadasorteController");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

router.get("/", diadasorteController.listarTodos);
router.get("/ultimo", diadasorteController.buscarUltimo);
router.get("/estatisticas", cacheResposta, diadasorteController.estatisticas);
router.get(
    "/:concurso",
    diadasorteController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    limiteNumero,
    diadasorteController.buscarPorNumero,
);
router.get(
    "/mes/:mes",
    diadasorteController.buscarPorMes,
);

module.exports = router;
