// meus-projetos-principais\meu-projeto\backend\src\routes\megasenaRoutes.js
const express = require("express");
const router = express.Router();
const megasenaController = require("../controllers/megasenaController");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

router.get("/", megasenaController.listarTodos);
router.get("/ultimo", megasenaController.buscarUltimo);
router.get("/estatisticas", cacheResposta, megasenaController.estatisticas);
router.get(
    "/:concurso",
    megasenaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    limiteNumero,
    megasenaController.buscarPorNumero,
);

module.exports = router;
