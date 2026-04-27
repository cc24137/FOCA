const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');

// database access logic
class TurmaCRUD {

  async getTurmasByInstituicao(id_institution) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id_instituicao", sql.Int, id_institution)
        .query("SELECT * FROM FOCA.TURMA WHERE id_instituicao = @id_instituicao");
      return result.recordset;
    }
    catch (error) {
      throw error;
    }
  }

  async getTurmaById(id) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM FOCA.TURMA WHERE id = @id");
      if (result.recordset.length === 0) {
        const er = new Error();
        er.name = "Not found";
        throw er;
      }
      return result.recordset[0];
    }
    catch (error) {
      throw error;
    }
  }

  async createTurma(name, institutionId, studentCount, year) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("nome", sql.VarChar, name)
        .input("id_instituicao", sql.Int, institutionId)
        .input("numero_alunos", sql.Int, studentCount)
        .input("serie", sql.TinyInt, year)
        .query(`
          INSERT INTO FOCA.TURMA (nome, id_instituicao, numero_alunos, serie)
          OUTPUT INSERTED.id
          VALUES (@nome, @id_instituicao, @numero_alunos, @serie)
        `);
      return result.recordset[0].id;
    }
    catch (error) {
      throw error;
    }
  }

  async updateTurma(id, name, studentCount, year) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .input("nome", sql.VarChar, name)
        .input("numero_alunos", sql.Int, studentCount)
        .input("serie", sql.TinyInt, year)
        .query(`
          UPDATE FOCA.TURMA
          SET nome = @nome,
              numero_alunos = @numero_alunos,
              serie = @serie
          WHERE id = @id
        `);
      if (result.rowsAffected[0] === 0) {
        const er = new Error();
        er.name = "Not found";
        throw er;
      }
    }
    catch (error) {
      throw error;
    }
  }

  async deleteTurma(id) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .query("DELETE FROM FOCA.TURMA WHERE id = @id");
      if (result.rowsAffected[0] === 0) {
        const er = new Error();
        er.name = "Not found";
        throw er;
      }
    }
    catch (error) {
      throw error;
    }
  }
}

module.exports = TurmaCRUD;