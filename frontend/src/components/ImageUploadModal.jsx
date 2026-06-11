import { useEffect, useState } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUrl';

const API_URL = import.meta.env.VITE_API_URL;

// Modal reutilizável para upload de imagens (avatar e cover).
// Props:
// - isOpen / onClose: controlo de visibilidade
// - title: titulo do modal (ex.: "Imagem de perfil")
// - endpoint: caminho da API (ex.: '/users/me/avatar')
// - currentImage: caminho da imagem atual (para pré-visualização)
// - onSuccess: callback chamado após upload com sucesso
const ImageUploadModal = ({ isOpen, onClose, title, endpoint, currentImage, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Limpa o estado sempre que o modal fecha
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError('');
    }
  }, [isOpen]);

  // Liberta o object URL da pré-visualização anterior (evita fugas de memória)
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedFile) {
      setError('Escolhe uma imagem primeiro.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const token = localStorage.getItem('token');

      // FormData com o campo 'image' — o axios define o Content-Type sozinho
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await axios.put(`${API_URL}${endpoint}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Atualiza o utilizador guardado e avisa o resto da aplicação
      if (response.data?.user) {
        const savedUser = localStorage.getItem('user');
        const mergedUser = {
          ...(savedUser ? JSON.parse(savedUser) : {}),
          ...response.data.user
        };

        localStorage.setItem('user', JSON.stringify(mergedUser));
        window.dispatchEvent(new Event('lifinity-user-updated'));
      }

      onSuccess?.(response.data);
      onClose();
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      setError(err.response?.data?.message || 'Não foi possível guardar a imagem.');
    } finally {
      setSaving(false);
    }
  };

  // Mostra a nova imagem selecionada; sem seleção, mostra a atual (se existir)
  const displayedImage = previewUrl || getImageUrl(currentImage);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-(--lifinity-overlay) p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="lifinity-card w-full max-w-lg rounded-4xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-upload-title"
      >
        <div className="border-b border-(--lifinity-border) p-6">
          <p className="lifinity-muted-label mb-2 italic">
            Personalização
          </p>

          <h3
            id="image-upload-title"
            className="text-2xl font-black tracking-tight text-(--lifinity-text)"
          >
            {title}
          </h3>
        </div>

        <div className="space-y-5 p-6">
          {/* Pré-visualização da imagem (atual ou nova) */}
          <div className="lifinity-card-soft rounded-2xl p-4 flex flex-col items-center gap-3">
            {displayedImage ? (
              <img
                src={displayedImage}
                alt="Pré-visualização"
                className="max-h-52 w-full rounded-xl object-cover border border-(--lifinity-border)"
              />
            ) : (
              <p className="py-10 text-xs font-bold uppercase tracking-widest text-(--lifinity-text-muted)">
                Sem imagem definida
              </p>
            )}

            <p className="lifinity-muted-label">
              {previewUrl ? 'Nova imagem selecionada' : 'Imagem atual'}
            </p>
          </div>

          {/* Input de ficheiro estilizado como botão */}
          <label className="lifinity-button-secondary block w-full cursor-pointer rounded-2xl px-5 py-4 text-center text-[10px] font-black uppercase tracking-widest">
            Escolher imagem
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <p className="text-xs font-bold text-(--lifinity-text-muted)">
            Formatos aceites: JPG, PNG ou WebP. Tamanho máximo: 2MB.
          </p>

          {error && (
            <div className="lifinity-card-soft lifinity-danger-surface p-4 rounded-2xl text-sm font-bold">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-(--lifinity-border) p-6">
          <button
            type="button"
            onClick={onClose}
            className="lifinity-button-secondary px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="lifinity-button-primary px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
