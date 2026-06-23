// meus-projetos-principais\meu-projeto\backend\src\routes\maismilionariaRoutes.js
const express = require("express");
const router = express.Router();
const maismilionariaController = require("../controllers/maismilionariaController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const { verificarPlano } = require("../middlewares/verificarPlano");

router.get("/", verificarToken, maismilionariaController.listarTodos);
router.get("/ultimo", verificarToken, maismilionariaController.buscarUltimo);
router.get(
    "/estatisticas",
    verificarToken,
    maismilionariaController.estatisticas,
);
router.get(
    "/:concurso",
    verificarToken,
    verificarPlano("pro"),
    maismilionariaController.buscarPorConcurso,
);
router.get(
    "/numero/:numero",
    verificarToken,
    verificarPlano("pro"),
    maismilionariaController.buscarPorNumero,
);
router.post(
    "/",
    verificarToken,
    verificarAdmin,
    maismilionariaController.criar,
);
router.delete(
    "/:concurso",
    verificarToken,
    verificarAdmin,
    maismilionariaController.deletar,
);

module.exports = router;
