// meus-projetos-principais\meu-projeto\backend\src\routes\quinaRoutes.js
const express = require("express");
const router = express.Router();
const quinaController = require("../controllers/quinaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { limiteNumero } = require("../middlewares/rateLimit");
const { cacheResposta } = require("../middlewares/cacheResposta");

router.get("/", verificarToken, quinaController.listarTodos);
router.get("/ultimo", verificarToken, quinaController.buscarUltimo);
router.get("/estatisticas", verificarToken, cacheResposta, quinaController.estatisticas);
router.get(
    "/:concurso",
    verificarToken,
    quinaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    limiteNumero,
    quinaController.buscarPorNumero,
);
router.post("/", verificarToken, verificarAdmin, quinaController.criar);
router.delete(
    "/:concurso",
    verificarToken,
    verificarAdmin,
    quinaController.deletar,
);

module.exports = router;
