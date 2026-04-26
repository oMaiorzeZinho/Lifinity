# Visão Geral do Projeto Lifinity

## 1. O que é o Lifinity

O Lifinity é uma aplicação web de produtividade pessoal com gamificação, comunidade e inspiração diária. O objetivo principal é ajudar o utilizador a organizar tarefas, acompanhar progresso, manter motivação e transformar a rotina num sistema mais visual, interativo e recompensador.

A aplicação permite criar e gerir tarefas, ganhar XP ao concluir objetivos, subir de nível, consultar rankings, visualizar estatísticas, guardar versículos favoritos, criar grupos, adicionar amigos e consultar uma página de perfil. A ideia central é juntar organização, motivação e acompanhamento de progresso numa só plataforma.

O projeto foi desenvolvido como uma aplicação full stack, dividida em frontend, backend, base de dados e módulo nativo em C. Esta divisão permite demonstrar conhecimentos de várias áreas: interfaces web, APIs, autenticação, MySQL, segurança, integração entre linguagens e organização profissional de código.

## 2. Objetivos do projeto

O Lifinity foi pensado para resolver um problema simples: muitas aplicações de tarefas são demasiado básicas, pouco motivadoras ou não dão ao utilizador uma sensação real de evolução. Por isso, o projeto tenta transformar tarefas diárias em progresso visível.

Os principais objetivos são:

- Permitir ao utilizador organizar tarefas pessoais.
- Dar motivação através de XP, níveis e ranking.
- Mostrar estatísticas para o utilizador perceber a sua evolução.
- Criar uma componente espiritual/motivacional através da página de inspiração.
- Preparar funcionalidades colaborativas com amigos e grupos.
- Construir uma base técnica sólida para futuras expansões, como chat, tarefas partilhadas, importação CSV e comparações entre utilizadores.

## 3. Stack tecnológica utilizada

### Node.js

O Node.js foi utilizado no backend. Ele permite executar JavaScript no servidor e criar uma API capaz de responder ao frontend. A vantagem é usar JavaScript tanto no frontend como no backend, mantendo o projeto mais consistente.

No Lifinity, o Node.js é responsável por receber pedidos, validar utilizadores, comunicar com a base de dados, aplicar regras de negócio e devolver respostas em JSON.

### Express.js

O Express foi usado como framework do backend. Ele facilita a criação de rotas, controllers e middlewares.

No projeto, o Express organiza endpoints como autenticação, tarefas, ranking, inspiração, estatísticas, grupos, amigos e perfil. Esta estrutura deixa o backend mais limpo e mais fácil de manter.

### React

O React foi utilizado no frontend. Ele permite criar uma interface moderna, dinâmica e sem recarregar a página a cada ação.

No Lifinity, o React é responsável pelas páginas visuais da aplicação: login, registo, home, tarefas, ranking, estatísticas, inspiração, comunidade e perfil.

### Vite

O Vite foi usado para criar e executar o frontend React. Ele é rápido, simples de configurar e adequado para desenvolvimento moderno.

Durante o desenvolvimento, o Vite permitiu atualizar a interface rapidamente através do Hot Module Replacement, facilitando os testes visuais.

### Tailwind CSS

O Tailwind CSS foi usado para estilizar a interface. Ele permite criar layouts modernos diretamente nas classes dos componentes, sem depender de grandes ficheiros CSS separados.

No projeto, o Tailwind ajudou a construir cartões, botões, modais, barras de progresso, fundos, grelhas e páginas responsivas.

### MySQL

O MySQL foi usado como base de dados relacional. A escolha faz sentido porque o projeto tem várias entidades relacionadas entre si: utilizadores, tarefas, grupos, amizades, favoritos, estatísticas e histórico de XP.

A base de dados foi estruturada com chaves primárias, chaves estrangeiras e tabelas de relacionamento para garantir integridade e evitar dados soltos.

### phpMyAdmin / XAMPP

O XAMPP foi usado para executar o MySQL localmente e o phpMyAdmin para gerir a base de dados visualmente.

O phpMyAdmin permitiu importar scripts SQL, consultar tabelas, verificar dados e testar se as alterações estavam a ser guardadas corretamente.

### Axios

O Axios foi usado no frontend para fazer pedidos HTTP ao backend.

Sempre que o utilizador cria uma tarefa, faz login, consulta estatísticas ou interage com grupos e amigos, o React usa Axios para comunicar com a API do Node.js.

### JWT

