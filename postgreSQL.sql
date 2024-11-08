CREATE DATABASE pg_ferramenta_consulta;
\c pg_ferramenta_consulta;

-- Tabela Colaborador
CREATE TABLE Colaborador (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(60) NOT NULL,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    cargo VARCHAR(60) NOT NULL
);

-- Tabela Treinamentos
CREATE TABLE Treinamentos (
    id SERIAL PRIMARY KEY,
    nome_treinamentos VARCHAR(100) NOT NULL,
    exigido_para_funcao VARCHAR(100) NOT NULL,
    validade_em_anos INT DEFAULT 0,
    status VARCHAR(10) CHECK (status IN ('Ativo', 'Inativo')) NOT NULL DEFAULT 'Ativo'
);

-- Tabela Colaborador_Treinamentos
CREATE TABLE Colaborador_Treinamentos (
    id SERIAL PRIMARY KEY,
    colaborador_id INT NOT NULL,
    treinamentos_id INT NOT NULL,
    data_conclusao DATE NOT NULL,
    validade DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('Completo', 'Pendente', 'Vencido')) NOT NULL,
    FOREIGN KEY (colaborador_id) REFERENCES Colaborador(id),
    FOREIGN KEY (treinamentos_id) REFERENCES Treinamentos(id)
);