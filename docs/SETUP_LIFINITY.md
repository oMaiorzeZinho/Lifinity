# Guia de Setup do Projecto Lifinity

Este documento explica como preparar e executar o projecto **Lifinity** num computador novo, partindo do princípio de que a pasta completa do projecto foi copiada, por exemplo, através de uma pendrive.

O objectivo é permitir instalar dependências, preparar a base de dados, compilar o módulo nativo em C e iniciar correctamente o backend e o frontend.

---

# 1. Requisitos necessários

Antes de executar o projecto, o computador deve ter instalado:

## Software obrigatório

- Node.js
- npm
- XAMPP
- MySQL/MariaDB através do XAMPP
- phpMyAdmin
- Visual Studio Code, recomendado
- Git, opcional mas recomendado

## Necessário para o módulo em C

O Lifinity usa um módulo nativo em C através de `node-gyp`. Por isso, no Windows também é necessário:

- Python
- Visual Studio Build Tools com suporte para C/C++
- node-gyp

O `node-gyp` pode ser instalado globalmente, se necessário:

```powershell
npm install --global node-gyp
```

---

# 2. Estrutura principal do projecto

A pasta do projecto deve ter uma estrutura semelhante a esta:

```txt
Lifinity/
├─ backend/
├─ frontend/
├─ docs/
└─ README.md
```

As pastas principais são:

```txt
backend/   -> API, autenticação, base de dados, lógica de tarefas, ranking, estatísticas, comunidade e inspiração
frontend/  -> interface React da aplicação

docs/      -> documentação, diagramas, SQL e ficheiros auxiliares
```

---

# 3. Preparar a base de dados

## 3.1 Iniciar o XAMPP

Abrir o XAMPP e iniciar os serviços:

```txt
Apache
MySQL
```

Depois abrir o phpMyAdmin no navegador:

```txt
http://localhost/phpmyadmin
```

---

## 3.2 Importar a base de dados

No phpMyAdmin:

1. Clicar em **Importar**.
2. Seleccionar o ficheiro SQL do projecto.
3. O ficheiro deve estar em:

```txt
docs/base_dados/estrutura_lifinity.sql
```

4. Executar a importação.

O script cria a base de dados `lifinity_db` e as tabelas necessárias.

---

## 3.3 Confirmar se a base de dados foi criada

Depois da importação, deve existir uma base de dados chamada:

```txt
lifinity_db
```

Com tabelas como:

```txt
USER
TASK
CATEGORY
GROUP_ENTITY
GROUP_MEMBER
GROUP_TASK
FRIENDSHIP
NOTIFICATION
BIBLE_VERSE
FAVORITE_VERSE
XP_HISTORY
TASK_ASSIGNEE
BADGE
USER_BADGE
GOAL
```

Se estas tabelas aparecerem no phpMyAdmin, a base de dados foi importada correctamente.

---

# 4. Configurar variáveis de ambiente

O projecto usa ficheiros `.env` para guardar configurações locais.

---

## 4.1 Configurar o backend

Na pasta:

```txt
backend/
```

deve existir um ficheiro chamado:

```txt
.env
```

Exemplo de conteúdo:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lifinity_db
JWT_SECRET=lifinity_secret_key
```

Notas:

- Em XAMPP, normalmente o utilizador do MySQL é `root`.
- Normalmente a password está vazia.
- Se o MySQL tiver password, alterar `DB_PASSWORD`.
- O `JWT_SECRET` pode ser qualquer texto seguro, mas deve existir.

---

## 4.2 Configurar o frontend

Na pasta:

```txt
frontend/
```

deve existir um ficheiro:

```txt
.env
```

Exemplo:

```env
VITE_API_URL=http://localhost:3000/api
```

Este valor indica ao frontend onde está a API do backend.

---

# 5. Instalar dependências

A pasta `node_modules` não deve ser copiada para a pendrive, porque é pesada e pode variar entre computadores.

Num computador novo, é necessário instalar novamente as dependências.

---

## 5.1 Instalar dependências do backend

Abrir um terminal na pasta do projecto:

```powershell
cd D:\Lifinity\backend
```

Executar:

```powershell
npm install
```

Isto instala todas as dependências indicadas no `package.json` do backend.

---

## 5.2 Instalar dependências do frontend

Abrir outro terminal:

```powershell
cd D:\Lifinity\frontend
```

Executar:

```powershell
npm install
```

---

# 6. Compilar o módulo C

O backend usa um módulo nativo em C para funções de gamificação e estatísticas.

Como este módulo é compilado para o computador onde está a ser usado, pode ser necessário recompilar num computador novo.

Na pasta do backend:

```powershell
cd D:\Lifinity\backend
```

Executar:

```powershell
npx node-gyp configure
npx node-gyp build
```

Em muitos casos, o próprio `npm install` já executa a compilação automaticamente. Mesmo assim, se aparecer erro relacionado com `gamification` ou `node-gyp`, estes comandos devem ser executados manualmente.

---

# 7. Executar o projecto

Para executar o Lifinity, é necessário ter dois terminais abertos: um para o backend e outro para o frontend.

---

## 7.1 Terminal 1 — Backend

Na pasta:

```powershell
cd D:\Lifinity\backend
```

Executar:

```powershell
npm run dev
```

Se não existir script `dev`, usar:

```powershell
npx nodemon index.js
```

O backend deve iniciar em:

```txt
http://localhost:3000
```

---

## 7.2 Terminal 2 — Frontend

Na pasta:

```powershell
cd D:\Lifinity\frontend
```

Executar:

```powershell
npm run dev
```

O frontend deve iniciar em:

```txt
http://localhost:5173
```

Depois é só abrir esse endereço no navegador.

---

# 8. Ordem correcta para iniciar tudo

A ordem recomendada é:

1. Abrir o XAMPP.
2. Iniciar Apache e MySQL.
3. Confirmar que a base de dados `lifinity_db` existe no phpMyAdmin.
4. Iniciar o backend.
5. Iniciar o frontend.
6. Abrir `http://localhost:5173`.

