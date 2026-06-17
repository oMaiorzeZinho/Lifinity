# `frontend/src/components/ImageUploadModal.jsx` — modal reutilizável de upload de imagem

## Papel no projeto
Modal genérico para carregar **avatar ou cover**. É reutilizável: recebe por *props* o título e o endpoint, por isso serve para os dois casos.

## Props
```jsx
const ImageUploadModal = ({ isOpen, onClose, title, endpoint, currentImage, onSuccess }) => { ... }
```
- `isOpen`/`onClose` — visibilidade; `title` — título; `endpoint` — caminho da API (ex.: `/users/me/avatar`); `currentImage` — imagem atual (pré-visualização); `onSuccess` — callback após sucesso.

## Estado e efeitos
```jsx
const [selectedFile, setSelectedFile] = useState(null);
const [previewUrl, setPreviewUrl] = useState(null);
const [error, setError] = useState(''); const [saving, setSaving] = useState(false);

useEffect(() => { if (!isOpen) { /* limpa selectedFile, previewUrl, error */ } }, [isOpen]);  // reset ao fechar
useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);     // liberta memória
```
- Primeiro efeito: **limpa o estado** sempre que o modal fecha (não fica "sujo" para a próxima abertura).
- Segundo efeito: **`URL.revokeObjectURL`** liberta o *object URL* da pré-visualização anterior — importante para **não acumular memória** (cada `URL.createObjectURL` reserva memória até ser revogado).

```jsx
const handleFileChange = (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file));   // pré-visualização instantânea local
};
```
Ao escolher um ficheiro, gera um URL local para o **pré-visualizar imediatamente** (sem upload ainda).

```jsx
const handleSave = async () => {
  if (!selectedFile) { setError('Escolhe uma imagem primeiro.'); return; }
  const token = localStorage.getItem('token');
  const formData = new FormData(); formData.append('image', selectedFile);     // campo 'image' (igual ao multer .single('image'))
  const response = await axios.put(`${API_URL}${endpoint}`, formData, { headers: { Authorization: `Bearer ${token}` } });
  if (response.data?.user) {
    const mergedUser = { ...(JSON.parse(localStorage.getItem('user')||'{}')), ...response.data.user };
    localStorage.setItem('user', JSON.stringify(mergedUser));
    window.dispatchEvent(new Event('lifinity-user-updated'));     // avisa o resto da app
  }
  onSuccess?.(response.data); onClose();
};
```
- Envia o ficheiro como **`FormData`** com o campo `image` (coincide com `uploadAvatar.single('image')` no backend). O axios define o `Content-Type: multipart/form-data` automaticamente.
- Com a resposta, **funde** o utilizador atualizado no `localStorage` e dispara **`lifinity-user-updated`** para que o header/perfil mostrem logo a nova imagem.
- `onSuccess?.(...)` — *optional chaining* na chamada: só chama se a prop foi passada.
- Erros mostram a mensagem do backend (`err.response?.data?.message`).

## JSX (resumo)
Overlay escuro com `backdrop-blur`; clicar fora (`onClick={onClose}`) fecha, mas clicar dentro **não** (`e.stopPropagation()`). Mostra a pré-visualização (nova ou atual via `getImageUrl`), um `input type="file"` escondido estilizado como botão, a nota de formatos/tamanho, e botões Cancelar/Guardar (com estado "A guardar..."). Tem atributos de acessibilidade (`role="dialog"`, `aria-modal`).

## Ligações
- **Backend:** `PUT /api/users/me/avatar` e `/cover` (via `uploadMiddleware` + `userController`).
- **Utilitário:** `getImageUrl`.
- **Evento:** dispara `lifinity-user-updated`.
- **Usado em:** `Profile.jsx`.
