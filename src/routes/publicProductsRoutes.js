const express = require('express');
const router = express.Router();
const productsController = require('../controller/productsController');

// ======================================
// ROTA DE CONSULTA DE PRODUTOS PÚBLICA
// ======================================

// Rota para buscar todos os produtos.
// Acesso público, não requer autenticação.
router.get("/", productsController.getAllProducts);

module.exports = router;
