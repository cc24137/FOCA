
const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');

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

  // hashing not implemented yet
  professorLogin(email, password) {
    return new Promise(async (resolve, reject) => {
      try{
        const pool = await db.getConnection();
        const result = await pool.request()
          .input("email", sql.VarChar, email)
          .input("password", sql.VarChar, password)
          .query("SELECT * FROM FOCA.PROFESSOR WHERE email=@email AND senha_hash=@password");
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



  // test route
  listProfessors() {
    return new Promise(async (resolve, reject) => {
      try {
        const pool = await db.getConnection(); 
        const result = await pool.request().query('SELECT * FROM FOCA.PROFESSOR'); 
      
        resolve(result.recordset);
      }
      catch(error){
        reject(error);
      }
    });
  }


}

module.exports = ProfessorCRUD;