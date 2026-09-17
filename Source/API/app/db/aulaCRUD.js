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

    async getById(id) {
        try {
            const pool = await db.getConnection();
    
            const result = await pool.request()
                .input("id", sql.Int, id)
                .query(`
                    SELECT
                        a.id AS id,
                        a.data AS date,
                        a.conteudo AS content,
                        a.id_turma_disciplina_professor AS classSubjectTeacherId,
                        a.id_classificacao_conteudo AS contentClassificationId,
                        a.arquivo_video AS videoFile,
                        a.media_atencao_total AS totalAttentionAverage,
                        a.data_processamento AS processingDate,
                        c.nome AS contentClassificationName
                    FROM FOCA.Aula a
                    LEFT JOIN FOCA.Classificacao_Conteudo c
                        ON a.id_classificacao_conteudo = c.id
                    WHERE a.id = @id
                `);
    
            return result.recordset[0] ?? null;
        }
        catch (error) {
            throw error;
        }
    }

    async getPreviousProcessedLessonsByAulaId(
        aulaId,
        limit = 5
    ) {
        try {
            const pool = await db.getConnection();
    
            const result = await pool.request()
                .input("aulaId", sql.Int, aulaId)
                .input("limit", sql.Int, limit)
                .query(`
                    WITH AulaAtual AS (
                        SELECT
                            id,
                            data,
                            id_turma_disciplina_professor
                        FROM FOCA.Aula
                        WHERE id = @aulaId
                    )
    
                    SELECT TOP (@limit)
                        a.id AS id,
                        a.data AS date,
                        a.media_atencao_total AS totalAttentionAverage,
                        a.id_classificacao_conteudo AS contentClassificationId,
                        a.data_processamento AS processingDate
                    FROM FOCA.Aula a
                    INNER JOIN AulaAtual atual
                        ON a.id_turma_disciplina_professor =
                           atual.id_turma_disciplina_professor
                    WHERE
                        a.id <> atual.id
                        AND a.media_atencao_total IS NOT NULL
                        AND (
                            a.data < atual.data
                            OR (
                                a.data = atual.data
                                AND a.id < atual.id
                            )
                        )
                    ORDER BY
                        a.data DESC,
                        a.id DESC
                `);
    
            return result.recordset;
        }
        catch (error) {
            throw error;
        }
    }
    
    async create(data, conteudo, idTurmaDisciplinaProfessor, idContentClassification) {
        try {
            const pool = await db.getConnection();
    
            const result = await pool.request()
                .input("data", sql.Date, data)
                .input("conteudo", sql.VarChar(350), conteudo)
                .input(
                    "idTurmaDisciplinaProfessor",
                    sql.Int,
                    idTurmaDisciplinaProfessor
                )
                .input("id_classificacao_conteudo", sql.Int, idContentClassification)
                .query(`
                    INSERT INTO FOCA.AULA (
                        data,
                        conteudo,
                        id_turma_disciplina_professor,
                        id_classificacao_conteudo
                    )
                    OUTPUT INSERTED.id
                    VALUES (
                        @data,
                        @conteudo,
                        @idTurmaDisciplinaProfessor,
                        @id_classificacao_conteudo
                    )
                `);
    
            return result.recordset[0].id;
        }
        catch (error) {
            throw error;
        }
    }

    async updateAnalysisData(
        id,
        idClassificacaoConteudo,
        arquivoVideo,
        mediaAtencaoTotal
    ) {
        try {
            const pool = await db.getConnection();
    
            const result = await pool.request()
                .input("id", sql.Int, id)
                .input(
                    "idClassificacaoConteudo",
                    sql.Int,
                    idClassificacaoConteudo
                )
                .input(
                    "arquivoVideo",
                    sql.VarChar(255),
                    arquivoVideo
                )
                .input(
                    "mediaAtencaoTotal",
                    sql.Decimal(5, 2),
                    mediaAtencaoTotal
                )
                .query(`
                    UPDATE FOCA.Aula
                    SET
                        id_classificacao_conteudo = @idClassificacaoConteudo,
                        arquivo_video = @arquivoVideo,
                        media_atencao_total = @mediaAtencaoTotal,
                        data_processamento = CAST(GETDATE() AS DATE)
                    OUTPUT
                        INSERTED.id AS id,
                        INSERTED.data AS date,
                        INSERTED.conteudo AS content,
                        INSERTED.id_turma_disciplina_professor AS classSubjectTeacherId,
                        INSERTED.id_classificacao_conteudo AS contentClassificationId,
                        INSERTED.arquivo_video AS videoFile,
                        INSERTED.media_atencao_total AS totalAttentionAverage,
                        INSERTED.data_processamento AS processingDate
                    WHERE id = @id
                `);
    
            if (result.recordset.length === 0) {
                const error = new Error("Aula not found");
                error.name = "Not found";
                throw error;
            }
    
            return result.recordset[0];
        }
        catch (error) {
            throw error;
        }
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

    async getAllClassificacaoConteudo() {
        try {
            const pool = await db.getConnection();
            const result = await pool.request()
                .query(`SELECT 
                    c.id AS idClassificacaoConteudo,
                    c.nome AS nomeClassificacaoConteudo,
                    c.descricao AS descricaoClassificacaoConteudo
                    FROM FOCA.Classificacao_Conteudo c`);
            return result.recordset;
        }
        catch (error) { throw error; }
    }

    async getByInstituicao(instituicaoId) {
        try {
            const pool = await db.getConnection();
            const result = await pool.request()
                .input("instituicaoId", sql.Int, instituicaoId)
                .query(`SELECT 
                    a.*, 
                    c.nome AS nome_classificacao 
                    FROM FOCA.AULA a
                    LEFT JOIN FOCA.Classificacao_Conteudo c 
                        ON a.id_classificacao_conteudo = c.id
                    WHERE a.id_turma_disciplina_professor IN (
                        SELECT tdp.id 
                        FROM FOCA.Turma_Disciplina_Professor tdp
                        INNER JOIN FOCA.Turma t ON tdp.id_turma = t.id
                        WHERE t.id_instituicao = @instituicaoId
                    )`);
            return result.recordset;
        }
        catch (error) { throw error; }
    }
}

module.exports = AulaCRUD;