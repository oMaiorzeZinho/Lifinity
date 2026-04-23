// Ficheiro responsável por abrir o canal de comunicação com o mySQL
const mysql = require('mysql2');
require('dotenv').config({path: '../../.env' });

//Criámos uma "pool" de ligações (mais eficiente que uma ligação única)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//Testamos a Ligação para garantir que o XAMPP está a responder
pool.getConnection((err, connection) => {
    if(err){
        console.error('Erro ao ligar à base de dados: ', err.message);
    } else {
        console.log('Ligado com sucesso à base de dados mySQL (lifinity_db)!');
        connection.release(); //Libertamos a ligação de volta para a pool
    }
});

// Exportamos a pool para podermos usá-la noutros ficheiros
module.exports = pool.promise();