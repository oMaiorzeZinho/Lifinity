import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.response?.data?.error || fallback;

// Modal de recuperação de palavra-passe em 3 passos:
//  1) Email   -> pede o código (forgot-password)
//  2) Código  -> valida o código de 6 dígitos (verify-reset-code)
//  3) Nova pw -> define a nova palavra-passe (reset-password)
// onClose: fecha o modal. onSuccess(msg): avisa o Login para mostrar sucesso.
const PasswordResetModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(''); // nota informativa (ex.: "código enviado")

  // Passo 1 — pedir o código por email
  const handleRequestCode = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (!email.trim()) {
      setError('Indica o teu email.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email: email.trim()
      });
      setInfo(response.data?.message || 'Enviámos um código para o teu email.');
      setStep(2);
    } catch (err) {
      // 404 => email não existe (aviso claro, fica no passo 1)
      setError(getErrorMessage(err, 'Não foi possível enviar o código.'));
    } finally {
      setLoading(false);
    }
  };

  // Reenviar o código (continua no passo 2)
  const handleResendCode = async () => {
    setError('');
    setInfo('');
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email: email.trim()
      });
      setInfo(response.data?.message || 'Enviámos um novo código para o teu email.');
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível reenviar o código.'));
    } finally {
      setLoading(false);
    }
  };

  // Passo 2 — verificar o código
  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (!code.trim()) {
      setError('Escreve o código que recebeste.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/auth/verify-reset-code`, {
        email: email.trim(),
        code: code.trim()
      });
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err, 'Código inválido ou expirado.'));
    } finally {
      setLoading(false);
    }
  };

  // Passo 3 — definir a nova palavra-passe
  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (newPassword.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email: email.trim(),
        code: code.trim(),
        newPassword
      });
      // Sucesso: avisa o Login e fecha o modal
      onSuccess(response.data?.message || 'Palavra-passe alterada! Inicia sessão.');
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível alterar a palavra-passe.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    // .lifinity-page no overlay para os tokens clay resolverem (a página de Login
    // não é uma lifinity-page); fundo translúcido para escurecer o que está atrás.
    <div
      className="lifinity-page fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
      style={{ background: 'var(--lifinity-overlay)', minHeight: '100vh' }}
    >
      <div className="lifinity-card w-full max-w-md rounded-3xl p-8 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="lifinity-muted-label">Recuperar palavra-passe</p>
            <h2 className="mt-2 text-2xl font-black text-(--lifinity-text)">
              {step === 1 && 'Indica o teu email'}
              {step === 2 && 'Insere o código'}
              {step === 3 && 'Nova palavra-passe'}
            </h2>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-(--lifinity-text-muted)">
              Passo {step} de 3
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lifinity-button-secondary w-10 h-10 rounded-xl flex items-center justify-center"
            title="Fechar"
            aria-label="Fechar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PASSO 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-sm font-medium text-(--lifinity-text-secondary)">
              Enviamos-te um código de 6 dígitos para o email da tua conta.
            </p>
            <label className="block">
              <span className="sr-only">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lifinity-input rounded-2xl px-4 py-4 text-sm font-bold"
                placeholder="exemplo@email.com"
                autoComplete="email"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="lifinity-button-primary w-full px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'A enviar...' : 'Enviar código'}
            </button>
          </form>
        )}

        {/* PASSO 2 — Código */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm font-medium text-(--lifinity-text-secondary)">
              Escreve o código de 6 dígitos enviado para <strong>{email}</strong>. Expira em 10 minutos.
            </p>
            <label className="block">
              <span className="sr-only">Código</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="lifinity-input rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em]"
                placeholder="000000"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="lifinity-button-primary w-full px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'A verificar...' : 'Verificar'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="w-full text-xs font-bold text-(--lifinity-text-muted) hover:text-(--lifinity-text) transition-colors disabled:opacity-60"
            >
              Não recebeste? Reenviar código
            </button>
          </form>
        )}

        {/* PASSO 3 — Nova palavra-passe */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm font-medium text-(--lifinity-text-secondary)">
              Define a tua nova palavra-passe (mínimo 6 caracteres).
            </p>
            <label className="block">
              <span className="sr-only">Nova palavra-passe</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="lifinity-input rounded-2xl px-4 py-4 text-sm font-bold"
                placeholder="Nova palavra-passe"
                autoComplete="new-password"
                required
              />
            </label>
            <label className="block">
              <span className="sr-only">Confirmar palavra-passe</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="lifinity-input rounded-2xl px-4 py-4 text-sm font-bold"
                placeholder="Confirmar palavra-passe"
                autoComplete="new-password"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="lifinity-button-primary w-full px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'A guardar...' : 'Alterar palavra-passe'}
            </button>
          </form>
        )}

        {/* Mensagens de erro / informação */}
        {error && (
          <p className="lifinity-card-soft lifinity-danger-surface p-4 rounded-2xl text-sm font-bold text-(--lifinity-danger)">
            {error}
          </p>
        )}
        {info && !error && (
          <p className="lifinity-card-soft p-4 rounded-2xl text-sm font-bold text-(--lifinity-success)">
            {info}
          </p>
        )}
      </div>
    </div>
  );
};

export default PasswordResetModal;
