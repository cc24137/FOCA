CREATE TABLE foca.Professor 
(
    id INT PRIMARY KEY IDENTITY(1, 1),  
    email VARCHAR(100),  
    nome VARCHAR(100) NOT NULL,  
    senha_hash VARCHAR(255) NOT NULL,  
    emailVerificado BIT DEFAULT 0,
    CHECK (email LIKE '%@%'),
    UNIQUE (email)
);

CREATE TABLE foca.Instituicao
(
    id INT PRIMARY KEY IDENTITY(1, 1),  
    nome VARCHAR(100) NOT NULL,  
    senha_hash VARCHAR(255) NOT NULL,  
    email VARCHAR(100),  
    emailVerificado BIT DEFAULT 0,
    UNIQUE (nome),
    UNIQUE (email)
);

CREATE TABLE foca.Turma
(
    id INT PRIMARY KEY IDENTITY(1, 1),  
    nome VARCHAR(100),  
    id_instituicao INT,  
    numero_alunos INT,  
    serie TINYINT
);

CREATE TABLE foca.Disciplina
(
    id INT PRIMARY KEY IDENTITY(1, 1),  
    nome VARCHAR(100) NOT NULL,  
    id_instituicao INT
);

CREATE TABLE foca.Turma_Disciplina_Professor
(
    id INT PRIMARY KEY IDENTITY(1, 1),  
    id_disciplina INT,  
    id_turma INT,  
    id_professor INT
);

CREATE TABLE foca.Instituicao_Professor
(
    id_instituicao INT,  
    id_professor INT,
    professorAceitou BIT DEFAULT 0
);

CREATE TABLE foca.Classificacao_Conteudo
(
    id INT PRIMARY KEY IDENTITY(1, 1),
    nome VARCHAR(100) NOT NULL, -- Ex: 'Explicação Teórica', 'Prova', 'Apresentação'
    descricao VARCHAR(255)
);

CREATE TABLE foca.Aula
(
    id INT PRIMARY KEY IDENTITY(1, 1),  
    data DATE NOT NULL,  
    conteudo VARCHAR(350),  
    id_turma_disciplina_professor INT NOT NULL,
    id_classificacao_conteudo INT,
    -- dados do relatorio
    arquivo_video VARCHAR(255),
    media_atencao_total DECIMAL(5,2),  
    data_processamento DATE
);

CREATE TABLE foca.Leitura_Atencao
(
    id_aula INT NOT NULL,
    segundo_video INT NOT NULL, -- Ex: 5, 10, 15... (segundos desde o início da aula)
    indice_atencao DECIMAL(5,2) NOT NULL, -- Ex: 85.50
    PRIMARY KEY (id_aula, segundo_video) -- Chave primária composta
);

CREATE TABLE foca.Codigo_Verificacao
(
    id INT PRIMARY KEY IDENTITY(1, 1),
    o_codigo CHAR(6),
    email VARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExpiresAt DATETIME NOT NULL
);

-- chaves estrangeiras

ALTER TABLE foca.Turma ADD FOREIGN KEY(id_instituicao) REFERENCES foca.Instituicao (id);
ALTER TABLE foca.Disciplina ADD FOREIGN KEY(id_instituicao) REFERENCES foca.Instituicao (id);

ALTER TABLE foca.Turma_Disciplina_Professor ADD FOREIGN KEY(id_disciplina) REFERENCES foca.Disciplina (id);
ALTER TABLE foca.Turma_Disciplina_Professor ADD FOREIGN KEY(id_turma) REFERENCES foca.Turma (id);
ALTER TABLE foca.Turma_Disciplina_Professor ADD FOREIGN KEY(id_professor) REFERENCES foca.Professor (id);

ALTER TABLE foca.Instituicao_Professor ADD FOREIGN KEY(id_instituicao) REFERENCES foca.Instituicao (id);
ALTER TABLE foca.Instituicao_Professor ADD FOREIGN KEY(id_professor) REFERENCES foca.Professor (id);

ALTER TABLE foca.Aula ADD FOREIGN KEY(id_turma_disciplina_professor) REFERENCES foca.Turma_Disciplina_Professor (id);
ALTER TABLE foca.Aula ADD FOREIGN KEY(id_classificacao_conteudo) REFERENCES foca.Classificacao_Conteudo (id);

ALTER TABLE foca.Leitura_Atencao ADD FOREIGN KEY(id_aula) REFERENCES foca.Aula (id);
