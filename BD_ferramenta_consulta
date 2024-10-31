create database BD_ferramenta_consulta;
use BD_ferramenta_consulta;

CREATE TABLE Colaboradores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(60) NOT NULL,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    cargo VARCHAR(60) NOT NULL
);

use BD_ferramenta_consulta;
CREATE TABLE Treinamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome_treinamento VARCHAR(100) NOT NULL,
    exigido_para_funcao VARCHAR(100) NOT NULL,
    validade_em_anos INT DEFAULT 0,
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo'
);

use BD_ferramenta_consulta;
CREATE TABLE Colaboradores_Treinamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    colaborador_id INT NOT NULL,
    treinamento_id INT NOT NULL,
    data_conclusao DATE NOT NULL,
    validade DATE NOT NULL,
    status ENUM('Completo', 'Pendente', 'Vencido') NOT NULL,
    CHECK (status IN ('Completo', 'Pendente', 'Vencido')),
    FOREIGN KEY (colaborador_id) REFERENCES Colaboradores(id),
    FOREIGN KEY (treinamento_id) REFERENCES Treinamentos(id)
);

