const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');

// database access logic
class DisciplinaCRUD {

  async getDisciplinasByInstitution(institutionId) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("institutionId", sql.Int, institutionId)
        .query("SELECT * FROM FOCA.DISCIPLINA WHERE id_instituicao = @institutionId");
      return result.recordset;
    }
    catch (error) {
      throw error;
    }
  }

  async getDisciplinaById(id) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM FOCA.DISCIPLINA WHERE id = @id");
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

  async createDisciplina(name, institutionId) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("name", sql.VarChar, name)
        .input("institutionId", sql.Int, institutionId)
        .query(`
          INSERT INTO FOCA.DISCIPLINA (nome, id_instituicao)
          OUTPUT INSERTED.id
          VALUES (@name, @institutionId)
        `);
      return result.recordset[0].id;
    }
    catch (error) {
      throw error;
    }
  }

  async updateDisciplina(id, name) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .input("name", sql.VarChar, name)
        .query(`
          UPDATE FOCA.DISCIPLINA
          SET nome = @name
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

  async deleteDisciplina(id) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("id", sql.Int, id)
        .query("DELETE FROM FOCA.DISCIPLINA WHERE id = @id");
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

module.exports = DisciplinaCRUD;