const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/conn');
const { auth, authorize } = require('../middlewares/authMiddleware');

// ======================================
// ROTAS DE GERENCIAMENTO DE USUÁRIOS
// ======================================

// Rota para buscar todos os usuários
router.get("/", auth, authorize(['Administrador']), async(req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM Usuarios");
        res.status(200).json({
            success: true,
            userData: result.recordset
        });
    } catch (error) {
        console.error(`Erro na rota /api/usuarios:`, error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor, tente novamente",
            error: error.Message
        });
    }
});

// Rota para buscar usuário por ID
router.get("/:id", auth, authorize(['Administrador', 'Supervisor']), async(req, res) => {
    try {
        const id = parseInt(req.params.id);

        if(isNaN(id)){
            return res.status(400).json({
                success: false,
                message: "ID inválido."
            });
        }

        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("idParam", sql.Int, id)
            .query("SELECT * FROM Usuarios WHERE id = @idParam");

        if(result.recordset.length === 0){
            return res.status(404).json({
                success: false,
                message: "Detalhes do usuário não encontrados."
            });
        }

        res.status(200).json({
            success: true,
            userData: result.recordset[0]
        });

    } catch (error) {
        console.error(`Erro na rota /api/usuarios/:id`, error);
        res.status(500).json({
            success: false,
            message:"Erro no servidor, tente novamente",
            error: error.Message
        });
    }
});

// Rota para atualizar um usuário existente
router.put("/:id", auth, authorize(['Administrador']), async(req, res) => {
    try {
        const { id } = req.params;
        const { nome, email } = req.body;
        
        if (!nome || !email) {
            return res.status(400).json({
                success: false,
                message: "Nome e e-mail são obrigatórios para a atualização."
            });
        }

        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("id", sql.Int, id)
            .input("nome", sql.VarChar, nome)
            .input("email", sql.VarChar, email)
            .query("UPDATE Usuarios SET nome = @nome, email = @email WHERE id = @id");
        
        if (result.rowsAffected[0] === 0) {
              return res.status(404).json({
                success: false,
                message: "Usuário não encontrado."
            });
        }

        res.status(200).json({
            success: true,
            message: "Usuário atualizado com sucesso!",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor, tente novamente.",
            error: error.message
        });
    }
});

// Rota para deletar um usuário por ID
router.delete("/:id", auth, authorize(['Administrador']), async(req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID inválido."
            });
        }
        
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("id", sql.Int, id)
            .query("DELETE FROM Usuarios WHERE id = @id");
        
        if (result.rowsAffected[0] === 0) {
              return res.status(404).json({
                success: false,
                message: "Usuário não encontrado."
            });
        }

        res.status(200).json({
            success: true,
            message: "Usuário deletado com sucesso!",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        console.error("Erro ao deletar usuário:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor, tente novamente.",
            error: error.message
        });
    }
});

module.exports = router;
