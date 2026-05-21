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

  async update(id, nome, password) {
    try {
      const saltNumber = 12;
      const encryptedPassword = await bcrypt.hash(password, saltNumber);
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .input("nome", sql.VarChar, nome)
        .input("senha", sql.VarChar, encryptedPassword)
        .query(`UPDATE FOCA.INSTITUICAO SET nome = @nome, senha_hash = @senha WHERE id = @id`);
      if (result.rowsAffected[0] === 0) {
        const er = new Error(); er.name = "Not found"; throw er;
      }
    }
    catch (error) { throw error; }
  }

  async updateProfile(id, nome, senha) {
      try {
        const pool = await db.getConnection();
        const request = pool.request().input("id", sql.Int, id);
        let updateFields = [];
  
        if (nome) {
          request.input("nome", sql.VarChar, nome);
          updateFields.push("nome = @nome");
        }

        if (senha) {
          const saltNumber = 12;
          const encryptedPassword = await bcrypt.hash(senha, saltNumber);
          request.input("senha", sql.VarChar, encryptedPassword);
          updateFields.push("senha_hash = @senha");
        }

        if (updateFields.length === 0) return;
  
        const query = `UPDATE FOCA.INSTITUICAO SET ${updateFields.join(", ")} WHERE id = @id`;
        
        const result = await request.query(query);
  
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

  async inviteProfessor(id, email){
    try{
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .input("email", sql.VarChar, email)
        .query(`declare @idProfessor int
                select @idProfessor = id from foca.professor where email = @email

                IF @idProfessor IS NULL
                BEGIN
                    THROW 50001, 'Professor not found', 1;
                END

                INSERT INTO FOCA.INSTITUICAO_PROFESSOR
                (id_instituicao, professorAceitou, id_professor) VALUES
                (@id, 0, @idProfessor)`)
    }
    catch (error) { throw error; }
  }

  async removeProfessor(professorId, instituicaoId){
    try{
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("professorId", sql.Int, professorId)
        .input("instituicaoId", sql.Int, instituicaoId)
        .query(`delete from foca.instituicao_professor where (id_professor = @professorId and id_instituicao = @instituicaoId)`)
    }
    catch(error) {throw error;}
  }

}

module.exports = InstituicaoCRUD;