O JWT, ou JSON Web Token, foi usado para autenticação. Depois do login, o backend gera um token que o frontend guarda localmente. Esse token é enviado nos pedidos protegidos para provar que o utilizador está autenticado.

Esta abordagem deixa o backend preparado para servir não só o site, mas também uma futura aplicação mobile.

### bcryptjs

O bcryptjs foi usado para proteger passwords. Em vez de guardar a password original, o sistema guarda uma versão encriptada/hasheada.

Isto aumenta a segurança porque, mesmo que alguém acedesse à base de dados, não conseguiria ver diretamente as passwords dos utilizadores.

### Módulo C com N-API

Uma parte importante do projeto é a integração de C com Node.js através de N-API e node-gyp.

O módulo em C foi usado para cálculos ligados à gamificação e estatísticas, como recompensa de XP, nível do utilizador e dados gerais de produtividade. Esta integração demonstra que o projeto não depende apenas de JavaScript e que é possível ligar uma linguagem de baixo nível a uma aplicação web moderna.

### Recharts

A biblioteca Recharts foi usada para criar gráficos na página de estatísticas.

Com ela, o Lifinity consegue mostrar dados como XP ganho, tarefas concluídas, tarefas criadas e tarefas perdidas ao longo do tempo.

### Git e GitHub

O Git foi usado para controlo de versões e o GitHub para guardar o projeto remotamente.

O desenvolvimento foi dividido em branches, permitindo trabalhar em funcionalidades separadas sem estragar a versão principal. Depois das funcionalidades estarem prontas, foram integradas na branch `main`.

## 4. Organização geral do projeto

O projeto está dividido em duas partes principais:

```text
Lifinity/
├── backend/
├── frontend/
└── docs/
```

### backend

A pasta `backend` contém a API feita em Node.js e Express. É aqui que ficam as rotas, controllers, configuração da base de dados, middlewares de autenticação e o módulo nativo em C.

Estrutura geral:

```text
backend/
├── index.js
├── binding.gyp
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── native/
│   └── routes/
└── package.json
```

### frontend

A pasta `frontend` contém a interface em React. É aqui que ficam as páginas, componentes, imagens e configuração visual.

Estrutura geral:

```text
frontend/
├── public/
│   └── images/
├── src/
│   ├── components/
│   ├── pages/
│   ├── App.jsx
│   └── index.css
└── package.json
```

### docs

A pasta `docs` contém a documentação, scripts SQL, diagramas, ficheiros draw.io e ficheiros de apoio à apresentação.

Esta pasta serve para guardar a parte técnica e explicativa do projeto, incluindo modelo E-R, tabelas de relacionamento, estrutura da base de dados e preparação para demonstração.

## 5. Como o progresso foi dividido

O desenvolvimento do Lifinity foi dividido por fases. Esta divisão ajudou a manter o projeto organizado e a avançar de forma progressiva.

## Fase 1 — Preparação do ambiente e estrutura

Nesta fase foi criado o ambiente inicial de desenvolvimento.

Foram preparadas as ferramentas principais:

- Visual Studio Code.
- Node.js.
- XAMPP.
- MySQL/phpMyAdmin.
- Git e GitHub.

Também foi criada a estrutura inicial do projeto, separando frontend e backend.

No backend, foi criado o servidor Express inicial. No frontend, foi criado o projeto React com Vite. Esta fase serviu para garantir que as duas partes conseguiam correr separadamente.

## Fase 2 — Base de dados e autenticação

Nesta fase foi desenhada a estrutura inicial da base de dados.

Foram pensadas as entidades principais, como utilizadores, tarefas, grupos, categorias, badges e relacionamentos. Depois, foi criado o script SQL para montar a base de dados no MySQL.

Também foi implementado o sistema de registo e login. O backend passou a permitir criar contas com password protegida por bcryptjs e iniciar sessão com geração de token JWT.

No frontend, foram criadas as páginas de login e registo, ligadas ao backend através de Axios.

Esta fase foi essencial porque quase todas as funcionalidades seguintes dependem de saber quem é o utilizador autenticado.

## Fase 3 — Gestão de tarefas e dashboard

Depois da autenticação, foi desenvolvida a gestão de tarefas.

Nesta fase, o utilizador passou a conseguir:

- Criar tarefas.
- Listar tarefas.
- Concluir tarefas.
- Eliminar ou ocultar tarefas.
- Filtrar por estado.
- Filtrar por prioridade.
- Pesquisar tarefas.

