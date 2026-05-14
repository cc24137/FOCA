
CREATE OR ALTER TRIGGER trg_InsteadOfDelete_Relatorio
ON foca.Relatorio
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM deleted) RETURN;


    DELETE md
    FROM foca.Momento_Destaque md
    INNER JOIN deleted d ON md.id_relatorio = d.id;


    DELETE r
    FROM foca.Relatorio r
    INNER JOIN deleted d ON r.id = d.id;
END;
GO



CREATE OR ALTER TRIGGER trg_InsteadOfDelete_Aula
ON foca.Aula
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM deleted) RETURN;


    DELETE r
    FROM foca.Relatorio r
    INNER JOIN deleted d ON r.id_aula = d.id;


    DELETE a
    FROM foca.Aula a
    INNER JOIN deleted d ON a.id = d.id;
END;
GO



CREATE OR ALTER TRIGGER trg_InsteadOfDelete_TurmaDisciplinaProf
ON foca.Turma_Disciplina_Professor
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM deleted) RETURN;


    DELETE a
    FROM foca.Aula a
    INNER JOIN deleted d ON a.id_turma_disciplina_professor = d.id;


    DELETE tdp
    FROM foca.Turma_Disciplina_Professor tdp
    INNER JOIN deleted d ON tdp.id = d.id;
END;
GO


CREATE OR ALTER TRIGGER trg_InsteadOfDelete_Turma
ON foca.Turma
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM deleted) RETURN;


    DELETE tdp
    FROM foca.Turma_Disciplina_Professor tdp
    INNER JOIN deleted d ON tdp.id_turma = d.id;


    DELETE t
    FROM foca.Turma t
    INNER JOIN deleted d ON t.id = d.id;
END;
GO


CREATE OR ALTER TRIGGER trg_InsteadOfDelete_Disciplina
ON foca.Disciplina
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM deleted) RETURN;

    DELETE tdp
    FROM foca.Turma_Disciplina_Professor tdp
    INNER JOIN deleted d ON tdp.id_disciplina = d.id;

    DELETE disc
    FROM foca.Disciplina disc
    INNER JOIN deleted d ON disc.id = d.id;
END;
GO



CREATE OR ALTER TRIGGER trg_InsteadOfDelete_Professor
ON foca.Professor
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM deleted) RETURN;

    DELETE ip
    FROM foca.Instituicao_Professor ip
    INNER JOIN deleted d ON ip.id_professor = d.id;

    DELETE tdp
    FROM foca.Turma_Disciplina_Professor tdp
    INNER JOIN deleted d ON tdp.id_professor = d.id;

    DELETE p
    FROM Professor p
    INNER JOIN deleted d ON p.id = d.id;
END;
GO



CREATE OR ALTER TRIGGER trg_InsteadOfDelete_Instituicao
ON foca.Instituicao
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM deleted) RETURN;

    DELETE t
    FROM foca.Turma t
    INNER JOIN deleted d ON t.id_instituicao = d.id;

    DELETE disc
    FROM foca.Disciplina disc
    INNER JOIN deleted d ON disc.id_instituicao = d.id;

    DELETE ip
    FROM foca.Instituicao_Professor ip
    INNER JOIN deleted d ON ip.id_instituicao = d.id;

    DELETE inst
    FROM foca.Instituicao inst
    INNER JOIN deleted d ON inst.id = d.id;
END;
GO




CREATE OR ALTER TRIGGER trg_insert_instituicao
ON foca.instituicao
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN foca.professor p
            ON p.email = i.email
    )
    BEGIN
        THROW 50001, 'Já existe um professor com esse email.', 1;
    END

    INSERT INTO foca.instituicao (email, nome, senha_hash, emailVerificado)
    SELECT email, nome, senha_hash, emailVerificado
    FROM inserted;
END



CREATE OR ALTER TRIGGER trg_insert_professor
ON foca.professor
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN foca.instituicao p
            ON p.email = i.email
    )
    BEGIN
        THROW 50001, 'Já existe uma instituicao com esse email.', 1;
    END

    INSERT INTO foca.professor (email, nome, senha_hash, emailVerificado)
    SELECT email, nome, senha_hash, emailVerificado
    FROM inserted;
END








