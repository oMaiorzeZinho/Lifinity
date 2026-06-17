# `backend/src/controllers/assistantController.js` — assistente IA (Gemini + ações internas)

## Papel no projeto
É o cérebro do **assistente "Lifinity"**. Quando o utilizador escreve uma mensagem, este controlador: (1) **deteta a intenção**; (2) se for um comando conhecido (criar tarefa, listar pendentes, resumo, organização), executa-o **localmente** sem IA; (3) caso contrário, encaminha para a **API do Google Gemini**. Guarda tudo em `ASSISTANT_MESSAGE`. É um dos "pontos altos" do projeto.

## Constantes e helpers
```js
const GEMINI_FALLBACK_MESSAGE = 'Ainda nao tenho a API Gemini configurada, mas posso ajudar com tarefas...';
const SYSTEM_PROMPT = 'Es o Assistente Lifinity, um assistente de produtividade... Responde em portugues europeu, de forma curta, util e natural.';
```
- `SYSTEM_PROMPT` — instrução de sistema enviada à Gemini (define a "personalidade" e a língua: **pt-PT, respostas curtas**).
- `GEMINI_FALLBACK_MESSAGE` — resposta se **não** houver chave de API configurada (a app funciona à mesma, só sem IA real).

```js
const normalizeText = (v) => String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
```
- **Normaliza texto para deteção de intenção:** `NFD` separa letra+acento, o regex remove os acentos, e passa a minúsculas. Assim `"Cria Tarefa"` e `"cria tarefá"` casam com os mesmos padrões — robusto a acentos/maiúsculas.

```js
const taskVisibilitySql = `( t.iduser = ? OR EXISTS(...TASK_ASSIGNEE...) OR EXISTS(...GROUP_TASK...) )`;
const getVisibilityParams = (iduser) => [iduser, iduser, iduser];
```
Mesma condição de visibilidade do `taskController` (tarefas próprias/atribuídas/de grupo), reutilizada para o assistente "ver" as tarefas certas.

`insertAssistantMessage(executor, {...})` — insere uma mensagem em `ASSISTANT_MESSAGE` e devolve a linha gravada (para enviar ao frontend).

## `detectIntent(content)` — classificador por regex
```js
const commandPrefix = '(?:por favor\\s+|pf\\s+|podes\\s+|pode\\s+|consegues\\s+|consegue\\s+)?';
if (/^prefixo?(cria tarefa|criar tarefa|adiciona tarefa|nova tarefa|lembra-me de)\b/) return 'create_task';
if (/\btarefas pendentes\b|\blista tarefas\b|\bo que tenho para fazer\b/) return 'list_pending_tasks';
if (/\bresumo de produtividade\b|\bprodutividade\b|\bestatisticas\b/) return 'productivity_summary';
if (/\borganiza as minhas tarefas\b|.../) return 'organization_suggestion';
return 'gemini';
```
- Deteta 4 **intenções internas** por expressões regulares (no texto normalizado), permitindo prefixos de cortesia opcionais ("por favor", "podes"...). Se nada casar → `'gemini'` (manda para a IA).
- **Porquê regex e não IA para tudo:** os comandos diretos (criar tarefa, etc.) são tratados localmente — **mais rápido, grátis e fiável** que depender da IA; a IA fica para conversa livre. (Esta deteção foi afinada no commit `6727a484`.)

## Ações internas (sem IA)
- **`createTaskFromMessage`** — `extractTaskTitle` remove o prefixo de comando e usa o resto como título; insere uma `TASK` simples (prioridade `media`, sem prazo). Se não houver título, pede-o.
- **`getPendingTasks(iduser, limit)`** — tarefas pendentes **visíveis**, ordenadas por prioridade (`FIELD(priority,'alta','media','baixa')`), depois por prazo (nulls no fim) e criação. (`FIELD(...)` ordena por uma ordem personalizada.)
- **`listPendingTasks`** — formata as pendentes numa lista numerada com prazos.
- **`getProductivitySummary`** — conta totais/concluídas/pendentes/perdidas (visíveis) + XP total e calcula taxa de conclusão; devolve um resumo em texto.
- **`suggestOrganization`** — pega nas 5 pendentes top e sugere uma ordem de ataque + dica ("transforma a primeira num passo de 15 minutos").
- **`runInternalAction(intent, ...)`** — despacha a intenção para o handler certo.

