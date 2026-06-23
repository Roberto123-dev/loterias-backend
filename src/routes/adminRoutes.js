// meus-projetos-principais\meu-projeto\backend\src\routes\adminRoutes.js

// ============================================
// ADMIN ROUTES
// ============================================
// Arquivo: src/routes/adminRoutes.js

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");

// ============================================
// MIDDLEWARE: Todas as rotas requerem auth + admin
// ============================================
router.use(authMiddleware);
router.use(adminController.verificarAdmin);

// ============================================
// ROTAS DO PAINEL ADMIN
// ============================================

// Dashboard (estatísticas)
router.get("/dashboard", adminController.getDashboard);

// Usuários
router.get("/usuarios", adminController.listarUsuarios);
router.get("/usuarios/:id", adminController.getUsuario);

// Resetar senha de usuário
router.put("/usuarios/:id/resetar-senha", adminController.resetarSenha);

// Ativar/Desativar PRO
router.post("/usuarios/:id/ativar", adminController.ativarPro);
router.post("/usuarios/:id/desativar", adminController.desativarPro);

// Histórico
router.get("/historico", adminController.getHistorico);

// Alertas de expiração
router.get("/alertas", adminController.getAlertas);

module.exports = router;
