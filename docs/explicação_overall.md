-- Stack Tecnológica --
    Node.js - Ambiente de execução para JavaScript no servidor
    Ao contrário do PHP, o Node.js é extremamente rápido e permite usar a mesma linguagem (JavaScript) tanto no servidor como na interface. É o padrão atual da indústria.

    React - Biblioteca para criar interfaces de utilizador (Frontend)
    Criada pelo Facebook, permite criar páginas que não precisam de recarregar (Single Page Applications). É muito mais fluido e profissional do que o HTML/CSS estático tradicional.

    MySQL - Base de dados relacional
    Como já conheço do 3.º ano, vou manter esta base sólida. É perfeita para gerir utilizadores, tarefas e relações entre eles.

    Google Gemini API - Inteligência Artificial
    Vai dar o "toque de génio" ao projeto. O chatbot não será apenas um conjunto de regras, mas uma IA real que motiva o utilizador.

    Módulo C (NAPI) - Linguagem C ligada ao Node.JS
    Como o curso foca muito em C no 1.º ano, vou usar isto para mostrar ao júri que sei integrar linguagens de baixo nível para tarefas de performance (ex: calcular rankings de gamificação).



-- Plano de Trabalho --
    Para as pré-apresentações de abril, o nosso foco será as  fases 1, 2 e 3.

    Fase 1: Preparação do Ambiente e Estrutura (Agora)
    Instalação das ferramentas (Node.js, VS Code).
    Explicação da estrutura de pastas.

    Fase 2: Base de Dados e Autenticação (Março)
    Desenho das tabelas no MySQL (via phpMyAdmin).
    Criação do Login e Registo (Backend e Frontend).

    Fase 3: Gestão de Tarefas e Dashboard (Até meados de Abril - 1.ª Pré-apresentação)
    Criar, listar e eliminar tarefas.
    Visualização básica do progresso.

    Fase 4: Gamificação e Módulo C (Abril/Maio)
    Sistema de pontos e níveis.
    Integração do código C.

    Fase 5: Chatbot IA e Inspiração (Maio)
    Ligação à API do Gemini.
    Frases motivacionais e versículos.

    Fase 6: Polimento e Documentação (Maio)
    Design final (Tailwind CSS).
    Escrita do relatório e preparação da defesa.



-- Fase 1 | Preparação do Ambiente --
    Ferramentas: 
        Visual Studio Code (VS Code),
        Node.js (Versão LTS)
        XAMPP
    
    Estrutura do Projeto:
        /backend (Node.js)
        /frontend (React)

    Bilhete do projeto (package.json):
        O primeiro comando que um programador de Node.js faz é o npm init. Isto cria um ficheiro chamado package.json.
        Este ficheiro é a "lista de ingredientes" e as "instruções de preparo": as bibliotecas que vamos usar, como o express ou o mySQL e os comandos para iniciar o servidor.
        No terminal, fazer:
            cd backend
            npm init -y

    As Primeiras Bibliotecas: 
        Para o servidor começar a funcionar, é necessário o express (framework que gere as rotas) e o nodemon (ferramenta que reinicia o servidor sozinho sempre que mudas o código)
        No terminal, fazer:
            npm install express
            npm install --save-dev nodemon

    O Servidor (Index.js):
        Dentro da pasta Backend, criar o ficheiro index.js e escrever o código.

    O Servidor (A Correr):
        npx nodemon index.js
        "Utilizei o Node.js com a framework Express para criar um servidor que escuta na porta 3000. Criei um Endpoint (uma rota) do tipo GET na raiz (/). Quando o navegador (o cliente) faz um pedido a essa rota, o servidor processa o pedido e envia uma resposta em texto."

    O Frontend (React):
        Usaremos Vite. 
        No terminal, fazer:
            cd ..
            cd frontend
            npm create vite@latest . -- --template react
        Escolher React - JavaScript
            npm install
            npm run dev

    O Design (Tailwind CSS):
        Usaremos Tailwind CSS.
        No terminal do frontend, fazer:
            npm install -D tailwindcss postcss autoprefixer
            npx tailwindcss init -p
        SE der erro:
            node_modules\.bin\tailwindcss init -p
            ou
            node node_modules\tailwindcss\lib\cli.js init -p
        Se não funcionar na mesma, ver Manus (criar manualmente).

    Durante o desenvolvimento, utilizei o comando npm audit para monitorizar vulnerabilidades nas dependências do projeto. Embora existissem alguns alertas em ambiente de desenvolvimento, a integridade do sistema é garantida através de práticas como o hashing de passwords e a validação de inputs no servidor.


