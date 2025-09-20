const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectToSqlServer } = require('./config/conn');

// Importar as rotas
const usersRoutes = require('./routes/userAuthRoutes');
const productRoutes = require('./routes/productRoutes');
const publicProductsRoutes = require('./routes/publicProductsRoutes'); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Rotas
app.get('/', (req, res) => {
    res.send('API de Produtos e Usuários funcionando!');
});

app.use('/api/usuarios', usersRoutes);
app.use('/api/produtos', productRoutes);
app.use('/api/produtos-publico', publicProductsRoutes); // Rota pública para consulta de produtos

// Conectar ao SQL Server e iniciar o servidor
const startServer = async () => {
    try {
        await connectToSqlServer();
        console.log('Conexão com o banco de dados bem-sucedida!');
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error('Erro ao conectar com o banco de dados:', error);
        process.exit(1);
    }
};

startServer();