---

# 9. Testar se está tudo a funcionar

Depois de abrir a aplicação:

1. Registar uma conta ou fazer login numa conta existente.
2. Criar uma tarefa.
3. Concluir uma tarefa.
4. Confirmar que o XP aumenta.
5. Abrir o ranking.
6. Abrir estatísticas.
7. Abrir inspiração.
8. Abrir comunidade.
9. Abrir perfil.

Se estas páginas carregarem correctamente, o projecto está funcional.

---

# 10. Possíveis erros e soluções

## 10.1 Backend não liga à base de dados

Verificar:

- se o MySQL está ligado no XAMPP;
- se a base de dados `lifinity_db` existe;
- se o ficheiro `backend/.env` está correcto;
- se o utilizador/password do MySQL estão correctos.

---

## 10.2 Frontend não consegue carregar dados

Verificar:

- se o backend está ligado;
- se o ficheiro `frontend/.env` tem:

```env
VITE_API_URL=http://localhost:3000/api
```

- se o backend está mesmo a correr na porta `3000`.

---

## 10.3 Erro relacionado com node-gyp

Se aparecer erro ao compilar o módulo C, verificar se o computador tem:

- Python instalado;
- Visual Studio Build Tools;
- suporte para C/C++;
- Node.js instalado correctamente.

Depois tentar novamente:

```powershell
cd D:\Lifinity\backend
npx node-gyp configure
npx node-gyp build
```

---

## 10.4 Porta já está em uso

Se a porta `3000` ou `5173` estiver ocupada, fechar outros terminais/processos antigos.

Também é possível reiniciar o VS Code ou o computador.

---

# 11. Sobre a pasta node_modules

A pasta `node_modules` não deve ser copiada para a pendrive.

Motivos:

- ocupa muito espaço;
- pode causar problemas entre computadores;
- contém ficheiros gerados para o ambiente onde foi instalada;
- é recriada automaticamente com `npm install`.

Num computador novo, basta executar:

```powershell
npm install
```

na pasta `backend` e na pasta `frontend`.

---

# 12. Usar ngrok para demonstração externa

O ngrok é opcional. Serve para criar um link público temporário para mostrar o frontend noutro dispositivo ou numa apresentação.

---

## 12.1 Iniciar o projecto normalmente

Antes de usar ngrok, é necessário ter:

- backend ligado;
- frontend ligado;
- site a funcionar em `http://localhost:5173`.

---

## 12.2 Executar ngrok

Se existir um ficheiro `ngrok.exe` dentro da pasta `docs`, pode ser usado directamente.

Exemplo:

```powershell
D:\Lifinity\docs\ngrok.exe http 5173
```

O ngrok vai gerar um link público, por exemplo:

```txt
https://exemplo.ngrok-free.app
```

Esse link pode ser usado para abrir o frontend.

---

## 12.3 Atenção ao backend com ngrok

Mesmo que o frontend seja aberto pelo link do ngrok, o backend continua a correr localmente em:

```txt
http://localhost:3000
```

Para uma apresentação no mesmo computador, isto normalmente funciona sem problema.

Se for necessário abrir o site noutro dispositivo, pode ser preciso expor também o backend ou ajustar a configuração da API.

---

# 13. Comandos principais resumidos

## Backend

```powershell
cd D:\Lifinity\backend
npm install
npx node-gyp configure
npx node-gyp build
npm run dev
```

## Frontend

```powershell
cd D:\Lifinity\frontend
npm install
npm run dev
```

## Base de dados

1. Abrir XAMPP.
2. Ligar MySQL.
3. Abrir phpMyAdmin.
4. Importar:

```txt
docs/base_dados/estrutura_lifinity.sql
```

---

# 14. Notas para apresentação da PAP

Para a apresentação, recomenda-se preparar tudo antes:

1. Testar login.
2. Ter uma conta já criada.
3. Ter algumas tarefas de exemplo.
4. Ter alguns versículos na base de dados.
5. Ter pelo menos um grupo criado.
6. Ter o backend e frontend já abertos antes da demonstração.
7. Confirmar que o MySQL está ligado.

A demonstração ideal pode seguir esta ordem:

1. Mostrar página inicial.
2. Fazer login.
3. Mostrar tarefas.
4. Criar/concluir tarefa.
5. Mostrar XP e ranking.
6. Mostrar estatísticas.
7. Mostrar inspiração diária.
8. Mostrar comunidade.
9. Mostrar perfil.

---

# 15. Comandos que não devem ser usados num computador novo com o projecto já criado

Os comandos abaixo servem para criar um projecto do zero e não devem ser usados se a pasta Lifinity já existe:

```powershell
npm init -y
npm create vite@latest . -- --template react
```

Usar estes comandos dentro do projecto existente pode recriar ficheiros e causar problemas.

Num computador novo, o correcto é apenas usar:

```powershell
npm install
```

nas pastas `backend` e `frontend`.

---

# 16. Conclusão

Para executar o Lifinity num computador novo, os passos essenciais são:

1. Instalar Node.js, XAMPP e ferramentas de compilação.
2. Importar a base de dados no phpMyAdmin.
3. Configurar os ficheiros `.env`.
4. Executar `npm install` no backend e frontend.
5. Compilar o módulo C, se necessário.
6. Iniciar backend e frontend.

Depois destes passos, o projecto fica pronto a ser usado localmente.
