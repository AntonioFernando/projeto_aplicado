const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const mysql = require('mysql');

const app = express();
const port = 8000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// Array to simulate users (normally from a database)
const users = [];

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql123',
    database: 'colaboradores'
});

// gerencia erro ou sucesso da conexão com a base de dados.
db.connect((err) => {
    if (err) {
        console.log('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados MYSQL!');
    }
});

// procura colaboradores por nome ou matricula na base de dados do servidor.
app.post('/buscar', (req, res) => {
    const { username, matricula } = req.body;
    let sql = 'SELECT * FROM colaboradores WHERE nome = ? OR matricula = ?';

    const values = [
        username || null,
        matricula || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            res.status(500);send('Erro ao buscar os dados');
        } else {
            if (result.length > 0) {
                res.json(result);
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
    console.log(`Usuário: ${username}, Senha hasheada: ${hashedPassword}`);
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
        res.json({ success: true, message: 'Login realizado com sucesso!' });
    } else {
        res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// solicita a lista de colaboradores para a base de dados no servidor local.
app.get('/colaboradores', (req, res) => {
    const sql = 'SELECT * FROM colaboradores';
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar os colaboradores' });
        }
        res.json(result);
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});