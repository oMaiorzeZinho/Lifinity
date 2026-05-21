import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const getErrorMessage = (err, fallback) => {
  return err?.response?.data?.message || err?.response?.data?.error || fallback;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : null;
};

const AccountSettingsModal = ({ user, setUser, theme, setTheme, onClose }) => {
  const navigate = useNavigate();
  const isLightTheme = theme === 'light';

  const [newUsername, setNewUsername] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteUsername, setDeleteUsername] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleUpdateUsername = async (event) => {
    event.preventDefault();

    const trimmedUsername = newUsername.trim();
    setUsernameMessage('');
    setUsernameError('');

    if (!trimmedUsername) {
      setUsernameError('Escreve o novo username.');
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      setUsernameError('O username deve ter entre 3 e 30 caracteres.');
      return;
    }

    if (!window.confirm(`Mudar username para "${trimmedUsername}"?`)) {
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      navigate('/login');
      return;
    }

    try {
      setSavingUsername(true);
      const response = await axios.put(
        `${API_URL}/users/me/username`,
        { newUsername: trimmedUsername },
        { headers }
      );

      const updatedUser = response.data?.user;
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('lifinity-user-updated'));
      }

      setUsernameMessage(response.data?.message || 'Username atualizado com sucesso.');
      setNewUsername('');
    } catch (err) {
      setUsernameError(getErrorMessage(err, 'Nao foi possivel atualizar o username.'));
    } finally {
      setSavingUsername(false);
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();

    setPasswordMessage('');
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Preenche todos os campos de password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova password deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('As novas passwords nao coincidem.');
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      navigate('/login');
      return;
    }

    try {
      setSavingPassword(true);
      const response = await axios.put(
        `${API_URL}/users/me/password`,
        { currentPassword, newPassword },
        { headers }
      );

      setPasswordMessage(response.data?.message || 'Password atualizada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Nao foi possivel atualizar a password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();

    setDeleteError('');

    if (!deleteUsername.trim() || !deletePassword) {
      setDeleteError('Escreve o teu username atual e a password.');
      return;
    }

    if (!window.confirm('Esta acao apaga definitivamente a tua conta. Queres continuar?')) {
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      navigate('/login');
      return;
    }

    try {
      setDeletingAccount(true);
      await axios.delete(`${API_URL}/users/me`, {
        headers,
        data: {
          username: deleteUsername.trim(),
          password: deletePassword
        }
      });

      localStorage.clear();
      navigate('/login');
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Nao foi possivel apagar a conta.'));
      setDeletingAccount(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--lifinity-overlay)] backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="lifinity-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 space-y-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="lifinity-muted-label">Conta</p>
            <h2 className="mt-2 text-2xl font-black [color:var(--lifinity-text)]">
              Configuracoes
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lifinity-button-secondary w-10 h-10 rounded-xl flex items-center justify-center"
            title="Fechar"
            aria-label="Fechar configuracoes"
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

        <section className="lifinity-card-soft rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="lifinity-muted-label">Aparencia</p>
              <p className="mt-2 text-sm font-bold [color:var(--lifinity-text-secondary)]">
                Tema atual: {isLightTheme ? 'claro' : 'escuro'}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="lifinity-button-secondary px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
              aria-pressed={isLightTheme}
            >
              {isLightTheme ? 'Usar modo escuro' : 'Usar modo claro'}
            </button>
          </div>
        </section>

        <form onSubmit={handleUpdateUsername} className="lifinity-card-soft rounded-2xl p-5 space-y-4">
          <div>
            <p className="lifinity-muted-label">Nome de utilizador</p>
            <p className="mt-2 text-sm font-bold [color:var(--lifinity-text-secondary)]">
              Atual: {user?.username || 'Utilizador'}
            </p>
          </div>

          <label className="block">
            <span className="sr-only">Novo username</span>
            <input
              type="text"
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              className="lifinity-input rounded-2xl px-4 py-4 text-sm font-bold"
              placeholder="Novo username"
              autoComplete="username"
            />
          </label>

          {usernameError && (
            <p className="text-sm font-bold [color:var(--lifinity-danger)]">{usernameError}</p>
          )}
          {usernameMessage && (
            <p className="text-sm font-bold [color:var(--lifinity-success)]">{usernameMessage}</p>
          )}

          <button
            type="submit"
            disabled={savingUsername}
            className="lifinity-button-primary px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingUsername ? 'A guardar...' : 'Guardar username'}
          </button>
        </form>

        <form onSubmit={handleUpdatePassword} className="lifinity-card-soft rounded-2xl p-5 space-y-4">
          <p className="lifinity-muted-label">Palavra-passe</p>

          <div className="grid md:grid-cols-3 gap-3">
            <label className="block">
              <span className="sr-only">Password atual</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="lifinity-input rounded-2xl px-4 py-4 text-sm font-bold"
                placeholder="Password atual"
                autoComplete="current-password"
              />
            </label>

            <label className="block">
              <span className="sr-only">Nova password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="lifinity-input rounded-2xl px-4 py-4 text-sm font-bold"
                placeholder="Nova password"
                autoComplete="new-password"
              />
            </label>

            <label className="block">
              <span className="sr-only">Confirmar nova password</span>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                className="lifinity-input rounded-2xl px-4 py-4 text-sm font-bold"
                placeholder="Confirmar nova password"
                autoComplete="new-password"
              />
            </label>
          </div>

          {passwordError && (
            <p className="text-sm font-bold [color:var(--lifinity-danger)]">{passwordError}</p>
          )}
          {passwordMessage && (
            <p className="text-sm font-bold [color:var(--lifinity-success)]">{passwordMessage}</p>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="lifinity-button-primary px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingPassword ? 'A guardar...' : 'Guardar password'}
          </button>
        </form>

        <form onSubmit={handleDeleteAccount} className="lifinity-card-soft lifinity-danger-surface rounded-2xl p-5 space-y-4">
          <div>
            <p className="lifinity-muted-label">Zona critica</p>
            <h3 className="mt-2 text-lg font-black [color:var(--lifinity-danger)]">
              Apagar conta
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="block">
              <span className="sr-only">Username atual</span>
              <input
                type="text"
                value={deleteUsername}
                onChange={(event) => setDeleteUsername(event.target.value)}
                className="lifinity-input rounded-2xl px-4 py-4 text-sm font-bold"
                placeholder={`Escreve ${user?.username || 'o teu username'}`}
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="sr-only">Password</span>
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                className="lifinity-input rounded-2xl px-4 py-4 text-sm font-bold"
                placeholder="Password"
                autoComplete="current-password"
              />
            </label>
          </div>

          {deleteError && (
            <p className="text-sm font-bold [color:var(--lifinity-danger)]">{deleteError}</p>
          )}

          <button
            type="submit"
            disabled={deletingAccount}
            className="lifinity-danger-item px-5 py-4 rounded-2xl border border-[var(--lifinity-border)] text-xs font-black uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deletingAccount ? 'A apagar...' : 'Apagar conta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSettingsModal;
