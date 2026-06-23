// meus-projetos-principais\meu-projeto\backend\src\routes\diadasorteRoutes.js
const express = require("express");
const router = express.Router();
const diadasorteController = require("../controllers/diadasorteController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { verificarPlano } = require("../middlewares/verificarPlano");

router.get("/", verificarToken, diadasorteController.listarTodos);
router.get("/ultimo", verificarToken, diadasorteController.buscarUltimo);
router.get("/estatisticas", verificarToken, diadasorteController.estatisticas);
router.get(
    "/:concurso",
    verificarToken,
    verificarPlano("pro"),
    diadasorteController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    verificarPlano("pro"),
    diadasorteController.buscarPorNumero,
);
router.get(
    "/mes/:mes",
    verificarToken,
    verificarPlano("pro"),
    diadasorteController.buscarPorMes,
);
router.post("/", verificarToken, verificarAdmin, diadasorteController.criar);
router.delete(
    "/:concurso",
    verificarToken,
    verificarAdmin,
    diadasorteController.deletar,
);

module.exports = router;
