// meus-projetos-principais\meu-projeto\backend\src\routes\lotofacilRoutes.js
const express = require("express");
const router = express.Router();
const lotofacilController = require("../controllers/lotofacilController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

// Todas exigem login (sistema gratuito, sem plano)
router.get("/", verificarToken, lotofacilController.listarTodos);
router.get("/ultimo", verificarToken, lotofacilController.buscarUltimo);
router.get("/estatisticas", verificarToken, cacheResposta, lotofacilController.estatisticas);

router.get(
    "/:concurso",
    verificarToken,
    lotofacilController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    limiteNumero,
    lotofacilController.buscarPorNumero,
);

// ROTAS ADMIN
router.post("/", verificarToken, verificarAdmin, lotofacilController.criar);
router.delete(
    "/:concurso",
    verificarToken,
    verificarAdmin,
    lotofacilController.deletar,
);

module.exports = router;
