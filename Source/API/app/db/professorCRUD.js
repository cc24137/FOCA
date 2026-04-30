const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');
const bcrypt = require('bcrypt');

// database acess logic
class ProfessorCRUD {

  async findProfessorByEmail(email){
    try{
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("email", sql.VarChar, email)
        .query("SELECT * FROM FOCA.PROFESSOR WHERE email=@email");
      return result;
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
        .query("SELECT * FROM FOCA.PROFESSOR WHERE id = @id");
      if (result.recordset.length === 0) {
        const er = new Error(); er.name = "Not found"; throw er;
      }
      return result.recordset[0];
    }
    catch (error) { throw error; }
  }

  async professorLogin(email, password) {
    try{
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("email", sql.VarChar, email)
        .query("SELECT * FROM FOCA.PROFESSOR WHERE email=@email");
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

  async createProfessor(email, password, nome){
    try{
      const saltNumber = 12;
      const encryptedPassword = await bcrypt.hash(password, saltNumber);
      const pool = await db.getConnection();
      const result = await pool.request()
      .input("email", sql.VarChar, email)
      .input("nome", sql.VarChar, nome)
      .input("password", sql.VarChar, encryptedPassword)
      .query("INSERT INTO FOCA.PROFESSOR (EMAIL, NOME, SENHA_HASH, emailVerificado) OUTPUT INSERTED.id VALUES (@email, @nome, @password, 0)")
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
        .query("update FOCA.PROFESSOR set emailVerificado = 1 where email = @email")
      }
      catch(error){
        console.log(error);
      }
    };


  async changePassword(email, newPwd){
    try{
      const saltNumber = 12;
      const encryptedPassword = await bcrypt.hash(newPwd, saltNumber);
      const pool = await db.getConnection();

      await pool.request()
      .input("email", sql.VarChar, email)
      .input("pwd", sql.VarChar, encryptedPassword)
      .query(`UPDATE FOCA.PROFESSOR SET senha_hash = @pwd WHERE email=@email`);
    }
    catch(error){
      throw error;
    }
  }

  async update(id, nome) {
    try {
      const saltNumber = 12;
      const encryptedPassword = await bcrypt.hash(newPwd, saltNumber);
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .input("nome", sql.VarChar, nome)
        .input("senha", sql.VarChar, encryptedPassword)
        .query(`UPDATE FOCA.PROFESSOR SET nome = @nome, senhahash = @senha WHERE id = @id`);
      if (result.rowsAffected[0] === 0) {
        const er = new Error(); er.name = "Not found"; throw er;
      }
    }
    catch (error) { throw error; }
  }
}

module.exports = ProfessorCRUD;
