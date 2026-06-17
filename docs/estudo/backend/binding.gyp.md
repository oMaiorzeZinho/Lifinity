# `backend/binding.gyp` — configuração de build do módulo C nativo

## Papel no projeto
É o **ficheiro de configuração do `node-gyp`**, a ferramenta que compila código C/C++ para um módulo que o Node.js consegue carregar. Sem este ficheiro, o módulo nativo de gamificação (`gamification.c`) não seria compilado. Cumpre o requisito da PAP de ter um "módulo C via N-API".

## Conteúdo completo
```json
{
  "targets": [
    {
      "target_name": "gamification",
      "sources": [ "src/native/gamification.c" ]
    }
  ]
}
```

## Bloco a bloco
- **`targets`** — lista de "alvos" de compilação. Aqui há só um.
- **`target_name: "gamification"`** — o nome do módulo compilado. O resultado da compilação será `build/Release/gamification.node` (um binário). É este nome que se usa do lado JavaScript ao fazer algo como `require('../build/Release/gamification.node')` (ou via `bindings`).
- **`sources: [ "src/native/gamification.c" ]`** — o(s) ficheiro(s) de código-fonte C a compilar. Caminho relativo à raiz do backend.

## Como é usado
1. Ao correr `npm install` no backend, o `node-gyp` (declarado em `devDependencies`) procura este `binding.gyp`.
2. Lê o alvo `gamification`, compila `src/native/gamification.c` com o compilador C do sistema (no Windows, os **Visual Studio Build Tools**).
3. Produz `build/Release/gamification.node`, que o JavaScript carrega para chamar funções de C (cálculo de XP/nível).

## Porquê assim
- É a **configuração mínima** necessária — só nome + fonte. Não precisa de bibliotecas externas nem flags especiais, porque `gamification.c` só faz contas simples.
- Manter a lógica de XP/nível em C é sobretudo uma **demonstração académica** (interoperabilidade C ↔ Node via N-API). Em performance pura, a diferença para JS seria irrelevante neste caso — o valor está em mostrar a integração.

## Ligações
- **Fonte compilada:** `backend/src/native/gamification.c`.
- **Ferramenta:** `node-gyp` (em `backend/package.json` → devDependencies).
- **Pré-requisito de máquina:** compilador C (Visual Studio Build Tools no Windows), conforme nota no `CLAUDE.md`.
- O módulo compilado é consumido (direta ou indiretamente) pela lógica de gamificação em `backend/src/utils/gamification.js`.
