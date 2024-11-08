import pandas as pd
import psycopg2
from psycopg2 import Error

db_config = {
    'host': 'localhost',
    'user': 'postgres',
    'password': 'pg,123',
    'database': 'pg_ferramenta_consulta'
}

valores_status_permitidos = ['Ativo', 'Inativo']

def atualizar_banco():
    connection = None
    cursor = None

    try:
        connection = psycopg2.connect(**db_config)

        
        print("Conexão ao Postgre bem-sucedida.")

        cursor = connection.cursor()

        # Ler o arquivo Excel
        df_colaborador = pd.read_excel("C:/Users/aflms/projeto_aplicado-web-server/public/colaborador.xlsx", engine='openpyxl')
        df_treinamentos = pd.read_excel("C:/Users/aflms/projeto_aplicado-web-server/public/treinamentos.xlsx", engine='openpyxl')
        df_colaborador_treinamentos = pd.read_excel("C:/Users/aflms/projeto_aplicado-web-server/public/colaborador_treinamentos.xlsx", engine='openpyxl')
        

        for _, row in df_colaborador.iterrows():
            try:
                cursor.execute("""
                    INSERT INTO Colaborador (nome, matricula, cargo)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (matricula) 
                    DO UPDATE SET nome = EXCLUDED.nome, cargo = EXCLUDED.cargo
                    """, (row['nome'], row['matricula'], row['cargo']))
            except Exception as e:
                print(f"Erro ao inserir colaborador {row['nome']}: {e}")
                # Se ocorrer um erro, corrigir a sequência
                cursor.execute("SELECT setval('colaborador_id_seq', (SELECT MAX(id) FROM Colaborador), false);")
                connection.commit()
            
        for _, row in df_treinamentos.iterrows():
            if row['status'] not in valores_status_permitidos:
                print(f"Status '{row['status']}' não é válido. Ignorando registro.")
                continue  # Pular este registro e seguir para o próximo

            cursor.execute("""SELECT id FROM Treinamentos WHERE nome_treinamentos = %s AND exigido_para_funcao = %s""",
                            (row['nome_treinamentos'], row['exigido_para_funcao']))
            existing_record = cursor.fetchone()

            if existing_record:
                cursor.execute("""UPDATE Treinamentos SET
                                    nome_treinamentos = %s,
                                    exigido_para_funcao = %s,
                                    validade_em_anos = %s,
                                    status = %s
                                WHERE id = %s""",
                                (row['nome_treinamentos'], row['exigido_para_funcao'], row['validade_em_anos'], row['status'], existing_record[0]))
            else:
                cursor.execute("""INSERT INTO Treinamentos (nome_treinamentos, exigido_para_funcao, validade_em_anos, status)
                                    VALUES (%s, %s, %s, %s)""",
                                (row['nome_treinamentos'], row['exigido_para_funcao'], row['validade_em_anos'], row['status']))

        for _, row in df_colaborador_treinamentos.iterrows():
            cursor.execute("""SELECT id FROM Colaborador_Treinamentos WHERE colaborador_id = %s AND treinamentos_id = %s""",
                (row['colaborador_id'], row['treinamentos_id']))
            existing_record = cursor.fetchone()

            if existing_record:
                cursor.execute("""UPDATE Colaborador_Treinamentos SET
                                    data_conclusao = %s,
                                    validade = %s,
                                    status = %s
                                WHERE id = %s""",
                                (row['data_conclusao'], row['validade'], row['status'], existing_record[0]))
            else:
                cursor.execute("""INSERT INTO Colaborador_Treinamentos (colaborador_id, treinamentos_id, data_conclusao, validade, status)
                                    VALUES (%s, %s, %s, %s, %s)""",
                                (row['colaborador_id'], row['treinamentos_id'], row['data_conclusao'], row['validade'], row['status']))
                
        connection.commit()
        print("Todas as alterações foram confirmadas no banco de dados.")

    except Error as e:
        print(f"Erro ao conectar ao Postgre: {e}")

    finally:
        if cursor is not None:  # Verifica se o cursor foi criado
            cursor.close()
        if connection is not None and not connection.closed:
            connection.close()
            print("Conexão com Postgre fechada.")

atualizar_banco()