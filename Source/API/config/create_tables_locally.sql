
CREATE TABLE foca.Professor 
(
 id INT PRIMARY KEY identity(1, 1),  
 email VARCHAR(100),  
 nome VARCHAR(100) NOT NULL,  
 senha_hash VARCHAR(255) NOT NULL,  
 emailVerificado bit default 0,
 CHECK (email LIKE '%@%'),
 UNIQUE (email)
);

CREATE TABLE foca.Turma
(
 id INT PRIMARY KEY identity(1, 1),  
 nome VARCHAR(100),  
 id_instituicao INT,  
 numero_alunos INT,  
 ano TINYINT,
);

CREATE TABLE foca.Disciplina
(
 id INT PRIMARY KEY identity(1, 1),  
 nome VARCHAR(100) NOT NULL,  
 id_instituicao INT,  
);

CREATE TABLE foca.Relatorio
(
 id_aula INT,  
 id INT PRIMARY KEY identity(1, 1),  
 media_atencao_total FLOAT,  
 data_processamento DATE,  
);

CREATE TABLE foca.Aula
(
 id INT PRIMARY KEY identity(1, 1),  
 data DATE NOT NULL,  
 conteudo VARCHAR(350),  
 id_turma_disciplina_professor INT
);

CREATE TABLE foca.Instituicao
(
 id INT PRIMARY KEY identity(1, 1),  
 nome VARCHAR(100) NOT NULL,  
 senha_hash VARCHAR(255) NOT NULL,  
 email VARCHAR(100),  
 emailVerificado bit default 0,
 UNIQUE (nome),
 unique (email)
);

CREATE TABLE foca.Instituicao_Professor
(
 id_instituicao INT,  
 id_professor INT,  
);

CREATE TABLE foca.MomentoDestaque
(
 id INT PRIMARY KEY identity(1, 1),  
 percentual_atencao FLOAT,  
 id_relatorio INT,  
 tempo_inicio TIME,  
 tempo_fim TIME,  
);

CREATE TABLE foca.Turma_Disciplina_Professor
(
 id_disciplina INT,  
 id_turma INT,  
 id_professor INT,  
 id INT PRIMARY KEY identity(1, 1),  
);

CREATE TABLE foca.Codigo_Verificacao
(
 id INT PRIMARY KEY IDENTITY(1, 1),
 o_codigo CHAR(6),
 email VARCHAR(100)
 CreatedAt DATETIME DEFAULT GETDATE(),
 ExpiresAt DATETIME NOT NULL,
);


ALTER TABLE foca.Turma ADD FOREIGN KEY(id_instituicao) REFERENCES foca.Instituicao (id);
ALTER TABLE foca.Disciplina ADD FOREIGN KEY(id_instituicao) REFERENCES foca.Instituicao (id);
ALTER TABLE foca.Relatorio ADD FOREIGN KEY(id_aula) REFERENCES foca.Aula (id);
ALTER TABLE foca.Aula ADD FOREIGN KEY(id_turma_disciplina_professor) REFERENCES foca.Turma_Disciplina_Professor (id);
ALTER TABLE foca.Instituicao_Professor ADD FOREIGN KEY(id_instituicao) REFERENCES foca.Instituicao (id);
ALTER TABLE foca.Instituicao_Professor ADD FOREIGN KEY(id_professor) REFERENCES foca.Professor (id);
ALTER TABLE foca.MomentoDestaque ADD FOREIGN KEY(id_relatorio) REFERENCES foca.Relatorio (id);
ALTER TABLE foca.Turma_Disciplina_Professor ADD FOREIGN KEY(id_disciplina) REFERENCES foca.Disciplina (id);
ALTER TABLE foca.Turma_Disciplina_Professor ADD FOREIGN KEY(id_turma) REFERENCES foca.Turma (id);
ALTER TABLE foca.Turma_Disciplina_Professor ADD FOREIGN KEY(id_professor) REFERENCES foca.Professor (id);

EXEC sp_rename 'foca.MomentoDestaque', 'Momento_Destaque';

