// meus-projetos-principais\meu-projeto\backend\src\routes\analiseRoutes.js
const express = require("express");
const router = express.Router();
const { analisarCombinacoes } = require("../controllers/analiseController");
const { analisarDezenas } = require("../controllers/analiseController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware); // Protege todas as rotas abaixo

// POST /api/analise/dezenas
router.post("/combinacoes", analisarCombinacoes);
router.post("/dezenas", analisarDezenas);

module.exports = router;
