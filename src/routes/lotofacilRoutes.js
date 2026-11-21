// meus-projetos-principais\meu-projeto\backend\src\routes\lotofacilRoutes.js
const express = require("express");
const router = express.Router();
const lotofacilController = require("../controllers/lotofacilController");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

// Somente leitura, pública
router.get("/", lotofacilController.listarTodos);
router.get("/ultimo", lotofacilController.buscarUltimo);
router.get("/estatisticas", cacheResposta, lotofacilController.estatisticas);

router.get(
    "/:concurso",
    lotofacilController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    limiteNumero,
    lotofacilController.buscarPorNumero,
);

module.exports = router;
