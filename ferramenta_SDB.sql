Create database ferramenta_sdb character set utf8mb4;
use ferramenta_sdb;
CREATE TABLE Colaboradores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    matricula varchar(100) NOT NULL UNIQUE,
    nome varchar(100) not NULL,
    funcao varchar(100) NOT NULL
);
use ferramenta_sdb;
CREATE TABLE Treinamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome varchar(100) NOT NULL,
    descricao TEXT,
    obrigatorio BOOLEAN NOT NULL CHECK (obrigatorio IN (0, 1)) -- 0 para não, 1 para sim
);
use ferramenta_sdb;
CREATE TABLE Status_Treinamento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    colaborador_id INT,
    treinamento_id INT,
    situacao TEXT CHECK (situacao IN ('Em dia', 'Vencido', 'Não possui')),
    data_atualizacao DATE NOT NULL,
    FOREIGN KEY (colaborador_id) REFERENCES Colaboradores (id),
    FOREIGN KEY (treinamento_id) REFERENCES Treinamentos (id)
);
CREATE INDEX idx_matricula ON Colaboradores (matricula);
CREATE INDEX idx_nome ON Colaboradores (nome);

use ferramenta_sdb;
INSERT INTO Colaboradores (matricula, nome, funcao) VALUES 
('001', 'Ana Souza', 'Técnica de Segurança'),
('002', 'Carlos Lima', 'Operador de Máquinas'),
('003', 'Beatriz Santos', 'Supervisor de Campo'),
('004', 'João Pereira', 'Mecânico de Manutenção'),
('005', 'Mariana Oliveira', 'Engenheira Agrônoma');
use ferramenta_sdb;
INSERT INTO Treinamentos (nome, descricao, obrigatorio) VALUES 
('Treinamento de Segurança', 'Curso obrigatório de segurança no trabalho', 1),
('Treinamento de Primeiros Socorros', 'Curso de primeiros socorros', 1),
('Treinamento de Operação de Máquinas', 'Curso sobre operação segura de máquinas', 1),
('Treinamento de Manutenção Preventiva', 'Curso sobre manutenção de equipamentos', 0);

use ferramenta_sdb;
INSERT INTO Status_Treinamento (colaborador_id, treinamento_id, situacao, data_atualizacao) VALUES 
(1, 1, 'Em dia', '2024-01-15'),
(1, 2, 'Em dia', '2024-01-20'),
(2, 3, 'Vencido', '2023-12-10'),
(3, 1, 'Não possui', '2024-03-05'),
(4, 4, 'Em dia', '2024-02-28'),
(5, 1, 'Em dia', '2024-04-01'),
(5, 2, 'Vencido', '2023-11-30');


