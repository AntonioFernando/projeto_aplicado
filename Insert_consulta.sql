use Bd_ferramenta_consulta;
INSERT INTO Colaborador (nome, matricula, cargo) VALUES 
('Joao da Silva','12345','Operador de Maquinas'),
('Maria Oliveira','12346','Tecnico de Seguranca'),
('Carlos Santos','12347','Operador de Tratores'),
('Ana Pereira', '12348', 'Supervisor de Campo'),
('Lucas Almeida','12349','Assistente Administrativo');

use Bd_ferramenta_consulta;
INSERT INTO Treinamentos (nome_treinamentos, exigido_para_funcao, validade_em_anos, status) VALUES
('Seguranca no Trabalho', 'Operador de Maquinas', 2, 'Ativo'),
('Primeiros Socorros', 'Tecnico de Seguranca', 1, 'Ativo'),
('Manuseio de Tratores', 'Operador de Tratores', 3, 'Ativo'),
('Normas de Seguranca', 'Supervisor de Campo', 0, 'Ativo'),
('Treinamento Administrativo', 'Assistente Administrativo', 1, 'Inativo');

use Bd_ferramenta_consulta;
INSERT INTO Colaborador_Treinamentos (colaborador_id, treinamentos_id, data_conclusao, validade, status) VALUES
(1, 1, '2023-01-15', '2025-01-15', 'Completo'),
(2, 2, '2022-02-10', '2023-02-10', 'Vencido'),
(3, 3, '2021-03-20', '2024-03-20', 'Completo'),
(4, 4, '2022-05-10', '2023-05-10', 'Pendente'),
(5, 5, '2021-06-20', '2023-06-10', 'Pendente');