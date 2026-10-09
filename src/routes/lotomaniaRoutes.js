// meus-projetos-principais\meu-projeto\backend\src\routes\lotomaniaRoutes.js
const express = require("express");
const router = express.Router();
const lotomaniaController = require("../controllers/lotomaniaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

router.get("/", verificarToken, lotomaniaController.listarTodos);
router.get("/ultimo", verificarToken, lotomaniaController.buscarUltimo);
router.get("/estatisticas", verificarToken, cacheResposta, lotomaniaController.estatisticas);
router.get(
    "/:concurso",
    verificarToken,
    lotomaniaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
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
