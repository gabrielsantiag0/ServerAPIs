const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    return pool;
  })
  .catch(err => {
    console.error('Falha na conexão com o Banco de Dados:', err);
    return null;
  });

const connectToSqlServer = async () => {
    try {
        await poolPromise;
    } catch (error) {
        throw new Error('Erro ao conectar com o banco de dados.');
    }
};

module.exports = {
  sql,
  poolPromise,
  connectToSqlServer,
};