Também foi criado o dashboard principal com cartões de XP e produtividade.

Mais tarde, a lógica foi melhorada para que tarefas concluídas pudessem ser ocultadas sem apagar o histórico da base de dados. Isto foi importante porque as estatísticas e contagens não devem desaparecer só porque o utilizador limpou a lista visual.

## Fase 4 — Gamificação e módulo C

Nesta fase foi implementado o sistema de XP e níveis.

Ao concluir tarefas, o utilizador ganha XP. A quantidade de XP pode depender da prioridade da tarefa, de bónus de velocidade e de outros fatores.

O módulo em C foi integrado ao Node.js para calcular recompensas, níveis e estatísticas. Esta parte foi uma das mais técnicas do projeto, porque exigiu configurar `node-gyp`, criar um ficheiro `binding.gyp`, compilar código C e exportar funções para JavaScript.

O objetivo desta fase foi mostrar que o projeto não é apenas CRUD simples. Existe uma componente de cálculo e integração entre tecnologias.

## Fase 5 — Ranking

A página de ranking foi criada para mostrar a evolução dos utilizadores de forma competitiva.

Ela apresenta:

- Ranking global por XP.
- Posição do utilizador atual.
- Top utilizadores.
- XP total listado.
- Média de XP.
- Explicação visual do sistema de XP.

Esta página reforça a parte de gamificação e incentiva o utilizador a completar tarefas para subir na classificação.

## Fase 6 — Inspiração diária

Foi criada uma página de inspiração com versículos diários.

A página permite:

- Ver um versículo do dia.
- Gerar versículo aleatório.
- Copiar versículo.
- Guardar favoritos.
- Filtrar favoritos por tema.
- Preparar partilha de versículos com amigos ou grupos.

Por enquanto, a partilha ainda não envia mensagens reais, porque isso depende do futuro módulo de chat. No entanto, a interface já está preparada para essa evolução.

Esta funcionalidade dá ao projeto uma identidade mais pessoal e motivacional, diferenciando-o de uma aplicação de tarefas comum.

## Fase 7 — Estatísticas

A página de estatísticas foi criada para mostrar dados de produtividade ao longo do tempo.

Atualmente, permite escolher:

- O tema do gráfico: XP ganho, tarefas concluídas, tarefas criadas ou tarefas perdidas.
- O período: últimos 7 dias, 30 dias ou 1 ano.
- O tipo de gráfico: área ou barras.
- O modo de comparação, preparado para amigos e grupos.

A página também mostra informações como melhor dia, tarefas pendentes e tarefas perdidas no período.

O objetivo desta página é ajudar o utilizador a perceber padrões, acompanhar evolução e melhorar a sua organização.

## Fase 8 — Comunidade, grupos e amigos

A página de comunidade foi criada para começar a parte colaborativa do Lifinity.

Ela permite:

- Criar grupos.
- Entrar em grupos por código.
- Ver grupos do utilizador.
- Copiar código de convite.
- Ver membros do grupo.
- Procurar utilizadores.
- Enviar pedidos de amizade.
- Aceitar pedidos de amizade.
- Ver amigos adicionados.

Esta fase prepara várias funcionalidades futuras, como tarefas partilhadas, estatísticas comparadas, partilha de versículos e chat.

## Fase 9 — Perfil

A página de perfil foi criada para reunir informações principais do utilizador.

Ela mostra:

- Nome de utilizador.
- Email.
- Nível atual.
- XP acumulado.
- Progresso para o próximo nível.
- Produtividade do dia.
- Número de grupos.
- Número de amigos.
- Informações da conta.
- Ações rápidas, como ver tarefas, estatísticas e terminar sessão.

A página de perfil ainda pode evoluir no futuro com avatar, preferências, privacidade, histórico completo e edição de dados.

## Fase 10 — Design final e identidade visual

Depois das funcionalidades principais estarem prontas, foi feita uma grande atualização visual.

A interface passou a ter uma identidade mais consistente, com fundo escuro esverdeado, imagens de fundo, cartões translúcidos, texto claro e componentes mais modernos.

Também foram atualizadas várias páginas para terem uma aparência mais profissional:

- Home.
- Login.
- Registo.
- Dashboard layout.
- Tarefas.
- Ranking.
- Estatísticas.
- Inspiração.
- Comunidade.
- Perfil.

A inspiração visual veio de interfaces modernas e minimalistas, como Linear e Stripe, mas adaptada ao tema do Lifinity.

