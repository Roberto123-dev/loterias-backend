// meus-projetos-principais\meu-projeto\backend\src\routes\lotofacilRoutes.js
const express = require("express");
const router = express.Router();
const lotofacilController = require("../controllers/lotofacilController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

// Leitura pública; POST/DELETE só admin
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

// ROTAS ADMIN
router.post("/", verificarToken, verificarAdmin, lotofacilController.criar);
router.delete(
    "/:concurso",
    verificarToken,
    verificarAdmin,
    lotofacilController.deletar,
);

module.exports = router;
