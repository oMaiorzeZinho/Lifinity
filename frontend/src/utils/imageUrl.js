const API_URL = import.meta.env.VITE_API_URL;

// Constrói o URL completo de uma imagem guardada no backend.
// Os caminhos vêm da BD como '/uploads/avatars/...', e o servidor
// está na raiz do API_URL sem o sufixo '/api'.
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL.replace(/\/api\/?$/, '')}${path}`;
};
