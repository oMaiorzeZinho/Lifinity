import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const cardClass = 'lifinity-card';

const inputClass =
  'lifinity-input w-full rounded-2xl px-5 py-4 text-sm font-bold';

const labelClass = 'lifinity-muted-label mb-2 block';

const MESSAGE_MAX_LENGTH = 2000;

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

  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }

  const location = useLocation();
  const navigate = useNavigate();

  // Fora do dashboard, a página ganha fundo e botão "Voltar ao login"
  const isPublicPage = !location.pathname.startsWith('/dashboard');

  const handleChange = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSending(true);
      setFeedback(null);

      const response = await axios.post(`${API_URL}/contact`, {
        name: form.name,
        email: form.email,
        // O telefone é opcional — só vai se estiver preenchido
        ...(form.phone.trim() ? { phone: form.phone } : {}),
        message: form.message
      });

      setFeedback({
        type: 'success',
        text: response.data?.message || 'Mensagem enviada com sucesso!'
      });

      // Limpa o formulário após sucesso
      setForm({ name: '', email: '', phone: '', message: '' });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          </div>

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
