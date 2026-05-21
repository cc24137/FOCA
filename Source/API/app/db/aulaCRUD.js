const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');

class AulaCRUD {

    async getByLinkId(linkId) {
        try {
            const pool = await db.getConnection();
            const result = await pool.request()
                .input("id_turma_disciplina_professor", sql.Int, linkId)
                .query(`
                    SELECT 
                        a.*, 
                        c.nome AS nome_classificacao 
                    FROM FOCA.AULA a
                    LEFT JOIN FOCA.Classificacao_Conteudo c 
                        ON a.id_classificacao_conteudo = c.id
                    WHERE a.id_turma_disciplina_professor = @id_turma_disciplina_professor
                `);
            return result.recordset;
        }
        catch (error) { throw error; }
    }
    
  async create(data, conteudo, idTurmaDisciplinaProfessor) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("data", sql.Date, data)
        .input("conteudo", sql.VarChar, conteudo)
        .input("idTurmaDisciplinaProfessor", sql.Int, idTurmaDisciplinaProfessor)
        .query(`INSERT INTO FOCA.AULA (data, conteudo, id_turma_disciplina_professor)
                OUTPUT INSERTED.id
                VALUES (@data, @conteudo, @idTurmaDisciplinaProfessor)`);
      return result.recordset[0].id;
    }
    catch (error) { throw error; }
  }

  async delete(id) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .query("DELETE FROM FOCA.AULA WHERE id = @id");
      if (result.rowsAffected[0] === 0) {
        const er = new Error(); er.name = "Not found"; throw er;
      }
    }
    catch (error) { throw error; }
  }
}

module.exports = AulaCRUD;