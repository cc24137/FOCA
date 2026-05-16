const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');

class TurmaDisciplinaProfessorCRUD{

  async getByProfessor(idProfessor){
    try{
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("idProfessor", sql.Int, idProfessor)
        .query(`
          SELECT * FROM FOCA.Turma_Disciplina_Professor
          WHERE id_professor = @idProfessor
          `)
      return result.recordset;
    }
    catch(error) {throw error}
  }

  async create(idDisciplina, idTurma, idProfessor){
    try{
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("idDisciplina", sql.Int, idDisciplina)
        .input("idTurma", sql.Int, idTurma)
        .input("idProfessor", sql.Int, idProfessor)
        .query(`
          INSERT INTO FOCA.Turma_Disciplina_Professor 
          (ID_DISCIPLINA, ID_TURMA, ID_PROFESSOR)
          VALUES (@idDisciplina, @idTurma, @idProfessor)
          `)
    }
    catch (error) {throw error;}
  }

  async delete(id){
    try{
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
          DELETE FROM FOCA.Turma_Disciplina_Professor WHERE ID=@id
          `)
    }
    catch (error) {throw error;}
  }
}

module.exports = TurmaDisciplinaProfessorCRUD;
