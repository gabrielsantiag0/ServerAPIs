const express = require('express');
const router = express.Router();
const productsController = require('../controller/productsController');

// ======================================
// ROTAS DE PRODUTOS
// ======================================

// Rota para buscar todos os produtos ou por nome (query parameter)
router.get("/", productsController.getAllProducts);

// Rota para adicionar um novo produto
router.post("/", productsController.addProduct);

// Rota para buscar um produto por ID (parâmetro de URL)
router.get("/:id", productsController.getProductById);

// Rota para atualizar um produto existente
router.put("/:id", productsController.updateProduct);

// Rota para deletar um produto por ID
router.delete("/:id", productsController.deleteProduct);

module.exports = router;