## Integração com a Gemini
```js
const getRecentAssistantMessages = ... LIMIT 8 ... .reverse();   // últimas 8, em ordem cronológica
const extractGeminiText = (data) => data?.candidates?.[0]?.content?.parts ... .map(p=>p.text)...join('\n');
```
- `getRecentAssistantMessages` traz as **últimas 8 mensagens** (contexto da conversa).
- `extractGeminiText` navega a resposta da Gemini (`candidates[0].content.parts[].text`) com *optional chaining* (à prova de formatos inesperados).

### `callGemini(iduser, content)`
```js
if (!process.env.GEMINI_API_KEY) return GEMINI_FALLBACK_MESSAGE;   // sem chave → fallback
if (typeof fetch !== 'function') return '...precisa de Node recente com fetch...';
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
// monta conversationContext alternando roles user/model (a Gemini exige alternância)
const response = await fetch(url, { method:'POST', headers:{'x-goog-api-key': apiKey}, body: JSON.stringify({
   systemInstruction: { parts:[{text: SYSTEM_PROMPT}] },
   contents: [...conversationContext, { role:'user', parts:[{text: content}] }],
   generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
})});
```
- Usa o **`fetch` global** (Node 18+). Modelo por defeito **`gemini-2.5-flash`** (configurável por `GEMINI_MODEL`). 
  - ⚠️ Nota: as instruções da PAP falavam em "Gemini 1.5 Flash", mas o **default no código é 2.5-flash**.
- Constrói o **contexto da conversa** mapeando o histórico para `role: 'user'|'model'` e **filtra para garantir alternância** de papéis (a API da Gemini rejeita duas mensagens seguidas do mesmo papel). Começa sempre por uma mensagem de `user`.
- `generationConfig` limita a resposta (temperatura 0.7 = algo criativo; máx. 500 tokens = respostas curtas).
- **Tratamento de erros robusto:** se a resposta não for OK, regista e devolve uma mensagem amigável; idem no `catch`. **Nunca** rebenta a app.

## Endpoints

### `getAssistantMessages`
Devolve **todo** o histórico do utilizador (`ORDER BY created_at ASC`) — para reconstruir a conversa ao abrir.

### `sendAssistantMessage` — o fluxo completo
```js
1. valida content não vazio
2. (transação) insere a mensagem do UTILIZADOR → commit  // garante que a pergunta fica gravada
3. intent = detectIntent(content)
4. actionResult = intent==='gemini' ? { content: await callGemini(...) } : await runInternalAction(...)
5. insere a mensagem do ASSISTENTE (com action_type)
6. safeUnlockAchievementsForUser(iduser)   // badges assistant_1 / assistant_10
7. responde { reply, messages:[userMessage, assistantMessage], action_type, data }
```
- A mensagem do utilizador é gravada **primeiro e numa transação própria** — assim, mesmo que a Gemini falhe a seguir, a pergunta não se perde.
- A resposta inclui as **duas** mensagens (para a UI as adicionar de uma vez) e o `action_type` (para a UI saber se foi uma ação interna ou IA), além de `data` opcional (ex.: o `idtask` criado).
- Desbloqueia os badges de uso do assistente.

## Porquê este design (resumo)
- **Híbrido regex + LLM:** comandos diretos resolvidos localmente (rápido/grátis/determinístico); conversa livre delegada à Gemini. O melhor dos dois mundos.
- **Degradação graciosa:** sem chave de API ou com erro, há sempre uma resposta sensata — a demo nunca "parte".
- **Contexto conversacional:** envia histórico recente à Gemini para respostas coerentes.

## Ligações
- **Tabelas:** `ASSISTANT_MESSAGE`, `TASK`, `XP_HISTORY` (+ visibilidade via `TASK_ASSIGNEE`/`GROUP_TASK`/`GROUP_MEMBER`).
- **Externo:** API Google Gemini (`GEMINI_API_KEY`, `GEMINI_MODEL` no `.env`).
- **Reutiliza:** `safeUnlockAchievementsForUser`.
- **Rotas:** `assistantRoutes.js`. **Frontend:** `Chat.jsx` (modo assistente). **Android:** `AssistantActivity`.
