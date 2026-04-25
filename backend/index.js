const express = require('express'); //Importação da biblioteca Express (O motor do servidor)
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const userRoutes = require('./src/routes/userRoutes');
const inspirationRoutes = require('./src/routes/inspirationRoutes');

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

// Usar as rotas de autenticação
app.use('/api/auth', authRoutes);
// Usar as rotas de tarefas
app.use('/api/tasks', taskRoutes);
// Usar as rotas de utilizadores
app.use('/api/users', userRoutes);
// Usar as rotas de inspiração
app.use('/api/inspiration', inspirationRoutes);


//Mandar o servidor começar a "ouvir" os pedidos
app.listen(PORT, () => {
    console.log(`🚀 Servidor do Lifinity a correr em http://localhost:${PORT}` );
});
