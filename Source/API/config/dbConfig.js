
require('dotenv').config();
const sql = require("mssql"); 

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {          // should chage when it's no longer local
    encrypt: true, 
    trustServerCertificate: true,
  }
};

// Cria uma única instância para toda a aplicação
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('Connected successfully!');
    return pool;
  })
  .catch(err => {
    console.error('Error in database connection: ', err);
    process.exit(1);
  });

module.exports = {
  sql, 
  getConnection: () => poolPromise
};
