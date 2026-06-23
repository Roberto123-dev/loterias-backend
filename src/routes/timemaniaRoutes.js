// meus-projetos-principais\meu-projeto\backend\src\routes\timemaniaRoutes.js
const express = require("express");
const router = express.Router();
const timemaniaController = require("../controllers/timemaniaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { verificarPlano } = require("../middlewares/verificarPlano");

router.get("/", verificarToken, timemaniaController.listarTodos);
router.get("/ultimo", verificarToken, timemaniaController.buscarUltimo);
router.get("/estatisticas", verificarToken, timemaniaController.estatisticas);
router.get(
    "/:concurso",
    verificarToken,
    verificarPlano("pro"),
    timemaniaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    verificarPlano("pro"),
    timemaniaController.buscarPorNumero,
);
router.post("/", verificarToken, verificarAdmin, timemaniaController.criar);
router.delete(
    "/:concurso",
    verificarToken,
    verificarAdmin,
    timemaniaController.deletar,
);

module.exports = router;
