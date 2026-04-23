import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000y-api.loca.lt/api/auth/register', {
        username,
        email,
        password,
      } );
      setMessage('Conta criada com sucesso! A redirecionar para o login...');
      
      // Aguarda 2 segundos para o utilizador ler a mensagem e depois redireciona
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao registar.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-xl border border-slate-100">
        {/* Botão Voltar para a Home */}
        <Link to="/" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition block mb-8">
          ← Voltar à Home
        </Link>

        <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Criar Conta</h2>
        <p className="text-slate-500 mb-8 font-medium">Junta-te à comunidade Lifinity.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Nome de Utilizador"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition font-bold"
            onChange={(e) => setUsername(e.target.value)}
            required
          />
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
            Registar
          </button>
        </form>

        {message && (
          <p className={`mt-6 text-center font-bold text-sm ${message.includes('sucesso') ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </p>
        )}

        <p className="mt-8 text-center text-sm font-bold text-slate-400">
          Já tens conta? <Link to="/login" className="text-blue-600 hover:underline">Entrar aqui</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
