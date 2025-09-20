const express = require('express');
const router = express.Router();
const { auth, restrictTo } = require('../middlewares/authMiddleware');
const authController = require('../controller/authController');

// ======================================
// ROTAS DE AUTENTICAÇÃO E GERENCIAMENTO DE USUÁRIOS
// ======================================

// Rotas públicas (não precisam de autenticação)
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);

// Rota para buscar todos os usuários (painel de admin)
// Protegida pelo middleware 'auth' e restrita a 'Administrador'
router.get("/", auth, restrictTo(['Administrador']), authController.getAllUsers);

// Rota para atualizar o perfil de um usuário (painel de admin)
// Protegida e restrita a 'Administrador'
router.put('/:id/update-profile', auth, restrictTo(['Administrador']), authController.updateUserProfile);

// Rotas existentes para CRUD de usuário
router.get("/:id", auth, restrictTo(['Administrador', 'Supervisor']), authController.getUserById);
router.put("/:id", auth, restrictTo(['Administrador']), authController.updateUser);
router.delete("/:id", auth, restrictTo(['Administrador', 'Supervisor']), authController.deleteUser);

module.exports = router;