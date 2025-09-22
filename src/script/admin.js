// scripts/init_admin.js
const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../config/conn'); 

const createAdminUser = async () => {
    try {
        const pool = await poolPromise;

        //  Verifique se a tabela de usuários está vazia
        const userCountResult = await pool.request().query("SELECT COUNT(*) as count FROM Usuarios");
        if (userCountResult.recordset[0].count > 0) {
            console.log("Usuários já existem. Pulando a criação do administrador padrão.");
            return;
        }

        console.log("Criando usuário administrador padrão...");

        // Gere o hash da senha
        const plainPassword = 'admin'; //  Defina uma senha padrão forte aqui 
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

        // Encontre o ID do perfil de Administrador
        const adminGroupResult = await pool.request().query("SELECT id FROM Grupos WHERE nome = 'Administrador'");
        if (adminGroupResult.recordset.length === 0) {
            console.error("Grupo 'Administrador' não encontrado. Verifique se ele foi inserido na sua tabela 'Grupos'.");
            return;
        }
        const adminGroupId = adminGroupResult.recordset[0].id;

        // Inicie uma transação para garantir que ambas as inserções funcionem ou falhem juntas
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Insira o novo usuário na tabela Usuarios
            const request = new sql.Request(transaction);
            request.input('nome', sql.VarChar, 'Admin');
            request.input('email', sql.VarChar, 'admin@email.com');
            request.input('senha_hash', sql.VarChar, passwordHash);

            const insertUserResult = await request.query(`
                INSERT INTO Usuarios (nome, email, senha_hash)
                VALUES (@nome, @email, @senha_hash);
                SELECT SCOPE_IDENTITY() as id;
            `);

            const newUserId = insertUserResult.recordset[0].id;

            // Associe o usuário ao grupo de Administrador
            const request2 = new sql.Request(transaction);
            request2.input('usuario_id', sql.Int, newUserId);
            request2.input('grupo_id', sql.Int, adminGroupId);

            await request2.query(`
                INSERT INTO Usuario_Grupo (usuario_id, grupo_id)
                VALUES (@usuario_id, @grupo_id);
            `);

            await transaction.commit();
            console.log("Usuário: Admin E-mail:'admin@email.com' Senha: admin \nUsuario criado com sucesso!");
        } catch (err) {
            await transaction.rollback();
            console.error("Erro na transação. Usuário administrador não foi criado:", err);
        }
    } catch (err) {
        console.error("Erro ao conectar ou criar o usuário:", err);
    }
};

createAdminUser();