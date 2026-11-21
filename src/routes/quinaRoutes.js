// meus-projetos-principais\meu-projeto\backend\src\routes\quinaRoutes.js
const express = require("express");
const router = express.Router();
const quinaController = require("../controllers/quinaController");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

router.get("/", quinaController.listarTodos);
router.get("/ultimo", quinaController.buscarUltimo);
router.get("/estatisticas", cacheResposta, quinaController.estatisticas);
router.get(
    "/:concurso",
    quinaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    limiteNumero,
    quinaController.buscarPorNumero,
);

module.exports = router;
