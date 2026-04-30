const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');
const bcrypt = require('bcrypt');

class InstituicaoCRUD{

  async instituicaoLogin(email, password) {
      try{
        const pool = await db.getConnection();
        const result = await pool.request()
          .input("email", sql.VarChar, email)
          .query("SELECT * FROM FOCA.INSTITUICAO WHERE email=@email");
        if (result.recordset.length > 0){
          const correctPassword = await bcrypt.compare(password, result.recordset[0].senha_hash);
          if (result.recordset[0].emailVerificado == 0){
            let er = new Error();
            er.name = "Email not verified";
            throw er;
          }
          if (correctPassword){
            return result.recordset;
          }
          let er = new Error();
          er.name = "Incorrect password";
          throw er;
        }
        let er = new Error();
        er.name = "Not found";
        throw er;
      }
      catch(error){
        throw error;
      }
  }

  async createInstituicao(email, password, nome){
      try{
        const saltNumber = 12;
        const encryptedPassword = await bcrypt.hash(password, saltNumber);
        const pool = await db.getConnection();
        const result = await pool.request()
        .input("email", sql.VarChar, email)
        .input("nome", sql.VarChar, nome)
        .input("password", sql.VarChar, encryptedPassword)
        .query("INSERT INTO FOCA.INSTITUICAO (EMAIL, NOME, SENHA_HASH) VALUES (@email, @nome, @password)")

      }
      catch(error){
        throw error;
      }
  }

  async verifYEmail(email){
    try{
      const pool = await db.getConnection();
      await pool.request()
      .input("email", sql.VarChar, email)
      .query("update FOCA.INSTITUICAO set emailVerificado = 1 where email = @email")

    }
    catch(error){
      throw error;
    }
  }

  async changePassword(email, newPwd){
    try{
      const saltNumber = 12;
      const encryptedPassword = await bcrypt.hash(newPwd, saltNumber);
      const pool = await db.getConnection();

      await pool.request()
      .input("email", sql.VarChar, email)
      .input("pwd", sql.VarChar, encryptedPassword)
      .query(`UPDATE FOCA.INSTITUICAO SET senha_hash = @pwd WHERE email=@email`);
    }
    catch(error){
      throw error;
    }
  }

  async getById(id) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM FOCA.INSTITUICAO WHERE id = @id");
      if (result.recordset.length === 0) {
        const er = new Error(); er.name = "Not found"; throw er;
      }
      return result.recordset[0];
    }
    catch (error) { throw error; }
  } 

  async update(id, email, nome) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .input("email", sql.VarChar, email)
        .input("nome", sql.VarChar, nome)
        .query(`UPDATE FOCA.INSTITUICAO SET email = @email, nome = @nome WHERE id = @id`);
      if (result.rowsAffected[0] === 0) {
        const er = new Error(); er.name = "Not found"; throw er;
      }
    }
    catch (error) { throw error; }
  }

  async delete(id) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .query("DELETE FROM FOCA.INSTITUICAO WHERE id = @id");
      if (result.rowsAffected[0] === 0) {
        const er = new Error(); er.name = "Not found"; throw er;
      }
    }
    catch (error) { throw error; }
  }

}


module.exports = InstituicaoCRUD;
