const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');
const bcrypt = require('bcrypt');

// database acess logic
class ProfessorCRUD {

  findProfessorByEmail(email){
    return new Promise(async (resolve, reject) => {
      try{
        const result = await pool.request()
          .input("email", sql.VarChar, email)
          .query("SELECT * FROM FOCA.PROFESSOR WHERE email=@email");
      }
      catch(error){
        reject(error);
      }
    });
  }

  professorLogin(email, password) {
    return new Promise(async (resolve, reject) => {
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
            reject(er);
          }
          if (correctPassword){
            resolve(result.recordset);
          }
          let er = new Error();
          er.name = "Incorrect password";
          reject(er);
        }
        let er = new Error();
        er.name = "Not found";
        reject(er);
      }
      catch(error){
        reject(error);
      }
    });
  }

  createProfessor(email, password, nome){
    return new Promise(async (resolve, reject ) =>{
      try{
        const saltNumber = 12;
        const encryptedPassword = await bcrypt.hash(password, saltNumber);
        const pool = await db.getConnection();
        const result = await pool.request()
        .input("email", sql.VarChar, email)
        .input("nome", sql.VarChar, nome)
        .input("password", sql.VarChar, encryptedPassword)
        .query("INSERT INTO FOCA.PROFESSOR (EMAIL, NOME, SENHA_HASH, emailVerificado) VALUES (@email, @nome, @password, 0)")

        resolve();
      }
      catch(error){
        reject(error);
      }
    });
  }

  verifYEmail(email){
    return new Promise(async (resolve, reject ) =>{
      try{
        const pool = await db.getConnection();
        await pool.request()
        .input("email", sql.VarChar, email)
        .query("update FOCA.PROFESSOR set emailVerificado = 1 where email = @email)")

        resolve();
      }
      catch(error){
        reject(error);
      }
    });
  }
}

module.exports = ProfessorCRUD;
