const { sql, poolPromise } = require('../config/conn');

// ======================================
// Lógica de Produtos
// ======================================

// Obter todos os produtos ou buscar por nome
const getAllProducts = async (req, res) => {
    try {
        const pool = await poolPromise;
        let query = "SELECT * FROM Produtos";

        if (req.query.nome) {
            query += ` WHERE nome LIKE '%${req.query.nome}%'`;
        }

        const result = await pool.request().query(query);
        res.status(200).json({
            success: true,
            products: result.recordset
        });
    } catch (error) {
        console.error("Erro ao obter produtos:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor ao buscar produtos."
        });
    }
};

// Obter um produto por ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query("SELECT * FROM Produtos WHERE id = @id");
        
        if (result.recordset.length > 0) {
            res.status(200).json({
                success: true,
                product: result.recordset[0]
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Produto não encontrado."
            });
        }

    } catch (error) {
        console.error("Erro ao obter produto por ID:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor ao buscar o produto."
        });
    }
};

// Adicionar um novo produto
const addProduct = async (req, res) => {
    try {
        const { nome, descricao, preco, quantidade, usuario_id } = req.body;
        if (!nome || !preco || !quantidade || !usuario_id) {
            return res.status(400).json({
                success: false,
                message: "Nome, preço, quantidade e ID do usuário são obrigatórios."
            });
        }

        const pool = await poolPromise;
        await pool.request()
            .input("nome", sql.VarChar, nome)
            .input("descricao", sql.Text, descricao)
            .input("preco", sql.Decimal(18, 2), preco)
            .input("quantidade", sql.Int, quantidade)
            .input("usuario_id", sql.Int, usuario_id)
            .query("INSERT INTO Produtos (nome, descricao, preco, quantidade, usuario_id) VALUES (@nome, @descricao, @preco, @quantidade, @usuario_id)");

        res.status(201).json({
            success: true,
            message: "Produto adicionado com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao adicionar produto:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor ao adicionar produto."
        });
    }
};

// Atualizar um produto
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, quantidade } = req.body;

        if (!nome || !preco || !quantidade) {
            return res.status(400).json({
                success: false,
                message: "Nome, preço e quantidade são obrigatórios para a atualização."
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, id)
            .input("nome", sql.VarChar, nome)
            .input("descricao", sql.Text, descricao)
            .input("preco", sql.Decimal(18, 2), preco)
            .input("quantidade", sql.Int, quantidade)
            .query("UPDATE Produtos SET nome = @nome, descricao = @descricao, preco = @preco, quantidade = @quantidade WHERE id = @id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Produto não encontrado."
            });
        }

        res.status(200).json({
            success: true,
            message: "Produto atualizado com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor ao atualizar produto."
        });
    }
};

// Deletar um produto
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM Produtos WHERE id = @id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Produto não encontrado."
            });
        }

        res.status(200).json({
            success: true,
            message: "Produto excluído com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao deletar produto:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor ao deletar produto."
        });
    }
};

module.exports = {
    getAllProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById
};
