// meus-projetos-principais\meu-projeto\backend\src\routes\timemaniaRoutes.js
const express = require("express");
const router = express.Router();
const timemaniaController = require("../controllers/timemaniaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

router.get("/", timemaniaController.listarTodos);
router.get("/ultimo", timemaniaController.buscarUltimo);
router.get("/estatisticas", cacheResposta, timemaniaController.estatisticas);
router.get(
    "/:concurso",
    timemaniaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
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
