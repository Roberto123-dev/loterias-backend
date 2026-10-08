// meus-projetos-principais\meu-projeto\backend\src\routes\timemaniaRoutes.js
const express = require("express");
const router = express.Router();
const timemaniaController = require("../controllers/timemaniaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

router.get("/", verificarToken, timemaniaController.listarTodos);
router.get("/ultimo", verificarToken, timemaniaController.buscarUltimo);
router.get("/estatisticas", verificarToken, cacheResposta, timemaniaController.estatisticas);
router.get(
    "/:concurso",
    verificarToken,
    timemaniaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    limiteNumero,
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
