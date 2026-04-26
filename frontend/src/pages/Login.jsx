import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/dashboard/tasks');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao iniciar sessão.');
    }
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{ backgroundColor: '#070b0a' }}
    >
      {/* BACKGROUND */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-45"
        style={{ backgroundImage: "url('/images/auth-bg-1.jpg')" }}
      ></div>

      <div
        className="fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at top, rgba(155, 180, 165, 0.2), transparent 35%), linear-gradient(to bottom, rgba(7, 11, 10, 0.35), #070b0a 80%)'
        }}
      ></div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* HEADER */}
        <header className="max-w-screen-2xl mx-auto w-full px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/images/lifinity-logo.png"
              alt="Logotipo Lifinity"
              className="h-9 w-auto object-contain"
            />

            <span className="text-xl font-black tracking-tight text-white">
              Lifinity
            </span>
          </Link>

          <Link
            to="/register"
            className="px-5 py-3 rounded-xl bg-white text-slate-950 text-sm font-black hover:bg-slate-200 transition-all shadow-xl shadow-white/10"
          >
            Criar conta
          </Link>
        </header>

        {/* CONTENT */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* TEXTO LATERAL */}
            <section className="hidden lg:block">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-8">
                <span
                  className="w-2 h-2 rounded-full bg-emerald-300"
                  style={{ boxShadow: '0 0 18px rgba(110, 231, 183, 0.8)' }}
                ></span>
                <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                  Bem-vindo de volta
                </p>
              </div>

              <h1 className="text-5xl xl:text-6xl font-black tracking-tighter leading-none max-w-2xl">
                Continua a tua evolução com foco e consistência.
              </h1>

              <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
                Entra na tua conta para gerir tarefas, acompanhar estatísticas,
                evoluir no ranking, interagir com grupos e manter a tua rotina
                organizada.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl">
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                    Tarefas
                  </p>
                  <p className="text-2xl font-black text-white">Foco</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                    XP
                  </p>
                  <p className="text-2xl font-black text-white">Evolução</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                    Dados
                  </p>
                  <p className="text-2xl font-black text-white">Progresso</p>
                </div>
              </div>
            </section>

            {/* FORM */}
            <section
              className="rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl p-8 md:p-10"
              style={{ backgroundColor: 'rgba(13, 18, 16, 0.8)' }}
            >
              <div className="mb-8">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-3">
                  Acesso à plataforma
                </p>

                <h2 className="text-4xl font-black tracking-tighter text-white">
                  Entrar na conta
                </h2>

                <p className="text-slate-400 mt-3 font-medium">
                  Usa os teus dados para aceder ao Lifinity.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-emerald-200/60 focus:bg-white/10 transition-all font-bold"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">
                    Palavra-passe
                  </label>
                  <input
                    type="password"
                    placeholder="A tua palavra-passe"
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-emerald-200/60 focus:bg-white/10 transition-all font-bold"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-5 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all shadow-xl shadow-white/10"
                >
                  Entrar
                </button>
              </form>

              {message && (
                <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-200 text-sm font-bold text-center">
                  {message}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-slate-400 font-medium">
                  Ainda não tens conta?
                </p>

                <Link
                  to="/register"
                  className="text-sm font-black text-emerald-200 hover:text-white transition-colors"
                >
                  Criar conta gratuita
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