-- Fase 2 | O Cérebro de Dados --
    Planeamento de Dados:
        Entidades Principais e Atributos
        Relacionamentos
        Tabelas de Relacionamentos
        Encontram-se em /Lifinity/docs/base_dados/
    
    o Script (SQL):
        Preparação de dois ficheiros fundamentais:
            explicacao_er.md
            estrutura_lifinity.sql
        Criação da Base de dados, tabelas, dados, relacionamentos,etc...

    A base de dados foi desenhada seguindo as regras de Normalização, garantindo a integridade dos dados e evitando a redundância. Utilize Chaves Estrangeiras (FK) com restrições de integridade para automatizar a limpeza de dados e tabelas associativas para resolver relacionamentos de muitos-para-muitos, o que permite uma escalabilidade profissional do sistema Lifinity.

    Ligar o MySQL no XAMPP:
        No XAMPP Control Panel, Start no MySQL e Apache(opcional)
        Clicar no botão Admin no MySQL ou abrir o phpMyAdmin no navegador

    SQL e phpMyAdmin:
        Importar o código SQL no phpMyAdmin



-- Fase 3 | O Motor - Backend --
    O Conector MySQL:
        Para o Node.js conseguir enviar comandos SQL para o XAMPP, precisamos da biblioteca mysql2
        no terminal, fazer:
            cd backend
            npm install mysql2 dotenv
        O dotenv serve para guardarmos a password da base de dados de forma segura

    O Ficheiro de Configuração (.env):
        Criação do ficheiro .env no backend
        Este ficheiro guarda as "chaves de casa"

    A Ligação (db.js):
        Este ficheiro será o responsável por abrir o canal de comunicação com o MySQL

    Teste de Motor:
        Precisamos dizer ao  index.js para usar esta ligação
        Para fazer isto, adicionamos ao início do ficheiro index.js:
            const db = require ('./db');
        E, no terminal, fazer:
            npx nodemon index.js
        Este comando executa o ficheiro monitorizado.

        O que é o npx nodemon index.js
        node index.js: É o comando padrão. Ele executa o teu ficheiro uma vez. O problema? Se mudares uma única vírgula no código, tens de parar o servidor (Ctrl+C) e arrancá-lo de novo para veres a mudança. É muito lento para programar.
        nodemon: É uma ferramenta de desenvolvimento que fica a "vigiar" (monitorizar) os teus ficheiros. Sempre que guardas um ficheiro (Ctrl+S), o nodemon deteta a mudança e reinicia o servidor sozinho em milissegundos.
        npx: É um "executor" de pacotes que vem com o Node.js. Ele permite correr o nodemon sem que tenhas de o instalar globalmente no Windows 
        (o que é ótimo para computadores de escola onde não tens permissões de administrador).

    O registo de Utilizadores (Sign up):
        Para isso, é preciso duas coisas:
            bcryptjs - para incriptar as passwords
            cors - Para permitir que o Frontend consiga falar com o backend
        no terminal do backend, fazer:
            npm install bcryptjs cors
        E configurar o index.js para aceitar dados.

        Porquê o bcrypt e o async/await?
            Bcrypt: Se alguém roubar a tua base de dados, as passwords estão "disfarçadas". É impossível saber a password original.
            
            Async/Await: Como falar com a base de dados demora tempo (milissegundos), usamos o async para o servidor não ficar "congelado" à espera da resposta. Ele continua a trabalhar e volta quando os dados chegarem.

    A Interface de Registo (Frontend)
        No terminal, fazer:
            cd frontend
            npm install axios
        Ferramenta que o React usa para "gritar" para o servidor Node.js
        Criar a página de Registo - Register.jsx
        Para ver a funcionar:
            abrir App.jsx e fazer mudanças
            no terminal do frontend, fazer: npm run dev
            abrir o link e tentar preencher o formulário
        SE der erro - É porque instalaste a versão mais recente do Tailwind CSS, que mudou a forma como se liga ao motor de CSS, então temos de:
            No terminal do frontend:
                npm install @tailwindcss/postcss
            E no ficheiro postcss.config.js atualizá-lo.
            Testar novamente.
    
    A Refatoração (Organização profissional)
        Para que o projeto suporte o Site e a App Android sem se tornar uma confusão, vamos organizar as pastas.
            src/config
            src/controllers
            src/routes
        Como mudámos a estrutura das pastas, tivemos que fazer umas pequenas alterações e, por fim, testar novamente o registo.
        Assim que tudo funcionar, passamos ao Login.

    A Segurança (Sistema de Login)
        Se o registo funcionou, estamos prontos para o Login. O login é um pouco diferente do registo porque não vamos apenas verificar a password, vamos também gerar um Token (JWT).
        O que é um JWT (JSON Web Token)?
        Imagina que o utilizador faz login e o servidor dá-lhe uma "pulseira VIP" digital. Sempre que o utilizador quiser ver as suas tarefas ou grupos, ele mostra essa pulseira (o token) ao servidor para provar que é ele.
        No backend, fazer:
            npm install jsonwebtoken
        No .env adicionar:
            JWT_SECRET=o_meu_segredo_super_protegido_lifinity_2026
        Atualizar os ficheiros authController.js e authRoutes.js
        Se o júri te perguntar: "Porque usas JWT em vez de Sessions (que é o que se costuma ensinar)?", tu respondes:
        "Optei por JWT (JSON Web Tokens) porque é uma solução stateless (sem estado no servidor). Isto torna a aplicação mais escalável e preparada para o futuro, permitindo que o mesmo Backend sirva tanto o Frontend Web (React) como a Aplicação Android de forma segura e independente."










    Excelentes perguntas! Isso mostra que estás a levar o conceito de organização profissional a sério. Vamos esclarecer esses dois pontos fundamentais:
    1. Porquê o Registo e o Login no mesmo Controller?
    No padrão MVC (Model-View-Controller), agrupamos as funções por domínio ou entidade.
    Registo e Login pertencem ambos ao domínio da Autenticação (Auth). Como ambos lidam com a mesma tabela (USER) e com o mesmo objetivo (gerir o acesso do utilizador), é padrão da indústria mantê-los no mesmo ficheiro chamado authController.js.
    Quando separaríamos? Se o teu projeto tivesse, por exemplo, um sistema de "Gestão de Administradores" muito diferente do "Login de Utilizadores Comuns".
    Futuro: Quando criarmos a lógica das tarefas, criaremos um novo ficheiro chamado taskController.js. Assim, o teu código fica dividido por "temas": Autenticação, Tarefas, Grupos, Gamificação, etc.
    2. O CSS dentro do Register.jsx (Tailwind CSS)
    Esta é a maior diferença entre o que aprendeste na escola (CSS tradicional) e o desenvolvimento moderno com Tailwind CSS.
    Na escola: Aprendeste a separar o HTML (estrutura) do CSS (estilo) em ficheiros diferentes.
    No Tailwind: Usamos o conceito de Utility-First. Em vez de criares uma classe .botao-azul num ficheiro CSS e depois ires ao HTML aplicá-la, escreves diretamente as propriedades (ex: bg-blue-600 rounded p-2) no próprio componente.
    Vantagens para a tua PAP:
    Velocidade: Não tens de saltar entre ficheiros para mudar uma cor ou um espaçamento.
    Manutenção: Se quiseres mudar o design do formulário de registo, mexes apenas no ficheiro Register.jsx. Não corres o risco de estragar o design de outra página sem querer.
    Performance: O Tailwind gera um ficheiro CSS final muito pequeno, apenas com o que realmente usaste.
    Onde está o CSS real? Ele continua a existir no teu index.css (onde colocámos o @import "tailwindcss"), mas o Tailwind encarrega-se de "injetar" os estilos baseados nas classes que escrevemos nos componentes.

