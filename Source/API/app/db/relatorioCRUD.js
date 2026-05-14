const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');

class RelatorioCRUD {

  async create(idAula, mediaAtencaoTotal, dataProcessamento) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("idAula", sql.Int, idAula)
        .input("mediaAtencaoTotal", sql.Float, mediaAtencaoTotal)
        .input("dataProcessamento", sql.Date, dataProcessamento)
        .query(`INSERT INTO FOCA.RELATORIO (id_aula, media_atencao_total, data_processamento)
                OUTPUT INSERTED.id
                VALUES (@idAula, @mediaAtencaoTotal, @dataProcessamento)`);
      return result.recordset[0].id;
    }
    catch (error) { throw error; }
  }
}

module.exports = RelatorioCRUD;