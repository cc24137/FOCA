const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');

class LeituraAtencaoCRUD {

  async create(idAula, segundoVideo, indiceAtencao) {
    try {
      const pool = await db.getConnection();
      const result = await pool.request()
        .input("idAula", sql.Int, idAula)
        .input("segundoVideo", sql.Int, segundoVideo)
        .input("indiceAtencao", sql.Decimal, indiceAtencao)
        .query(`INSERT INTO FOCA.Leitura_Atencao (id_aula, segundo_video, indice_atencao)
                OUTPUT INSERTED.id_aula, INSERTED.segundo_video, INSERTED.indice_atencao
                VALUES (@idAula, @segundoVideo, @indiceAtencao)`);
      return result.recordset[0];
    }
    catch (error) { throw error; }
  }

    async getByIdAula(idAula) {
        try {
          const pool = await db.getConnection();
          const result = await pool.request()
            .input("idAula", sql.Int, idAula)
              .query(`SELECT l.id_aula AS idAulal.segundo_video AS segundoVideo, l.indice_atencao AS indiceAtencao 
                  FROM FOCA.Leitura_Atencao l
                  WHERE id_aula = @idAula`);
          return result.recordset;
        }
        catch (error) { throw error; }
    }
    async getByIdAulaESegundoVideo(idAula, segundoVideo) {
        try {
          const pool = await db.getConnection();
          const result = await pool.request()
              .input("idAula", sql.Int, idAula)
              .input("segundoVideo", sql.Int, segundoVideo)
              .query(`SELECT l.id_aula AS idAulal.segundo_video AS segundoVideo, l.indice_atencao AS indiceAtencao 
                  FROM FOCA.Leitura_Atencao l
                  WHERE id_aula = @idAula AND segundo_video = @segundoVideo`);
          return result.recordset;
        }
        catch (error) { throw error; }
    }
}

module.exports = LeituraAtencaoCRUD;