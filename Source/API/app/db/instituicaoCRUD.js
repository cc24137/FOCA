const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');

class InstituicaoCRUD{

  // hashing not implemented yet
    instituicaoLogin(email, password) {
      return new Promise(async (resolve, reject) => {
        try{
          const pool = await db.getConnection();
          const result = await pool.request()
            .input("email", sql.VarChar, email)
            .input("password", sql.VarChar, password)
            .query("SELECT * FROM FOCA.INSTITUICAO WHERE email=@email AND senha_hash=@password");
          if (result.recordset.length > 0){
            resolve(result.recordset);
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


}


module.exports = InstituicaoCRUD;
