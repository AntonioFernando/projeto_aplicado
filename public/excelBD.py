import pandas as pd
import mysql.connector
from mysql.connector import Error

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'mysql123',
    'database': 'BD_ferramenta_consulta'
}

def atualizar_banco():
    connection = None
    cursor = None

    try:
        connection = mysql.connector.connect(**db_config)

        if connection.is_connected():
            print("Conexão ao MySQL bem-sucedida.")

            cursor = connection.cursor()

            # Ler o arquivo Excel
            df_colaborador = pd.read_excel("C:/Users/aflms/OneDrive/Documentos/senai/UC - Projeto Aplicado/colaborador.xlsx", engine='openpyxl')
            df_colaborador = df_colaborador.drop_duplicates(subset='matricula')
            df_treinamentos = pd.read_excel("C:/Users/aflms/OneDrive/Documentos/senai/UC - Projeto Aplicado/treinamentos.xlsx", engine='openpyxl')
            df_colaborador_treinamentos = pd.read_excel("C:/Users/aflms/OneDrive/Documentos/senai/UC - Projeto Aplicado/colaborador_treinamentos.xlsx", engine='openpyxl')
            df_colaborador_treinamentos['data_conclusao'] = df_colaborador_treinamentos['data_conclusao'].dt.strftime('%Y-%m-%d')
            df_colaborador_treinamentos['validade'] = df_colaborador_treinamentos['validade'].dt.strftime('%Y-%m-%d')

            for _, row in df_colaborador.iterrows():
                cursor.execute("""INSERT INTO Colaborador (nome, matricula, cargo)
                            VALUES (%s, %s, %s)
                            ON DUPLICATE KEY UPDATE
                                nome = VALUES(nome),
                                cargo = VALUES(cargo)""",
                               (row['nome'], row['matricula'], row['cargo']))
                if cursor.rowcount > 0:
                    connection.commit()
                    print("Dados de colaborador atualizados no banco de dados.")
                
            for _, row in df_treinamentos.iterrows():
                cursor.execute("SELECT id FROM Treinamentos WHERE nome_treinamentos = %s AND exigido_para_funcao = %s",
                               (row['nome_treinamentos'], row['exigido_para_funcao']))
                existing_record = cursor.fetchone()

                if existing_record:
                    cursor.execute("""UPDATE Treinamentos SET
                                        validade_em_anos = %s,
                                        status = %s
                                   WHERE id = %s""",
                                   (row['validade_em_anos'], row['status'], existing_record[0]))
                    if cursor.rowcount > 0:
                        connection.commit()
                        print("Dados de treinamento atualizados no banco de dados.")
                else:
                    cursor.execute("""INSERT INTO Treinamentos (nome_treinamentos, exigido_para_funcao, validade_em_anos, status)
                                        VALUES (%s, %s, %s, %s)""",
                                    (row['nome_treinamentos'], row['exigido_para_funcao'], row['validade_em_anos'], row['status']))
                    connection.commit()
                    print("Dados de treinamento inseridos no banco de dados.")

            for _, row in df_colaborador_treinamentos.iterrows():
                cursor.execute("SELECT id FROM Colaborador_Treinamentos WHERE colaborador_id = %s AND treinamentos_id = %s",
                   (row['colaborador_id'], row['treinamentos_id']))
                existing_record = cursor.fetchone()

                if existing_record:
                    cursor.execute("""UPDATE Colaborador_Treinamentos SET
                                        data_conclusao = %s,
                                        validade = %s,
                                        status = %s
                                    WHERE id = %s""",
                                    (row['data_conclusao'], row['validade'], row['status'], existing_record[0]))
                    if cursor.rowcount > 0:  # Check if an update occurred
                        connection.commit()
                        print("Dados de colaborador_treinamentos atualizados no banco de dados.")
                else:
                    cursor.execute("""INSERT INTO Colaborador_Treinamentos (colaborador_id, treinamentos_id, data_conclusao, validade, status)
                                        VALUES (%s, %s, %s, %s, %s)""",
                                    (row['colaborador_id'], row['treinamentos_id'], row['data_conclusao'], row['validade'], row['status']))
                    connection.commit()
                    print("Dados de colaborador_treinamentos inseridos no banco de dados.")

    except Error as e:
        print(f"Erro ao conectar ao MySQL: {e}")

    finally:
        if cursor is not None:  # Verifica se o cursor foi criado
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()
            print("Conexão com MySQL fechada.")

atualizar_banco()