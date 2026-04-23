import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        email,
        password,
      } );

      // Guardar Token e Dados do User
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/dashboard/tasks'); // Redireciona para o dashboard após login
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro no login.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-xl border border-slate-100">
        {/* Botão Voltar para a Home */}
        <Link to="/" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition block mb-8">
          ← Voltar à Home
        </Link>

        <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Bem-vindo</h2>
        <p className="text-slate-500 mb-8 font-medium">Faz login para continuar a tua jornada.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="E-mail"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition font-bold"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Palavra-passe"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition font-bold"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100">
            Entrar
          </button>
        </form>

        {message && (
          <p className="mt-6 text-center font-bold text-sm text-red-500">
            {message}
          </p>
        )}

        <p className="mt-8 text-center text-sm font-bold text-slate-400">
          Ainda não tens conta? <Link to="/register" className="text-blue-600 hover:underline">Criar conta grátis</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
