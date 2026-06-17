# `frontend/src/components/DailyVerseWidget.jsx` — widget do versículo do dia

## Papel no projeto
Pequeno widget (no dashboard) que mostra o **versículo do dia**, pode expandir-se num cartão, permite **favoritar** e abrir a página de Inspiração.

## Bloco a bloco
```jsx
const [isOpen, setIsOpen] = useState(false);   // cartão expandido ou só o botão
const [verse, setVerse] = useState(null);      // o versículo
```

```jsx
useEffect(() => {
  const loadVerse = async () => {
    const token = localStorage.getItem('token'); if (!token) return;
    const response = await axios.get(`${API_URL}/inspiration/daily`, { headers: {...} });
    setVerse(response.data);
  };
  loadVerse();
}, []);
```
Ao montar, carrega o versículo do dia de `GET /inspiration/daily` (ver `inspirationController.getDailyVerse`). A resposta inclui `isFavorite`.

```jsx
const toggleFavorite = async () => {
  const response = await axios.post(`${API_URL}/inspiration/favorite/${verse.idverse}`, {}, { headers: {...} });
  setVerse((prev) => prev ? { ...prev, isFavorite: response.data.isFavorite } : prev);
};
```
Favoritar/desfavoritar (toggle no backend). **Atualiza o estado com o `isFavorite` devolvido** pelo servidor (a "verdade" vem do backend, não se adivinha localmente).

```jsx
if (!verse) return null;   // enquanto não há versículo, não desenha nada
```
**Renderização condicional:** o componente é "invisível" até ter dados (evita mostrar um cartão vazio).

O JSX alterna entre:
- **Fechado:** um botão "Versículo do Dia".
- **Aberto:** um cartão com a referência (`book chapter:verse`), o texto, uma estrela (★) para favoritar (amarela se favorito) e um botão "Abrir Inspiração" que navega para `/dashboard/inspiration`.

## Ligações
- **Backend:** `GET /api/inspiration/daily`, `POST /api/inspiration/favorite/:idverse`.
- **Página completa:** `Inspiration.jsx`.
- **Usado em:** `Dashboard.jsx`.
