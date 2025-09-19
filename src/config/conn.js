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
    console.log('Conectado ao SQL Server!');
    return pool;
  })
  .catch(err => {
    console.error('Falha na conexão com o Banco de Dados:', err);
    return null;
  });

module.exports = {
  sql, // Opcional: exporta o objeto sql
  poolPromise // Exporta o pool de conexões, que sua API precisa
};