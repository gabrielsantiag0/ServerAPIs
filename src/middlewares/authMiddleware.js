const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../config/conn');

// A chave secreta do JWT 
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_padrao';

// Verifica se o usuário está autenticado
exports.auth = async (req, res, next) => {
    // Pega o token do cabeçalho de autorização (header)
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acesso negado. Nenhum token fornecido.'
        });
    }

    try {
        // Verifica o token usando a chave secreta
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = decoded;
        next();

    } catch (error) {
        console.error('Erro na autenticação do token:', error);
        res.status(401).json({
            success: false,
            message: 'Token inválido.'
        });
    }
};

// Middleware para verificar o papel do usuário
exports.authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles]; // Garante que roles seja um array
    }

    return (req, res, next) => {
        // Verifica se o usuário tem o papel necessário
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Acesso proibido. Você não tem permissão para esta ação.'
            });
        }
        
        // Se tiver permissão, passa para o próximo middleware ou controlador
        next();
    };
};
