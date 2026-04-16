
const sql = require('mssql');
const db = require('../config/dbConfig');

class EmailVerificationCRUD{

  saveCode = async (email, code) => {
      const pool = await db.getConnection();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await pool.request()
          .input('Email', sql.VarChar, email)
          .input('Code', sql.Char, code)
          .input('ExpiresAt', sql.DateTime, expiresAt)
          .query(`
              INSERT INTO foca.Codigo_Verificacao (Email, o_codigo, ExpiresAt)
              VALUES (@Email, @Code, @ExpiresAt)
          `);
  };

  getValidCode = async (email, code) => {
      const pool = await db.getConnection();
      const result = await pool.request()
          .input('Email', sql.VarChar, email)
          .input('Code', sql.Char, code)
          .query(`
              SELECT * FROM foca.Codigo_Verificacao 
              WHERE Email = @Email AND o_codigo = @Code AND ExpiresAt > GETDATE()
          `);
      return result.recordset[0];
  };

  deleteCodesByEmail = async (email) => {
      const pool = await db.getConnection();
      await pool.request()
          .input('Email', sql.VarChar, email)
          .query('DELETE FROM foca.Codigo_Verificacao WHERE Email = @Email');
  };
}

module.exports = EmailVerificationCRUD;