// meus-projetos-principais\meu-projeto\backend\src\routes\megasenaRoutes.js
const express = require("express");
const router = express.Router();
const megasenaController = require("../controllers/megasenaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

router.get("/", verificarToken, megasenaController.listarTodos);
router.get("/ultimo", verificarToken, megasenaController.buscarUltimo);
router.get("/estatisticas", verificarToken, cacheResposta, megasenaController.estatisticas);
router.get(
    "/:concurso",
    verificarToken,
    megasenaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    limiteNumero,
    megasenaController.buscarPorNumero,
);
router.post("/", verificarToken, verificarAdmin, megasenaController.criar);
router.delete(
    "/:concurso",
    verificarToken,
    verificarAdmin,
    megasenaController.deletar,
);

module.exports = router;
