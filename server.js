require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');


const app = express();
const port = process.env.PORT || 8000;

const corsOptions = {
    origin: ['http://localhost:8000', 'https://ccaipf.onrender.com'], // Permite localhost para desenvolvimento e o domínio de produção
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'imagens')));

const users = [];

//base de dados 'pg_ferramenta_consulta' para hospedagem em nuvem
const dbConfig = process.env.NODE_ENV === 'production' 
    ? { // Conexão para ambiente de produção (Render)
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    }
    : {
        host: 'localhost',
        user: 'postgres',
        password: 'pg,123',
        database: 'pg_ferramenta_consulta'
    };
    
//base de dados 'pg_ferramenta_consulta'
const db = new Client(dbConfig);

// gerencia erro ou sucesso da conexão com a base de dados.
db.connect()
    .then(() => console.log('Conectado ao banco de dados PostgreSQL!'))
    .catch((err) => console.error('Erro ao conectar ao banco de dados:', err));

// procura colaboradores por nome ou matricula na base de dados do servidor.
app.post('/buscar', (req, res) => {
    const { username, matricula } = req.body;
    let sql = `
        SELECT 
            c.nome, 
            c.matricula, 
            c.cargo, 
            t.nome_treinamentos, 
            t.exigido_para_funcao, 
            t.validade_em_anos, 
            ct.status
        FROM 
            Colaborador c
        LEFT JOIN 
            Colaborador_Treinamentos ct ON c.id = ct.colaborador_id
        LEFT JOIN 
            Treinamentos t ON ct.treinamentos_id = t.id
        WHERE 
            c.nome LIKE $1 OR c.matricula = $2;
    `;

    const values = [
        username ? `%${username}%` : null,
        matricula || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            res.status(500).send('Erro ao buscar os dados');
        } else {
            if (result.rows.length > 0) {
                res.json(result.rows);
            } else {
                res.status(404).send('Funcionário não encontrado');
            }
        }
    });
});

// Function to create new user (for testing, do not use in production)
async function createUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
}

// Create example users
(async () => {
    await createUser('usuario1', 'senha1');
    await createUser('usuario2', 'senha2');
})();

// Endpoint for login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({username: 'user' }, process.env.JWT_SECRET, { expiresIn: '5 min'});
        res.json({ success: true, message: 'Login realizado com sucesso!', token });
    } else {
        res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// solicita a lista de colaboradores para a base de dados no servidor local.
app.get('/pg_ferramenta_consulta', (req, res) => {
    const sql = `
        SELECT 
            c.nome, 
            c.matricula, 
            c.cargo, 
            t.nome_treinamentos, 
            t.exigido_para_funcao, 
            t.validade_em_anos, 
            ct.status
        FROM 
            Colaborador c
        LEFT JOIN 
            Colaborador_Treinamentos ct ON c.id = ct.colaborador_id
        LEFT JOIN 
            Treinamentos t ON ct.treinamentos_id = t.id
    `;
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar os colaboradores' });
        }
        res.json(result.rows);
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Erro critico. Pedimos sinceras desculpas.');
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

console.log(path.join(__dirname, 'imagens'));