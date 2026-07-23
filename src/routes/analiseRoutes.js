// meus-projetos-principais\meu-projeto\backend\src\routes\analiseRoutes.js
const express = require("express");
const router = express.Router();
const { analisarCombinacoes } = require("../controllers/analiseController");
const { analisarDezenas } = require("../controllers/analiseController");
const authMiddleware = require("../middlewares/authMiddleware");
const { verificarPlano } = require("../middlewares/verificarPlano");

router.use(authMiddleware); // Protege todas as rotas abaixo
router.use(verificarPlano("pro")); // ← adicionar: exige plano PRO

// POST /api/analise/dezenas
router.post("/combinacoes", analisarCombinacoes);
router.post("/dezenas", analisarDezenas);

module.exports = router;
