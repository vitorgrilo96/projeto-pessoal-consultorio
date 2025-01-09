const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Senha inválida.' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ token, role: user.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

app.get('/consultas', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'Token não fornecido.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const consultas = await pool.query('SELECT * FROM consultas');
        res.json(consultas.rows);
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Token inválido.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

app.post('/agendar', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'Token não fornecido.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { data, hora, motivo } = req.body;

        if (!data || !hora || !motivo) {
            return res.status(400).json({ message: 'Data, hora e motivo são obrigatórios.' });
        }

        const userResult = await pool.query('SELECT nome, email FROM usuarios WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const { nome, email } = userResult.rows[0];

        const result = await pool.query(
            'INSERT INTO consultas (nome, email, data, hora, motivo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nome, email, data, hora, motivo]
        );

        res.status(201).json({ message: 'Consulta agendada com sucesso!', consulta: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao agendar consulta.' });
    }
});
