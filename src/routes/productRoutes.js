const express = require('express');
const router = express.Router();
const productsController = require('../controller/productsController');
const { auth, restrictTo } = require('../middlewares/authMiddleware');

// ======================================
// ROTAS DE PRODUTOS
// ======================================

// Rota para buscar todos os produtos ou por nome (query parameter)
// Apenas usuários logados podem ler.
router.get("/", auth, productsController.getAllProducts);

// Rota para adicionar um novo produto
// Apenas usuários com perfil de 'Analista' ou 'Supervisor' podem criar produtos.
router.post("/", auth, restrictTo(['Analista', 'Supervisor']), productsController.addProduct);

// Rota para buscar um produto por ID 
// Apenas usuários logados podem ler.
router.get("/:id", auth, productsController.getProductById);

// Rota para atualizar um produto existente
// Apenas usuários com perfil de 'Supervisor' podem editar produtos.
router.put("/:id", auth, restrictTo(['Supervisor']), productsController.updateProduct);

// Rota para deletar um produto por ID
// Apenas usuários com perfil de 'Supervisor' podem deletar produtos.
router.delete("/:id", auth, restrictTo(['Supervisor']), productsController.deleteProduct);

module.exports = router;
