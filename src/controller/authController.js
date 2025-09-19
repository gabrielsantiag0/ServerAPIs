const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {sql, poolPromise} = require('../config/conn');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_padrao';

const registerUser = async (req, res) => {
    try {
        const { nome, email, senha, role_id } = req.body;
        
        // Validação dos campos obrigatórios
        if (!nome || !email || !senha) {
            return res.status(400).json({
                success: false,
                message: "Os campos (nome, email, senha) são obrigatórios."
            });
        }
        
        // Define o role_id padrão como 2 (Analista), se não for fornecido
        const defaultRoleId = 2;
        const finalRoleId = role_id || defaultRoleId;

        const pool = await poolPromise;
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Inserir usuário na tabela Usuarios
        const result = await pool.request()
            .input("nome", sql.VarChar, nome)
            .input("email", sql.VarChar, email)
            .input("senha_hash", sql.VarChar, hashedPassword)
            .query("INSERT INTO Usuarios (nome, email, senha_hash) VALUES (@nome, @email, @senha_hash); SELECT SCOPE_IDENTITY() AS id;");

        const userId = result.recordset[0].id;

        // Inserir a relação usuário-grupo na tabela Usuario_Grupo
        await pool.request()
            .input("userId", sql.Int, userId)
            .input("roleId", sql.Int, finalRoleId) // Usar o role_id fornecido ou o padrão (2)
            .query("INSERT INTO Usuario_Grupo (usuario_id, grupo_id) VALUES (@userId, @roleId)");

        res.status(201).json({
            success: true,
            message: "Usuário cadastrado com sucesso!"
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
            .query("SELECT u.id, u.nome, u.senha_hash, g.nome AS role FROM Usuarios u JOIN Usuario_Grupo ug ON u.id = ug.usuario_id JOIN Grupos g ON ug.grupo_id = g.id WHERE u.email = @email");

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

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            success: true,
            message: "Login realizado com sucesso!",
            token,
            user: { id: user.id, nome: user.nome, role: user.role }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno do servidor."
        });
    }
};

module.exports = {
    registerUser,
    loginUser
};
