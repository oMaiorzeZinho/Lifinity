import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const cardClass = 'lifinity-card';

const inputClass =
  'lifinity-input w-full rounded-2xl px-5 py-4 text-sm font-bold';

const labelClass = 'lifinity-muted-label mb-2 block';

const MESSAGE_MAX_LENGTH = 2000;

// Anexos: limites espelham os do backend (uploadMiddleware.js) para dar
// feedback imediato no cliente antes de enviar.
const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain'
];
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',');

// Mostra o tamanho do ficheiro de forma legível (KB/MB)
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Página "Contacte-nos" — existe em dois sítios:
// - /dashboard/contact (dentro do layout do dashboard)
// - /contact (pública, acessível a partir do login, com wrapper próprio)
const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }

  const location = useLocation();
  const navigate = useNavigate();

  // Fora do dashboard, a página ganha fundo e botão "Voltar ao login"
  const isPublicPage = !location.pathname.startsWith('/dashboard');

  // Email inteligente: se houver sessão iniciada, usamos o email da conta e
  // escondemos o campo. Lê-se o token/user do localStorage (mesmo padrão do
  // resto da app). Calculado uma vez (a sessão não muda dentro desta página).
  const { isAuthenticated, accountEmail } = useMemo(() => {
    const token = localStorage.getItem('token');
    let email = '';
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
      email = savedUser?.email || '';
    } catch {
      email = '';
    }
    return { isAuthenticated: Boolean(token), accountEmail: email };
  }, []);

  const handleChange = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
  };

  // Valida e acrescenta os ficheiros escolhidos (lista branca + tamanho + máximo)
  const handleFilesSelected = (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = ''; // permite voltar a escolher o mesmo ficheiro após remover
    if (selected.length === 0) return;

    const nextFiles = [...files];
    let error = null;

    for (const file of selected) {
      if (nextFiles.length >= MAX_FILES) {
        error = `Podes anexar no máximo ${MAX_FILES} ficheiros.`;
        break;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        error = `"${file.name}": formato não suportado. Usa imagens, PDF ou texto.`;
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        error = `"${file.name}": excede o limite de 5MB.`;
        continue;
      }
      // Evita duplicados (mesmo nome e tamanho)
      if (nextFiles.some((f) => f.name === file.name && f.size === file.size)) {
        continue;
      }
      nextFiles.push(file);
    }

    setFiles(nextFiles);
    setFeedback(error ? { type: 'error', text: error } : null);
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSending(true);
      setFeedback(null);

      // Há ficheiros => multipart/form-data (FormData). O axios define o
      // Content-Type (com boundary) automaticamente para FormData.
      const data = new FormData();
      data.append('name', form.name);

      // Email: autenticado -> email da conta; público -> email escrito no campo.
      const emailToSend = isAuthenticated ? accountEmail : form.email;
      if (emailToSend && emailToSend.trim()) {
        data.append('email', emailToSend.trim());
      }

      // Telefone é opcional — só vai se estiver preenchido
      if (form.phone.trim()) {
        data.append('phone', form.phone);
      }

      data.append('message', form.message);

      // Anexos (campo 'attachments', até 3)
      files.forEach((file) => data.append('attachments', file));

      const response = await axios.post(`${API_URL}/contact`, data);

      setFeedback({
        type: 'success',
        text: response.data?.message || 'Mensagem enviada com sucesso!'
      });

      // Limpa o formulário e os anexos após sucesso
      setForm({ name: '', email: '', phone: '', message: '' });
      setFiles([]);
    } catch (err) {
      console.error('Erro ao enviar mensagem de contacto:', err);
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Não foi possível enviar a mensagem.'
      });
    } finally {
      setSending(false);
    }
  };

  const content = (
    <div className="space-y-8">
      {/* HERO */}
      <div className={`${cardClass} p-8 md:p-10 rounded-[2.5rem]`}>
        <p className="lifinity-muted-label mb-3 italic">
          Fala connosco
        </p>

        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-(--lifinity-text)">
          Contacte-nos
        </h2>

        <p className="font-medium mt-4 max-w-2xl leading-relaxed text-(--lifinity-text-muted)">
          Tens uma dúvida, sugestão ou encontraste um problema? Envia-nos uma
          mensagem e entraremos em contacto contigo o mais depressa possível.
        </p>
      </div>

      {/* FORMULÁRIO: largura limitada e centrado horizontalmente sob o hero */}
      <div className={`${cardClass} p-6 md:p-8 rounded-4xl max-w-2xl mx-auto`}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome + Email (o email só aparece para quem NÃO tem sessão) */}
          <div
            className={`grid grid-cols-1 gap-5 ${
              isAuthenticated ? '' : 'md:grid-cols-2'
            }`}
          >
            <div>
              <label htmlFor="contact-name" className={labelClass}>
                Nome
              </label>
              <input
                id="contact-name"
                type="text"
                placeholder="O teu nome"
                value={form.name}
                onChange={handleChange('name')}
                className={inputClass}
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            {!isAuthenticated && (
              <div>
                <label htmlFor="contact-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="teu@email.com"
                  value={form.email}
                  onChange={handleChange('email')}
                  className={inputClass}
                  required
                />
              </div>
            )}
          </div>

          {/* Nota discreta para quem tem sessão: respondemos para o email da conta */}
          {isAuthenticated && (
            <p className="lifinity-card-soft p-3 rounded-2xl text-xs font-bold text-(--lifinity-text-muted)">
              Vamos responder para o email da tua conta
              {accountEmail ? ` (${accountEmail})` : ''}.
            </p>
          )}

          <div>
            <label htmlFor="contact-phone" className={labelClass}>
              Telefone (opcional)
            </label>
            <input
              id="contact-phone"
              type="tel"
              placeholder="912 345 678"
              value={form.phone}
              onChange={handleChange('phone')}
              className={inputClass}
              maxLength={20}
            />
          </div>

          <div>
            <label htmlFor="contact-message" className={labelClass}>
              Mensagem
            </label>
            <textarea
              id="contact-message"
              placeholder="Escreve aqui a tua mensagem..."
              value={form.message}
              onChange={handleChange('message')}
              className={`${inputClass} resize-none h-44`}
              required
              minLength={10}
              maxLength={MESSAGE_MAX_LENGTH}
            />

            {/* Contador de caracteres da mensagem */}
            <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-right text-(--lifinity-text-muted)">
              {form.message.length}/{MESSAGE_MAX_LENGTH}
            </p>
          </div>

          {/* ANEXOS (imagens / PDF / texto, até 3 ficheiros, 5MB cada) */}
          <div>
            <label className={labelClass}>
              Anexos (opcional)
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="contact-attachments"
                className={`lifinity-button-secondary px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer ${
                  files.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                + Anexar ficheiro
              </label>
              <input
                id="contact-attachments"
                type="file"
                multiple
                accept={ACCEPT_ATTR}
                onChange={handleFilesSelected}
                disabled={files.length >= MAX_FILES}
                className="hidden"
              />

              <span className="text-[10px] font-black uppercase tracking-widest text-(--lifinity-text-muted)">
                Imagens, PDF ou texto · até {MAX_FILES} · máx. 5MB cada
              </span>
            </div>

            {/* Lista dos ficheiros escolhidos, com botão de remover */}
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="lifinity-card-soft p-3 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <span className="text-xs font-bold truncate text-(--lifinity-text)">
                      {file.name}
                      <span className="text-(--lifinity-text-muted) font-medium">
                        {' '}· {formatFileSize(file.size)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="shrink-0 text-[10px] font-black uppercase tracking-widest text-(--lifinity-danger)"
                      aria-label={`Remover ${file.name}`}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {feedback && (
            <div
              className={`lifinity-card-soft p-4 rounded-2xl text-sm font-bold ${
                feedback.type === 'success'
                  ? 'text-(--lifinity-success)'
                  : 'lifinity-danger-surface'
              }`}
              role="status"
              aria-live="polite"
            >
              {feedback.text}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="lifinity-button-primary px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'A enviar...' : 'Enviar mensagem'}
          </button>
        </form>
      </div>
    </div>
  );

  // Dentro do dashboard, o layout (fundo, header) já vem do DashboardLayout
  if (!isPublicPage) return content;

  // Versão pública: fundo próprio + botão para voltar ao login
  return (
    <div className="lifinity-page min-h-screen transition-colors" data-theme="dark">
      <div className="mx-auto max-w-5xl p-6 md:p-10 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="lifinity-button-secondary px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          ← Voltar ao login
        </button>

        {content}
      </div>
    </div>
  );
};

export default Contact;
