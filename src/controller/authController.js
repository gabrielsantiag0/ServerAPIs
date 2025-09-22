const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {sql, poolPromise} = require('../config/conn');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_padrao';

// ======================================
// Lógica de Autenticação e Gerenciamento de Usuários
// ======================================

const registerUser = async (req, res) => {
    try {
        const { nome, email, senha, perfil_id } = req.body;
        
        // Validação dos campos obrigatórios
        if (!nome || !email || !senha) {
            return res.status(400).json({
                success: false,
                message: "Os campos (nome, email, senha) são obrigatórios."
            });
        }
        
        // Define o perfil_id padrão como 2 (Analista), se não for fornecido
        const defaultPerfilId = 2;
        const finalPerfilId = perfil_id || defaultPerfilId;

        const pool = await poolPromise;
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Inserir usuário na tabela Usuarios
        const userInsertQuery = "INSERT INTO Usuarios (nome, email, senha_hash) VALUES (@nome, @email, @senha_hash); SELECT SCOPE_IDENTITY() AS id;";
        const result = await pool.request()
            .input("nome", sql.VarChar, nome)
            .input("email", sql.VarChar, email)
            .input("senha_hash", sql.VarChar, hashedPassword)
            .query(userInsertQuery);

        const userId = result.recordset[0].id;

        // Inserir a relação usuário-grupo na tabela Usuario_Grupo
        const userGroupInsertQuery = "INSERT INTO Usuario_Grupo (usuario_id, grupo_id) VALUES (@userId, @perfilId)";
        await pool.request()
            .input("userId", sql.Int, userId)
            .input("perfilId", sql.Int, finalPerfilId)
            .query(userGroupInsertQuery);

        // Busca o nome do perfil para incluir no token
        const perfilResult = await pool.request()
            .input("perfilId", sql.Int, finalPerfilId)
            .query("SELECT nome FROM Grupos WHERE id = @perfilId");

        const perfilNome = perfilResult.recordset[0].nome;
        const token = jwt.sign({ id: userId, perfil: perfilNome }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            success: true,
            message: "Usuário cadastrado com sucesso!",
            token: token
        });

    } catch (error) {
        if (error.originalError && error.originalError.info.message.includes('UNIQUE KEY constraint')) {
            return res.status(409).json({
                success: false,
                message: "O e-mail fornecido já está em uso."
            });
        }
        console.error("Erro ao cadastrar usuário:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno do servidor ao cadastrar usuário."
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                message: "E-mail e senha são obrigatórios."
            });
        }

        const pool = await poolPromise;
        const userResult = await pool.request()
            .input("email", sql.VarChar, email)
            .query("SELECT u.id, u.nome, u.senha_hash, g.nome AS perfil FROM Usuarios u JOIN Usuario_Grupo ug ON u.id = ug.usuario_id JOIN Grupos g ON ug.grupo_id = g.id WHERE u.email = @email");

        if (userResult.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Credenciais inválidas."
            });
        }

        const user = userResult.recordset[0];
        const isMatch = await bcrypt.compare(senha, user.senha_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Credenciais inválidas."
            });
        }

        const token = jwt.sign({ id: user.id, perfil: user.perfil }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            success: true,
            message: "Login realizado com sucesso!",
            token,
            user: { id: user.id, nome: user.nome, perfil: user.perfil }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno do servidor."
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // A consulta SQL foi alterada para fazer um JOIN com as tabelas Usuario_Grupo e Grupos
        const result = await pool.request().query(
            `SELECT
                u.id,
                u.nome,
                u.email,
                g.nome AS perfil
            FROM
                Usuarios AS u
            INNER JOIN
                Usuario_Grupo AS ug ON u.id = ug.usuario_id
            INNER JOIN
                Grupos AS g ON ug.grupo_id = g.id`
        );
        
        // A sua API agora vai retornar um campo 'perfil' para cada usuário
        res.status(200).json({
            success: true,
            users: result.recordset
        });

    } catch (error) {
        console.error("Erro ao buscar todos os usuários:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor, tente novamente."
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query("SELECT * FROM Usuarios WHERE id = @id");
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuário não encontrado."
            });
        }
        res.status(200).json({
            success: true,
            user: result.recordset[0]
        });
    } catch (error) {
        console.error("Erro ao buscar usuário por ID:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor, tente novamente."
        });
    }
};

const updateUser = async (req, res) => {
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
        const result = await pool.request()
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
            message: "Usuário atualizado com sucesso!"
        });

    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor, tente novamente."
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
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
            message: "Usuário deletado com sucesso!"
        });

    } catch (error) {
        console.error("Erro ao deletar usuário:", error);
        res.status(500).json({
            success: false,
            message: "Erro no servidor, tente novamente."
        });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { perfil_nome } = req.body; 

        if (!perfil_nome) {
            return res.status(400).json({
                success: false,
                message: "O nome do perfil é obrigatório."
            });
        }

        const pool = await poolPromise;

        // busca o ID do perfil com base no nome
        const perfilResult = await pool.request()
            .input("perfil_nome", sql.VarChar, perfil_nome)
            .query("SELECT id FROM Grupos WHERE nome = @perfil_nome");

        if (perfilResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Perfil não encontrado."
            });
        }

        const perfilId = perfilResult.recordset[0].id;

        // Atualiza a tabela Usuario_Grupo com o novo perfil_id
        const userGroupUpdateQuery = "UPDATE Usuario_Grupo SET grupo_id = @perfilId WHERE usuario_id = @id";
        const result = await pool.request()
            .input("id", sql.Int, id)
            .input("perfilId", sql.Int, perfilId)
            .query(userGroupUpdateQuery);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuário não encontrado ou o perfil já está definido."
            });
        }

        res.status(200).json({
            success: true,
            message: `Perfil do usuário atualizado para '${perfil_nome}' com sucesso!`
        });
    } catch (error) {
        console.error("Erro ao atualizar o perfil do usuário:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno do servidor ao atualizar o perfil do usuário."
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateUserProfile
};
