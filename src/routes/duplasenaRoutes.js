// meus-projetos-principais\meu-projeto\backend\src\routes\duplasenaRoutes.js
const express = require("express");
const router = express.Router();
const duplasenaController = require("../controllers/duplasenaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

router.get("/", verificarToken, duplasenaController.listarTodos);
router.get("/ultimo", verificarToken, duplasenaController.buscarUltimo);
router.get("/estatisticas", verificarToken, cacheResposta, duplasenaController.estatisticas);
router.get(
    "/:concurso",
    verificarToken,
    duplasenaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    limiteNumero,
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
