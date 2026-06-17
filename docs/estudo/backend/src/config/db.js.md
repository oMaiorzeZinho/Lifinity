# `backend/src/config/db.js` — ligação à base de dados MySQL

## Papel no projeto
Abre e exporta o **canal de comunicação com o MySQL**. Todos os controladores importam daqui o objeto de ligação (`pool`) para fazer queries. É o único sítio onde a configuração de acesso à BD vive.

## Bloco a bloco

```js
const mysql = require('mysql2');
require('dotenv').config({path: '../../.env' });
```
- Importa o driver **`mysql2`**.
- Carrega as variáveis de ambiente com **`dotenv`**, a partir de um ficheiro `.env`.
- ⚠️ **Ponto a rever:** o `path: '../../.env'` é resolvido **relativamente à pasta de onde se corre o `node`** (o *current working directory*), e não relativamente a este ficheiro. Se o servidor for arrancado de `D:\Lifinity\backend` (com `node index.js`), `../../.env` aponta para `D:\.env` — fora do projeto. Na prática, o `index.js` quase de certeza também chama `require('dotenv').config()` (com o caminho por defeito `backend/.env`), pelo que as variáveis acabam carregadas à mesma. **Verificar no `index.js`** para confirmar de onde vêm realmente as variáveis. [Confirmar ao documentar `index.js`.]

```js
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
```
Cria uma **pool de ligações** (conjunto de ligações reutilizáveis), em vez de uma única ligação:
- `host`/`user`/`password`/`database` — vêm do `.env` (não estão no código → **boa prática de segurança**: credenciais fora do git).
- `waitForConnections: true` — se todas as ligações estiverem ocupadas, os pedidos **esperam** na fila em vez de falharem logo.
- `connectionLimit: 10` — no máximo 10 ligações simultâneas ao MySQL.
- `queueLimit: 0` — fila de espera **sem limite** (0 = ilimitado).

**Porquê uma pool:** abrir/fechar uma ligação por cada query é lento. A pool mantém ligações vivas e empresta-as conforme necessário — muito mais eficiente sob vários pedidos em simultâneo.

```js
pool.getConnection((err, connection) => {
    if(err){
        console.error('Erro ao ligar à base de dados: ', err.message);
    } else {
        console.log('Ligado com sucesso à base de dados mySQL (lifinity_db)!');
        connection.release();
    }
});
```
**Teste de arranque:** pede uma ligação só para confirmar que o MySQL (XAMPP) está a responder. Se falhar, mostra o erro na consola; se resultar, mostra mensagem de sucesso e **liberta** a ligação de volta para a pool (`connection.release()`) — não a deixa presa.

**Porquê:** dá *feedback* imediato no terminal ao arrancar — se esqueceste de ligar o XAMPP, percebes logo, em vez de só descobrires quando a primeira query rebenta.

```js
module.exports = pool.promise();
```
Exporta a pool na sua **versão de Promises** (`.promise()`). É isto que permite usar `async/await` nos controladores:
```js
const [rows] = await db.query('SELECT ...');
```
em vez de *callbacks* aninhados. Muito mais limpo de ler.

## Ligações
- **Importado por:** praticamente todos os `backend/src/controllers/*.js` (`const db = require('../config/db')`).
- **Depende de:** variáveis em `backend/.env` (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) — fora do git.
- **Fala com:** a base de dados criada por `docs/base_dados/estrutura_lifinity.sql`.
