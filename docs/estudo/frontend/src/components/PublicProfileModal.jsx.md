# `frontend/src/components/PublicProfileModal.jsx` — perfil público de outro utilizador

## Papel no projeto
Modal que mostra o **perfil público** de outro utilizador (avatar, cover, nível, bio, conquistas, grupos em comum). Abre quando se clica num utilizador (ranking, comunidade...).

## Setup
```jsx
const categoryLabels = { level: 'Nivel', xp: 'XP', tasks: 'Atividades', friends: 'Amigos', groups: 'Grupos', chat: 'Chat', verses: 'Versiculos', assistant: 'Assistente' };
const PublicProfileModal = ({ iduser, isOpen, onClose }) => { ... }
```
- `categoryLabels` — traduz a `category` dos badges (do backend, em inglês) para etiquetas em português na UI.

## Carregamento
```jsx
useEffect(() => {
  if (!isOpen || !iduser) { setProfile(null); setError(''); return; }
  const fetchProfile = async () => {
    const response = await axios.get(`${API_URL}/users/${iduser}/public-profile`, { headers: {...} });
    setProfile(response.data);
  };
  fetchProfile();
}, [iduser, isOpen]);
```
- Sempre que abre (`isOpen`) **com** um `iduser`, vai buscar `GET /users/:iduser/public-profile` (ver `userController.getPublicProfile`).
- O efeito **depende de `[iduser, isOpen]`** — recarrega ao trocar de utilizador ou ao reabrir.
- Trata o erro 404 ("Utilizador nao encontrado") à parte dos outros.

## Renderização
```jsx
const joinedDate = profile?.created_at ? new Date(...).toLocaleDateString('pt-PT', {...}) : null;
```
Formata a data de adesão em português ("12 de junho de 2026").

Estrutura por estados: **loading** → "A carregar perfil..."; **error** → mensagem; **profile** → o conteúdo:
- **Cabeçalho com cover:** se houver `cover_image`, usa-a como fundo com um **gradiente escuro por cima** (`linear-gradient(rgba(...),rgba(...)), url(...)`) para o texto continuar legível. Avatar (ou inicial do nome como *fallback*) + nome + "No Lifinity desde ...".
- **Nível** em destaque.
- **"Sobre"** (bio) — só aparece se houver bio (`profile.bio && trim !== ''`); `whitespace-pre-wrap` preserva quebras de linha.
- **Estatísticas:** nº de conquistas (`totalUnlockedBadges`) e grupos em comum (`commonGroups.length`).
- **Conquistas destacadas:** mapeia `highlightedBadges` (mostra "Destaque N" ou "Recente N", nome, descrição e categoria traduzida); se vazio, mensagem.
- **Grupos em comum:** mapeia `commonGroups` (nome, descrição, nº de membros); se vazio, mensagem.

Padrão de modal: clicar fora fecha; `e.stopPropagation()` impede fechar ao clicar dentro; `role="dialog"`/`aria-modal`.

## Ligações
- **Backend:** `GET /api/users/:iduser/public-profile`.
- **Utilitário:** `getImageUrl` (avatar e cover).
- **Usado por:** `Ranking.jsx`, `Community.jsx` (ao clicar num utilizador).
