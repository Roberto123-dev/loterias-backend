// meus-projetos-principais\meu-projeto\backend\src\routes\quinaRoutes.js
const express = require("express");
const router = express.Router();
const quinaController = require("../controllers/quinaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { verificarPlano } = require("../middlewares/verificarPlano");

router.get("/", verificarToken, quinaController.listarTodos);
router.get("/ultimo", verificarToken, quinaController.buscarUltimo);
router.get("/estatisticas", verificarToken, quinaController.estatisticas);
router.get(
    "/:concurso",
    verificarToken,
    verificarPlano("pro"),
    quinaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    verificarPlano("pro"),
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
