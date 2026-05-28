# Lifinity — Contexto do Projeto

## O que é

Aplicação web de produtividade pessoal com gamificação. Permite gerir tarefas, ganhar XP, subir de nível, ver rankings, guardar versículos favoritos, criar grupos, adicionar amigos e acompanhar estatísticas. Inclui também app Android nativa.

O projeto serve como demonstração académica de fullstack: frontend React, backend Node.js/Express, base de dados MySQL, módulo nativo em C (N-API), e app Android em Kotlin/Jetpack Compose.

## Stack

- **Frontend**: React + Vite + Tailwind CSS + Recharts + Axios
- **Backend**: Node.js + Express + JWT + bcryptjs + módulo C via N-API/node-gyp
- **Base de dados**: MySQL (gerida com XAMPP/phpMyAdmin)
- **Android**: Kotlin + Jetpack Compose (pasta `android/LifinityAndroid/`)
- **Controlo de versões**: Git + GitHub (branch principal: `main`)

## Estrutura

```
Lifinity/
├── backend/
│   ├── index.js
│   ├── binding.gyp          ← configuração do módulo C
│   ├── src/
│   │   ├── config/db.js
│   │   ├── routes/          ← auth, tasks, ranking, stats, inspiration, friends, groups, chat, achievements, notifications, assistant
│   │   ├── controllers/     ← lógica de cada rota
│   │   ├── middlewares/authMiddleware.js
│   │   ├── native/gamification.c  ← cálculos XP/nível em C
│   │   └── utils/           ← gamification.js, achievements.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           ← Login, Register, Home, Tasks, Ranking, Statistics, Inspiration, Community, Profile, Dashboard, Chat
│   │   ├── components/      ← componentes reutilizáveis
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
├── android/LifinityAndroid/  ← app Android Kotlin/Jetpack Compose
└── docs/OVERALL_LIFINITY.md  ← documentação completa do projeto
```

## Arrancar o projeto localmente

**Pré-requisitos**: Node.js, XAMPP (MySQL ativo), build tools para node-gyp (Visual Studio Build Tools no Windows)

```powershell
# Backend
cd D:\Lifinity\backend
npm install
node index.js        # corre em http://localhost:3001 (ou porta configurada no .env)

# Frontend (novo terminal)
cd D:\Lifinity\frontend
npm install
npm run dev          # corre em http://localhost:5173
```

O ficheiro `backend/.env` contém as variáveis de ambiente (porta, credenciais MySQL, segredo JWT). **Não está no git.**

## Convenções

- Idioma do código: inglês (nomes de variáveis, funções, rotas)
- Idioma da UI: português
- Idioma dos commits: português
- Branch de trabalho atual: `feature/android-ui-redesign`
- Branch principal: `main`

## Estado atual do desenvolvimento

- Web app: funcionalidades principais completas (tarefas, XP, ranking, estatísticas, inspiração, comunidade, perfil, chat, conquistas, notificações, assistente)
- Android: em redesign de UI (branch `feature/android-ui-redesign`), usa Jetpack Compose

## Notas importantes para o Claude

- Este projeto está numa **pendrive** (drive D:). O caminho muda conforme a máquina — mas normalmente é `D:\Lifinity`
- O módulo C (`gamification.c`) precisa de ser compilado com `npm install` no backend (node-gyp faz isso automaticamente)
- A base de dados MySQL corre localmente via XAMPP — verificar se está ativo antes de testar o backend
- A documentação completa do projeto está em `docs/OVERALL_LIFINITY.md`

## Memória persistente

A pasta `.claude/memory/` dentro do projeto contém ficheiros de memória privados (não vão para o GitHub via .gitignore).
**No início de cada conversa, lê todos os ficheiros em `.claude/memory/` para recuperar contexto.**
**Quando aprenderes algo relevante sobre o projeto ou o utilizador, guarda em `.claude/memory/` em formato markdown.**

Ficheiros de memória usam este formato:
```
---
type: user | project | feedback | reference
---
conteúdo
```
