const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');
const bcrypt = require('bcrypt');

class InstituicaoCRUD{

  // hashing not implemented yet
  instituicaoLogin(email, password) {
    return new Promise(async (resolve, reject) => {
      try{
        const pool = await db.getConnection();
        const result = await pool.request()
          .input("email", sql.VarChar, email)
          .query("SELECT * FROM FOCA.INSTITUICAO WHERE email=@email");
        if (result.recordset.length > 0){
          const correctPassword = await bcrypt.compare(password, result.recordset[0].senha_hash);
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

  createInstituicao(email, password, nome){
    return new Promise(async (resolve, reject ) =>{
      try{
        const saltNumber = 12;
        const encryptedPassword = await bcrypt.hash(password, saltNumber);
        const pool = await db.getConnection();
        const result = await pool.request()
        .input("email", sql.VarChar, email)
        .input("nome", sql.VarChar, nome)
        .input("password", sql.VarChar, encryptedPassword)
        .query("INSERT INTO FOCA.INSTITUICAO (EMAIL, NOME, SENHA_HASH) VALUES (@email, @nome, @password)")

        resolve();
      }
      catch(error){
        reject(error);
      }
    });
  }

}


module.exports = InstituicaoCRUD;