## 6. Funcionalidades atualmente implementadas

Até ao momento, o Lifinity tem as seguintes funcionalidades principais implementadas:

- Registo de utilizador.
- Login com JWT.
- Proteção de rotas privadas.
- Criação de tarefas.
- Listagem de tarefas.
- Conclusão de tarefas.
- Ocultação de tarefas concluídas sem apagar histórico.
- Eliminação de tarefas não concluídas.
- Filtros e pesquisa de tarefas.
- Sistema de XP.
- Sistema de níveis.
- Módulo C integrado ao backend.
- Ranking global.
- Página de estatísticas com gráficos.
- Página de inspiração diária.
- Versículos favoritos.
- Modal de partilha preparado para o futuro.
- Criação e entrada em grupos.
- Sistema de amigos e pedidos de amizade.
- Página de perfil.
- Layout global autenticado.
- Interface visual personalizada.
- Documentação da base de dados e diagramas.

## 7. Funcionalidades preparadas para o futuro

Algumas funcionalidades já estão pensadas ou parcialmente preparadas, mas ainda serão completadas em fases futuras:

- Chat entre utilizadores.
- Chat dentro de grupos.
- Envio real de versículos para amigos e grupos.
- Comparações reais de estatísticas com amigos.
- Comparações com média de grupos.
- Criação de tarefas destinadas a amigos ou grupos.
- Importação de tarefas por CSV.
- Avatar e edição de perfil.
- Preferências e notificações.
- Badges/conquistas visuais.
- Objetivos de longo prazo.
- Aplicação mobile no futuro.

## 8. Como fiz o backend

O backend foi desenvolvido em Node.js com Express.

A estrutura foi organizada de forma profissional, separando responsabilidades:

- `routes`: define os endpoints da API.
- `controllers`: contém a lógica de cada funcionalidade.
- `middlewares`: valida autenticação e protege rotas.
- `config`: guarda a ligação à base de dados.
- `native`: contém o código C usado no módulo nativo.

Esta organização evita que todo o código fique dentro do `index.js`, facilitando manutenção e expansão.

O `index.js` fica responsável por iniciar o servidor, carregar variáveis de ambiente, configurar CORS, ativar JSON no Express e registar as rotas.

## 9. Como fiz o frontend

O frontend foi desenvolvido em React com Vite.

As páginas foram separadas dentro da pasta `pages`, e componentes reutilizáveis foram colocados em `components`.

O sistema de navegação usa React Router. As páginas privadas ficam dentro de um layout principal, que verifica o utilizador, mostra o menu e renderiza a página atual com `Outlet`.

A comunicação com o backend é feita com Axios. Sempre que uma rota exige autenticação, o token JWT é enviado no header `Authorization`.

O design foi feito com Tailwind CSS, usando classes utilitárias para criar uma interface moderna e responsiva.

## 10. Como fiz a base de dados

A base de dados foi desenhada em MySQL.

Foram criadas entidades principais para representar o funcionamento da aplicação, como utilizadores, tarefas, grupos, amizades, favoritos, versículos e histórico de XP.

Também foram criadas tabelas de relacionamento para resolver ligações de muitos-para-muitos, como utilizadores em grupos e amizades entre utilizadores.

A estrutura procura manter integridade referencial através de chaves primárias e estrangeiras. Sempre que necessário, foram usadas estratégias como `ON DELETE CASCADE` ou `ON DELETE SET NULL`, dependendo do comportamento desejado.

Por exemplo, ocultar uma tarefa concluída não deve apagar o registo histórico da tarefa. Por isso, a aplicação diferencia apagar de ocultar.

## 11. Como fiz a autenticação

A autenticação foi implementada com JWT.

O processo funciona assim:

1. O utilizador cria conta.
2. A password é protegida com bcryptjs.
3. O utilizador faz login.
4. O backend valida email/username e password.
5. Se os dados estiverem corretos, o backend gera um token JWT.
6. O frontend guarda o token.
7. Nos pedidos seguintes, o frontend envia o token no header.
8. O middleware do backend valida o token e identifica o utilizador.

Isto permite proteger páginas e dados privados, garantindo que um utilizador só vê os seus próprios dados.

## 12. Como fiz a gamificação

A gamificação é baseada em XP e níveis.

Quando o utilizador conclui uma tarefa, recebe XP. Esse XP aumenta o total acumulado e pode fazer o utilizador subir de nível.

