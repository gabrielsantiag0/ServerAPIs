const express = require('express');
const router = express.Router();
const { auth, restrictTo } = require('../middlewares/authMiddleware');
const authController = require('../controller/authController');
const { sql, poolPromise } = require('../config/conn');

// ======================================
// ROTAS DE AUTENTICAÇÃO E GERENCIAMENTO DE USUÁRIOS
// ======================================

// Rota de Cadastro de Usuário
router.post("/register", authController.registerUser);

// Rota de Login de Usuário
router.post("/login", authController.loginUser);

// Rota para buscar todos os usuários
// Protegida pelo middleware `auth` e restrita a `Administrador`
router.get("/", auth, restrictTo(['Administrador']), async(req, res) => {
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
// Protegida e restrita a Administrador e Supervisor
router.get("/:id", auth, restrictTo(['Administrador', 'Supervisor']), async(req, res) => {
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
// Protegida e restrita a Administrador
router.put("/:id", auth, restrictTo(['Administrador']), async(req, res) => {
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
// Protegida e restrita a Administrador e Supervisor
router.delete("/:id", auth, restrictTo(['Administrador', 'Supervisor']), async(req, res) => {
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

// Rota para atualização de perfil
router.put('/:id/update-profile', auth, restrictTo(['Administrador']), async(req, res) => {
    try {
        const { id } = req.params;
        const { perfil_nome } = req.body;

        if (!perfil_nome) {
            return res.status(400).json({
                success: false,
                message: "O nome do perfil é obrigatório para a atualização."
            });
        }
        
        const pool = await poolPromise;

        // Busca o grupo (perfil) pelo nome
        const perfilResult = await pool.request()
            .input("perfil_nome", sql.VarChar, perfil_nome)
            .query("SELECT id FROM Grupos WHERE nome = @perfil_nome");
            
        if (perfilResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Perfil não encontrado."
            });
        }

        const perfil_id = perfilResult.recordset[0].id;

        // Atualiza a tabela Usuario_Grupo com o novo perfil_id
        const updateResult = await pool.request()
            .input("usuario_id", sql.Int, id)
            .input("grupo_id", sql.Int, perfil_id)
            .query("UPDATE Usuario_Grupo SET grupo_id = @grupo_id WHERE usuario_id = @usuario_id");

        if (updateResult.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuário não encontrado ou não houve alteração no perfil."
            });
        }

        res.status(200).json({
            success: true,
            message: "Perfil do usuário atualizado com sucesso!"
        });

    } catch (error) {
        console.error("Erro ao atualizar perfil do usuário:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor, tente novamente.",
            error: error.message
        });
    }
});

module.exports = router;
