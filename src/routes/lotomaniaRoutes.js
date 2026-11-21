// meus-projetos-principais\meu-projeto\backend\src\routes\lotomaniaRoutes.js
const express = require("express");
const router = express.Router();
const lotomaniaController = require("../controllers/lotomaniaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

router.get("/", lotomaniaController.listarTodos);
router.get("/ultimo", lotomaniaController.buscarUltimo);
router.get("/estatisticas", cacheResposta, lotomaniaController.estatisticas);
router.get(
    "/:concurso",
    lotomaniaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    limiteNumero,
    lotomaniaController.buscarPorNumero,
);
router.post("/", verificarToken, verificarAdmin, lotomaniaController.criar);
router.delete(
    "/:concurso",
    verificarToken,
    verificarAdmin,
    lotomaniaController.deletar,
);

module.exports = router;
