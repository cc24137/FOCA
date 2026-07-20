const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');
const bcrypt = require('bcrypt');

// database acess logic
class ProfessorCRUD {

  async getProfessorByInstitution(institutionId) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("institutionId", sql.Int, institutionId)
        .query(`
          select * from foca.professor p
          inner join foca.Instituicao_Professor ip on ip.id_professor = p.id
          where (ip.id_instituicao =  @institutionId and ip.professorAceitou=1)
          `);
      return result.recordset;
    }
    catch (error) {
      throw error;
    }
  }

  async getInfoProfessorByInstituicao(id_institution){
    try{
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id_institution)
        .query(`
            SELECT P.id, P.nome, P.email, T.NOME as turma, D.NOME AS disciplina, sub.MEDIA_ATENCAO as media_atencao FROM FOCA.PROFESSOR P
            LEFT JOIN FOCA.Turma_Disciplina_Professor TDP ON P.ID = TDP.ID_PROFESSOR
            LEFT JOIN FOCA.DISCIPLINA D ON D.ID = TDP.ID_DISCIPLINA
            LEFT JOIN FOCA.TURMA T ON T.ID = TDP.ID_TURMA
            LEFT JOIN FOCA.INSTITUICAO_PROFESSOR IP ON IP.ID_PROFESSOR = P.ID
            LEFT JOIN (
            	SELECT A.ID_TURMA_DISCIPLINA_PROFESSOR AS ID_TDP, AVG(A.MEDIA_ATENCAO_TOTAL) AS MEDIA_ATENCAO 
            	FROM FOCA.AULA A
            	GROUP BY A.ID_TURMA_DISCIPLINA_PROFESSOR 
            ) sub
            ON TDP.ID = sub.ID_TDP
            WHERE IP.ID_INSTITUICAO = @id
          `)
      return result.recordset;
    }
    catch(error){
      throw error;
    }
  }

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
        .query("INSERT INTO FOCA.PROFESSOR (EMAIL, NOME, SENHA_HASH, emailVerificado) VALUES (@email, @nome, @password, 0)")
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

  async update(id, nome, password) {
    try {
      const saltNumber = 12;
      const encryptedPassword = await bcrypt.hash(password, saltNumber);
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .input("nome", sql.VarChar, nome)
        .input("senha", sql.VarChar, encryptedPassword)
        .query(`UPDATE FOCA.PROFESSOR SET nome = @nome, senha_hash = @senha WHERE id = @id`);
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
  
        const query = `UPDATE FOCA.PROFESSOR SET ${updateFields.join(", ")} WHERE id = @id`;
        
        const result = await request.query(query);
  
        if (result.rowsAffected[0] === 0) {
          const er = new Error(); er.name = "Not found"; throw er;
        }
      }
      catch (error) { throw error; }
    }

  async getInstitutionLinks(idProfessor){
      try{
        const pool = await db.getConnection();
        const result = await pool.request()
        .input("idProfessor", sql.Int, idProfessor)
        .query(`
          SELECT
              i.id,
              i.nome,
              ip.professorAceitou,
              COUNT(DISTINCT tdp.id_turma) AS turmas
          FROM FOCA.INSTITUICAO_PROFESSOR ip
          INNER JOIN FOCA.INSTITUICAO i ON i.id = ip.id_instituicao
          LEFT JOIN FOCA.Turma t ON t.id_instituicao = i.id
          LEFT JOIN FOCA.Turma_Disciplina_Professor tdp
              ON tdp.id_turma = t.id AND tdp.id_professor = ip.id_professor
          WHERE ip.id_professor = @idProfessor
          GROUP BY i.id, i.nome, ip.professorAceitou
        `);
        return result.recordset;
      }
      catch(error){
        throw error;
      }
    }

    async delete(id) {
      try {
        const pool = await db.getConnection();
        const result = await pool.request()
          .input("id", sql.Int, id)
          .query("DELETE FROM FOCA.PROFESSOR WHERE id = @id");
        if (result.rowsAffected[0] === 0) {
          const er = new Error(); er.name = "Not found"; throw er;
        }
      }
      catch (error) { throw error; }
    }

    async denyInvitation(idInstituicao, idProfesor) {
    try{
      const pool = await db.getConnection();
      const result = await pool.request()
      .input("idInstituicao", sql.Int, idInstituicao)
      .input("idProfessor", sql.Int, idProfesor)
      .query(`DELETE FROM FOCA.INSTITUICAO_PROFESSOR
        WHERE ID_INSTITUICAO=@idInstituicao and id_professor=@idProfessor`);
    }
    catch(error){
      throw error;
    }
  }

  async accepetInvitation(idInstituicao, idProfesor){
    try{
      const pool = await db.getConnection();
      const result = await pool.request()
      .input("idInstituicao", sql.Int, idInstituicao)
      .input("idProfessor", sql.Int, idProfesor)
      .query(`UPDATE FOCA.INSTITUICAO_PROFESSOR set professorAceitou=1
        WHERE ID_INSTITUICAO=@idInstituicao and id_professor=@idProfessor`)
    }
    catch (error) { throw error; }
  }
}

module.exports = ProfessorCRUD;
