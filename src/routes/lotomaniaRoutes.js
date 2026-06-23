// meus-projetos-principais\meu-projeto\backend\src\routes\lotomaniaRoutes.js
const express = require("express");
const router = express.Router();
const lotomaniaController = require("../controllers/lotomaniaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { verificarPlano } = require("../middlewares/verificarPlano");

router.get("/", verificarToken, lotomaniaController.listarTodos);
router.get("/ultimo", verificarToken, lotomaniaController.buscarUltimo);
router.get("/estatisticas", verificarToken, lotomaniaController.estatisticas);
router.get(
    "/:concurso",
    verificarToken,
    verificarPlano("pro"),
    lotomaniaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    verificarPlano("pro"),
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
