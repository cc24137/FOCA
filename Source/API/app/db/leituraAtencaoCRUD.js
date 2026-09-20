const db = require('../../config/dbConfig');
const { sql } = require('../../config/dbConfig');

class LeituraAtencaoCRUD {

    async create(idAula, segundoVideo, indiceAtencao) {
        try {
            const pool = await db.getConnection();
    
            const result = await pool.request()
                .input("idAula", sql.Int, idAula)
                .input("segundoVideo", sql.Int, segundoVideo)
                .input(
                    "indiceAtencao",
                    sql.Decimal(5, 2),
                    indiceAtencao
                )
                .query(`
                    INSERT INTO FOCA.Leitura_Atencao (
                        id_aula,
                        segundo_video,
                        indice_atencao
                    )
                    OUTPUT
                        INSERTED.id_aula AS idAula,
                        INSERTED.segundo_video AS segundoVideo,
                        INSERTED.indice_atencao AS indiceAtencao
                    VALUES (
                        @idAula,
                        @segundoVideo,
                        @indiceAtencao
                    )
                `);
    
            return result.recordset[0];
        }
        catch (error) {
            throw error;
        }
    }

    async createMany(idAula, leituras) {
        const pool = await db.getConnection();
    
        const transaction = new sql.Transaction(pool);
    
        try {
          await transaction.begin();
    
          const table = new sql.Table("FOCA.Leitura_Atencao");
    
          table.create = false;
    
          table.columns.add(
            "id_aula",
            sql.Int,
            { nullable: false }
          );
    
          table.columns.add(
            "segundo_video",
            sql.Int,
            { nullable: false }
          );
    
          table.columns.add(
            "indice_atencao",
            sql.Decimal(5, 2),
            { nullable: false }
          );
    
          for (const leitura of leituras) {
            table.rows.add(
              idAula,
              leitura.segundoVideo,
              leitura.indiceAtencao
            );
          }
    
          const request = new sql.Request(transaction);
    
          await request.bulk(table, {
                fireTriggers: true,
                checkConstraints: true
            });
    
          await transaction.commit();
    
          return {
            idAula,
            quantidadeInserida: leituras.length
          };
        }
        catch (error) {
          await transaction.rollback();
          throw error;
        }
    }
    
      async getByIdAula(idAula) {
        try {
          const pool = await db.getConnection();
    
          const result = await pool.request()
            .input("idAula", sql.Int, idAula)
            .query(`
              SELECT
                l.id_aula AS idAula,
                l.segundo_video AS segundoVideo,
                l.indice_atencao AS indiceAtencao
              FROM FOCA.Leitura_Atencao l
              WHERE l.id_aula = @idAula
              ORDER BY l.segundo_video ASC
            `);
    
          return result.recordset;
        }
        catch (error) {
          throw error;
        }
      }

    async getByIdAula(idAula) {
        try {
            const pool = await db.getConnection();
    
            const result = await pool.request()
                .input("idAula", sql.Int, idAula)
                .query(`
                    SELECT
                        l.id_aula AS idAula,
                        l.segundo_video AS segundoVideo,
                        l.indice_atencao AS indiceAtencao
                    FROM FOCA.Leitura_Atencao l
                    WHERE l.id_aula = @idAula
                    ORDER BY l.segundo_video ASC
                `);
    
            return result.recordset;
        }
        catch (error) {
            throw error;
        }
    }
    
    async getByIdAulaESegundoVideo(idAula, segundoVideo) {
        try {
            const pool = await db.getConnection();
    
            const result = await pool.request()
                .input("idAula", sql.Int, idAula)
                .input("segundoVideo", sql.Int, segundoVideo)
                .query(`
                    SELECT
                        l.id_aula AS idAula,
                        l.segundo_video AS segundoVideo,
                        l.indice_atencao AS indiceAtencao
                    FROM FOCA.Leitura_Atencao l
                    WHERE l.id_aula = @idAula
                      AND l.segundo_video = @segundoVideo
                `);
    
            return result.recordset;
        }
        catch (error) {
            throw error;
        }
    }
}

module.exports = LeituraAtencaoCRUD;