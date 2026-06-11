const express = require('express'); //Importação da biblioteca Express (O motor do servidor)
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const userRoutes = require('./src/routes/userRoutes');
const inspirationRoutes = require('./src/routes/inspirationRoutes');
const statisticsRoutes = require('./src/routes/statisticsRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const friendRoutes = require('./src/routes/friendRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const assistantRoutes = require('./src/routes/assistantRoutes');
const achievementRoutes = require('./src/routes/achievementRoutes');
const contactRoutes = require('./src/routes/contactRoutes');

//Criação de uma instância do Express (a aplicação)
const app = express();
//Definição da porta onde o servidor "ouve" (3000 é o padrão)
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
        'http://localhost:5173', // O endereço do frontend em desenvolvimento
        'https://wrinkle-basically-payphone.ngrok-free.dev' // O teu link do ngrok aqui
    ],
    credentials: true // Permite o envio de cookies e credenciais
})); // Permite pedidos do frontend
app.use(express.json()); //Permite que o servidor entenda ficheiros JSON

// Servir as imagens enviadas pelos utilizadores (avatars e covers)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Usar as rotas de autenticação
app.use('/api/auth', authRoutes);
// Usar as rotas de tarefas
app.use('/api/tasks', taskRoutes);
// Usar as rotas de utilizadores
app.use('/api/users', userRoutes);
// Usar as rotas de inspiração
app.use('/api/inspiration', inspirationRoutes);
// Usar as rotas de estatísticas
app.use('/api/statistics', statisticsRoutes);
// Usar as rotas de grupos
app.use('/api/groups', groupRoutes);
// Usar as rotas de amigos
app.use('/api/friends', friendRoutes);
// Usar as rotas de chat
app.use('/api/chat', chatRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notifications', notificationRoutes);
// Rota pública do formulário de contacto
app.use('/api/contact', contactRoutes);

//Mandar o servidor começar a "ouvir" os pedidos
app.listen(PORT, () => {
    console.log(`🚀 Servidor do Lifinity a correr em http://localhost:${PORT}` );
});
