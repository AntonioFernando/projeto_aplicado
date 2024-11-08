import pandas as pd
import psycopg2
from psycopg2 import Error

# Configuração do banco de dados local
db_config_local = {
    'host': 'localhost',
    'user': 'postgres',
    'password': 'pg,123',
    'database': 'pg_ferramenta_consulta'
}

# Configuração do banco de dados no Render
db_config_render = {
    'host': 'dpg-csmh9au8ii6s73ci7l70-a.oregon-postgres.render.com',  # Host Render
    'user': 'ccaipfbd_user',  # Usuário Render
    'password': '2OGPLwCble9iQPxCrQ1QFbNkNcNHVJS5',  # Senha Render
    'database': 'ccaipfbd',  # Nome do banco Render
    'port': 5432  # Porta padrão do PostgreSQL
}

valores_status_permitidos = ['Ativo', 'Inativo']

def atualizar_banco():
    connection_local = None
    cursor_local = None
    connection_render = None
    cursor_render = None

    try:
        # Conexão com o banco de dados local
        connection_local = psycopg2.connect(**db_config_local)
        cursor_local = connection_local.cursor()
        print("Conexão ao Postgre (local) bem-sucedida.")

        # Conexão com o banco de dados no Render
        connection_render = psycopg2.connect(**db_config_render)
        cursor_render = connection_render.cursor()
        print("Conexão ao Postgre (Render) bem-sucedida.")

        # Ler o arquivo Excel
        df_colaborador = pd.read_excel("C:/Users/aflms/projeto_aplicado-web-server/public/colaborador.xlsx", engine='openpyxl')
        df_treinamentos = pd.read_excel("C:/Users/aflms/projeto_aplicado-web-server/public/treinamentos.xlsx", engine='openpyxl')
        df_colaborador_treinamentos = pd.read_excel("C:/Users/aflms/projeto_aplicado-web-server/public/colaborador_treinamentos.xlsx", engine='openpyxl')
        
        # Atualizar dados no banco de dados local e no Render
        for _, row in df_colaborador.iterrows():
            try:
                # Banco Local
                cursor_local.execute("""
                    INSERT INTO Colaborador (nome, matricula, cargo)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (matricula) 
                    DO UPDATE SET nome = EXCLUDED.nome, cargo = EXCLUDED.cargo
                """, (row['nome'], row['matricula'], row['cargo']))

                # Banco Render
                cursor_render.execute("""
                    INSERT INTO Colaborador (nome, matricula, cargo)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (matricula) 
                    DO UPDATE SET nome = EXCLUDED.nome, cargo = EXCLUDED.cargo
                """, (row['nome'], row['matricula'], row['cargo']))

            except Exception as e:
                print(f"Erro ao inserir colaborador {row['nome']}: {e}")
                # Se ocorrer um erro, corrigir a sequência no banco local
                cursor_local.execute("SELECT setval('colaborador_id_seq', (SELECT MAX(id) FROM Colaborador), false);")
                connection_local.commit()

                # Se ocorrer um erro, corrigir a sequência no banco Render
                cursor_render.execute("SELECT setval('colaborador_id_seq', (SELECT MAX(id) FROM Colaborador), false);")
                connection_render.commit()

        # Repetir as operações de inserção/atualização para os outros dados
        for _, row in df_treinamentos.iterrows():
            if row['status'] not in valores_status_permitidos:
                print(f"Status '{row['status']}' não é válido. Ignorando registro.")
                continue  # Pular este registro e seguir para o próximo

            # Banco Local
            cursor_local.execute("""
                SELECT id FROM Treinamentos WHERE nome_treinamentos = %s AND exigido_para_funcao = %s
            """, (row['nome_treinamentos'], row['exigido_para_funcao']))
            existing_record_local = cursor_local.fetchone()

            if existing_record_local:
                cursor_local.execute("""
                    UPDATE Treinamentos SET nome_treinamentos = %s, exigido_para_funcao = %s,
                    validade_em_anos = %s, status = %s WHERE id = %s
                """, (row['nome_treinamentos'], row['exigido_para_funcao'], row['validade_em_anos'], row['status'], existing_record_local[0]))
            else:
                cursor_local.execute("""
                    INSERT INTO Treinamentos (nome_treinamentos, exigido_para_funcao, validade_em_anos, status)
                    VALUES (%s, %s, %s, %s)
                """, (row['nome_treinamentos'], row['exigido_para_funcao'], row['validade_em_anos'], row['status']))

            # Banco Render
            cursor_render.execute("""
                SELECT id FROM Treinamentos WHERE nome_treinamentos = %s AND exigido_para_funcao = %s
            """, (row['nome_treinamentos'], row['exigido_para_funcao']))
            existing_record_render = cursor_render.fetchone()

            if existing_record_render:
                cursor_render.execute("""
                    UPDATE Treinamentos SET nome_treinamentos = %s, exigido_para_funcao = %s,
                    validade_em_anos = %s, status = %s WHERE id = %s
                """, (row['nome_treinamentos'], row['exigido_para_funcao'], row['validade_em_anos'], row['status'], existing_record_render[0]))
            else:
                cursor_render.execute("""
                    INSERT INTO Treinamentos (nome_treinamentos, exigido_para_funcao, validade_em_anos, status)
                    VALUES (%s, %s, %s, %s)
                """, (row['nome_treinamentos'], row['exigido_para_funcao'], row['validade_em_anos'], row['status']))

        for _, row in df_colaborador_treinamentos.iterrows():
            # Banco Local
            cursor_local.execute("""
                SELECT id FROM Colaborador_Treinamentos WHERE colaborador_id = %s AND treinamentos_id = %s
            """, (row['colaborador_id'], row['treinamentos_id']))
            existing_record_local = cursor_local.fetchone()

            if existing_record_local:
                cursor_local.execute("""
                    UPDATE Colaborador_Treinamentos SET data_conclusao = %s, validade = %s, status = %s WHERE id = %s
                """, (row['data_conclusao'], row['validade'], row['status'], existing_record_local[0]))
            else:
                cursor_local.execute("""
                    INSERT INTO Colaborador_Treinamentos (colaborador_id, treinamentos_id, data_conclusao, validade, status)
                    VALUES (%s, %s, %s, %s, %s)
                """, (row['colaborador_id'], row['treinamentos_id'], row['data_conclusao'], row['validade'], row['status']))

            # Banco Render
            cursor_render.execute("""
                SELECT id FROM Colaborador_Treinamentos WHERE colaborador_id = %s AND treinamentos_id = %s
            """, (row['colaborador_id'], row['treinamentos_id']))
            existing_record_render = cursor_render.fetchone()

            if existing_record_render:
                cursor_render.execute("""
                    UPDATE Colaborador_Treinamentos SET data_conclusao = %s, validade = %s, status = %s WHERE id = %s
                """, (row['data_conclusao'], row['validade'], row['status'], existing_record_render[0]))
            else:
                cursor_render.execute("""
                    INSERT INTO Colaborador_Treinamentos (colaborador_id, treinamentos_id, data_conclusao, validade, status)
                    VALUES (%s, %s, %s, %s, %s)
                """, (row['colaborador_id'], row['treinamentos_id'], row['data_conclusao'], row['validade'], row['status']))

        # Commit nas transações
        connection_local.commit()
        connection_render.commit()
        print("Todas as alterações foram confirmadas nos bancos de dados.")

    except Error as e:
        print(f"Erro ao conectar ao Postgre: {e}")

    finally:
        if cursor_local is not None:
            cursor_local.close()
        if connection_local is not None and not connection_local.closed:
            connection_local.close()
            print("Conexão com Postgre (local) fechada.")
        
        if cursor_render is not None:
            cursor_render.close()
        if connection_render is not None and not connection_render.closed:
            connection_render.close()
            print("Conexão com Postgre (Render) fechada.")

# Chama a função de atualização
atualizar_banco()