O cálculo do nível usa uma fórmula progressiva, em que os níveis seguintes exigem cada vez mais XP. Isto torna a evolução gradual e dá ao utilizador uma sensação de progresso.

O módulo C foi usado para calcular parte desta lógica, reforçando a componente técnica do projeto.

## 13. Como fiz as estatísticas

As estatísticas usam dados guardados na base de dados, principalmente tarefas e histórico de XP.

O backend prepara os dados conforme o período escolhido. O frontend recebe esses dados e mostra gráficos com Recharts.

O utilizador pode alternar entre diferentes métricas e tipos de gráfico. A estrutura também está preparada para comparação com amigos e grupos, embora essa parte ainda vá evoluir.

## 14. Como fiz a comunidade

A comunidade foi implementada com grupos e amigos.

Os grupos permitem criar espaços de colaboração e entrar através de códigos de convite. Cada grupo tem membros e pode ter diferentes papéis, como administrador ou membro.

O sistema de amigos permite pesquisar utilizadores, enviar pedidos e aceitar pedidos recebidos. Esta base será usada futuramente para chat, partilha de tarefas e comparações estatísticas.

## 15. Como fiz a inspiração diária

A inspiração diária foi criada para adicionar motivação ao projeto.

O backend fornece versículos e o frontend mostra um versículo diário, permite pedir um aleatório e guardar favoritos.

Os favoritos ficam associados ao utilizador e podem ser filtrados por tema. Também existe uma interface de partilha, preparada para quando houver chat e lista real de amigos/grupos para envio.

## 16. Como fiz o design

O design começou simples, mas evoluiu para uma identidade mais própria.

A interface atual usa uma estética escura, com tons verdes, cartões translúcidos, imagens de fundo e texto branco. A intenção foi criar um visual moderno, calmo e diferente de aplicações genéricas.

O layout global foi atualizado para dar mais espaço às páginas e manter uma navegação consistente.

Foram adicionadas imagens específicas em várias páginas, como ranking, estatísticas, inspiração, comunidade e perfil, para tornar a aplicação mais visual e menos vazia.

## 17. Principais dificuldades encontradas

Durante o desenvolvimento, surgiram algumas dificuldades importantes:

- Configuração do node-gyp e compilação do módulo C.
- Erros de sintaxe no ficheiro C.
- Problemas de permissões em pastas do Windows.
- Diferenças entre apagar e ocultar tarefas.
- Garantir que estatísticas não perdiam dados quando tarefas eram ocultadas.
- Atualizar a interface sem quebrar a lógica existente.
- Manter várias branches Git organizadas.
- Garantir que a base de dados estava ligada durante os testes.

Estas dificuldades ajudaram a melhorar o projeto, porque obrigaram a corrigir arquitetura, lógica e organização.

## 18. Estado atual do projeto

Atualmente, o projeto já tem uma base bastante completa para apresentação.

As funcionalidades principais estão implementadas e a interface já tem uma identidade visual consistente. A base de dados foi atualizada, os diagramas foram revistos e a documentação está a ser simplificada para a PAP.

O projeto ainda não está 100% finalizado em termos de visão futura, mas já demonstra claramente:

- CRUD completo de tarefas.
- Autenticação segura.
- Ligação frontend-backend-base de dados.
- Gamificação.
- Integração com C.
- Gráficos e estatísticas.
- Comunidade.
- Perfil.
- Inspiração diária.
- Organização profissional do código.

## 19. Próximos passos

Os próximos passos previstos são:

- Corrigir warnings no código.
- Atualizar e finalizar diagramas E-R e tabelas de relacionamento.
- Preparar a apresentação PowerPoint.
- Criar explicações simplificadas para defesa.
- Rever a base de dados final.
- Futuramente, implementar chat.
- Futuramente, permitir tarefas partilhadas com amigos e grupos.
- Futuramente, importar tarefas por CSV.
- Futuramente, completar comparação estatística com amigos e grupos.

## 20. Conclusão

O Lifinity é uma aplicação de produtividade com uma abordagem mais motivadora e completa do que uma lista simples de tarefas.

O projeto combina organização pessoal, gamificação, estatísticas, inspiração e comunidade. Tecnicamente, demonstra frontend em React, backend em Node.js, base de dados MySQL, autenticação com JWT, segurança com bcryptjs, gráficos, Git/GitHub e integração de C com Node.js.

A estrutura atual permite apresentar uma aplicação funcional e também mostrar que existe espaço real para evolução futura.

Última atualização: abril de 2026.
