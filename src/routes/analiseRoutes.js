// meus-projetos-principais\meu-projeto\backend\src\routes\analiseRoutes.js
const express = require("express");
const router = express.Router();
const { analisarCombinacoes } = require("../controllers/analiseController");
const { analisarDezenas } = require("../controllers/analiseController");
const { verificarToken } = require("../middlewares/auth");
const { limiteAnalise } = require("../middlewares/rateLimit");

// Exige login (sistema gratuito) + limite por usuário: cada análise varre o histórico.
// Corpo limitado a 100 KB em index.js.
router.use(verificarToken);
router.use(limiteAnalise);

// POST /api/analise/dezenas
router.post("/combinacoes", analisarCombinacoes);
router.post("/dezenas", analisarDezenas);

module.exports = router;
