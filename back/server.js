const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 

const app = express();
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); 

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); 
        req.user = user; 
        next(); 
    });
};

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body; 

    if (!email || !senha) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(senha, user.senha);

        if (!validPassword) {
            return res.status(401).json({ message: 'Senha inválida.' });
        }

        const token = jwt.sign(
            { id: user.id, nome: user.nome, papel: user.papel }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } 
        );

        res.json({ token, id: user.id, nome: user.nome, papel: user.papel });

    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});

app.get('/api/dashboard-info', authenticateToken, async (req, res) => {
    const { nome, papel } = req.user;
    let message = '';

    if (papel === 'admin') {
        message = `Bem-vindo, ${nome}! Você tem acesso administrativo.`;
    } else {
        message = `Bem-vindo, ${nome}! Aqui você pode gerenciar suas consultas.`;
    }
    res.json({ message, nome, papel });
});

app.post('/api/agendar', authenticateToken, async (req, res) => {
    const userId = req.user.id; 
    const userName = req.user.nome; 
    let userEmail = req.user.email;

    const { data, hora, motivo } = req.body;

    if (!data || !hora || !motivo) {
        return res.status(400).json({ message: 'Data, hora e motivo são obrigatórios.' });
    }

    try {
        if (!userEmail) {
            const userResult = await pool.query('SELECT email FROM usuarios WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado para obter e-mail.' });
            }
            userEmail = userResult.rows[0].email;
        }

        const result = await pool.query(
            'INSERT INTO consultas (nome, email, data, hora, motivo, usuario_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userName, userEmail, data, hora, motivo, userId]
        );

        res.status(201).json({ message: 'Consulta agendada com sucesso!', consulta: result.rows[0] });
    } catch (err) {
        console.error('Erro ao agendar consulta:', err);
        res.status(500).json({ message: 'Erro no servidor ao agendar consulta.' });
    }
});

app.get('/api/consultas', authenticateToken, async (req, res) => {
    if (req.user.papel !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Somente administradores podem visualizar todas as consultas.' });
    }

    try {
        const consultasResult = await pool.query('SELECT id, nome, email, data, hora, motivo, usuario_id FROM consultas ORDER BY data, hora');
        res.json(consultasResult.rows);
    } catch (err) {
        console.error('Erro ao buscar consultas:', err);
        res.status(500).json({ message: 'Erro no servidor ao buscar consultas.' });
    }
});

app.get('/api/consultas/usuario/:usuarioId', authenticateToken, async (req, res) => {
    if (req.user.papel !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const { usuarioId } = req.params;
        const result = await pool.query('SELECT * FROM consultas WHERE usuario_id = $1 ORDER BY data, hora', [usuarioId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar consultas do usuário.' });
    }
});

app.get('/api/minhas-consultas', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query('SELECT * FROM consultas WHERE usuario_id = $1 ORDER BY data, hora', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar suas consultas.' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Node.js rodando na porta ${PORT}`);
});

