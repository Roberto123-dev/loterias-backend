// meus-projetos-principais\meu-projeto\backend\src\routes\duplasenaRoutes.js
const express = require("express");
const router = express.Router();
const duplasenaController = require("../controllers/duplasenaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { verificarPlano } = require("../middlewares/verificarPlano");

router.get("/", verificarToken, duplasenaController.listarTodos);
router.get("/ultimo", verificarToken, duplasenaController.buscarUltimo);
router.get("/estatisticas", verificarToken, duplasenaController.estatisticas);
router.get(
    "/:concurso",
    verificarToken,
    verificarPlano("pro"),
    duplasenaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    verificarPlano("pro"),
    duplasenaController.buscarPorNumero,
);
router.post("/", verificarToken, verificarAdmin, duplasenaController.criar);
router.delete(
    "/:concurso",
    verificarToken,
    verificarAdmin,
    duplasenaController.deletar,
);

module.exports = router;