Exatamente! Esse é o "segredo" dos grandes projetos: o Backend é o motor que serve para tudo.
Seja para o site em React, para a aplicação Android no Android Studio, ou até para um smartwatch no futuro, o teu servidor Node.js será o ponto central. O Android Studio apenas enviará pedidos HTTP (como o Axios faz no React) para o teu Node.js, e o Node.js responderá com os dados da base de dados MySQL.
Esta arquitetura vai impressionar imenso o júri, porque mostra que não fizeste apenas um "site", mas sim um Ecossistema Digital.




GEMINI - GOOGLE - imagina poder criar uma tarefa apartir de um email criado para um determinado email, ou seja, na app, terá um endereço, podes enviar para lá um endereço para, por exemplo, apoio tencnico, apoiotecnico@gmail.com, envia e recebe tarefas. Ajuda por e simplesmente o email é algo grande, se conseguisse integrar, seria algo grande, quase como um workflow (vem um email para este endereço - ok este assunto é para esta pessoa ou para aquela). EX: Um DT envia um email para a escola, e é redirecionada para a turma inteira. Neste caso, as tarefas seriam automaticamente recebidas, as informações, sem ter que criar à unha a tarefa.(Explorar mais)
Õutra coisa, importar um ficheiro CSV com as informações, destino, descrição, etc,... que criasse uma tarefa automaticamente.

1. Criar tarefas via E-mail (O "Workflow")
O teu professor está a sugerir uma funcionalidade de Automação.
Como funciona: Imagina que cada grupo no Lifinity tem um e-mail único. Quando alguém envia um e-mail para lá, o teu sistema "lê" o assunto e o corpo do e-mail e cria automaticamente uma tarefa para todos os membros.
Viabilidade: É perfeitamente possível usando o Google Gemini para "interpretar" o texto do e-mail, mas exige configurar webhooks ou ler a API do Gmail.
A minha opinião: É uma funcionalidade "Premium". Para a pré-apresentação, é demasiado complexo, mas podes mencioná-la como "Trabalho Futuro / Escalabilidade". O júri adora saber que o projeto tem pernas para andar depois da escola.
2. Importar CSV (A ideia vencedora!)
Esta ideia é fantástica e muito mais prática para a PAP.
O Cenário: Imagina um professor que tem 20 tarefas para a turma. Em vez de criar uma a uma "à unha", ele carrega um ficheiro Excel/CSV e o teu sistema cria as 20 de uma vez.
Dificuldade: Média. É um ótimo desafio técnico que demonstra que sabes manipular ficheiros no Node.js. Vamos marcar isto para a Fase de Funcionalidades Avançadas.





-- Última Atualização em 11-04 às 13:50 --