// meus-projetos-principais\meu-projeto\backend\src\routes\lotofacilRoutes.js
const express = require("express");
const router = express.Router();
const lotofacilController = require("../controllers/lotofacilController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { verificarPlano } = require("../middlewares/verificarPlano");

// ROTAS PÚBLICAS (FREE + PRÓ)
router.get("/", verificarToken, lotofacilController.listarTodos);
router.get("/ultimo", verificarToken, lotofacilController.buscarUltimo);
router.get("/estatisticas", verificarToken, lotofacilController.estatisticas);

// ROTAS BLOQUEADAS (APENAS PRÓ) 🔒
router.get(
    "/:concurso",
    verificarToken,
    verificarPlano("pro"),
    lotofacilController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    verificarPlano("pro"),
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
