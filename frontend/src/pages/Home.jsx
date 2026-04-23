import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navbar Simples */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-600">Lifinity ∞</h1>
        <div className="space-x-4">
          <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">Entrar</Link>
          <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Começar Agora</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-12 text-center">
        <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
          Gere a tua vida com <span className="text-blue-600">motivação infinita</span>.
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          A Lifinity combina gestão de tarefas, gamificação e inteligência artificial para transformar a tua produtividade diária numa jornada de conquistas.
        </p>
        
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-16">
          <Link to="/register" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:bg-blue-700 transition">
            Criar Conta Grátis
          </Link>
          <button className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 transition">
            Saber Mais
          </button>
        </div>

        {/* Pequenos Cards de Funcionalidades */}
        <div className="grid md:grid-cols-3 gap-8 mt-12 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-blue-600 text-2xl mb-4">🎯</div>
            <h3 className="font-bold text-xl mb-2">Gestão de Tarefas</h3>
            <p className="text-gray-600">Organiza o teu dia a dia de forma simples e colaborativa com amigos ou equipas.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-blue-600 text-2xl mb-4">🎮</div>
            <h3 className="font-bold text-xl mb-2">Gamificação</h3>
            <p className="text-gray-600">Ganha XP, sobe de nível e desbloqueia conquistas à medida que completas os teus objetivos.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-blue-600 text-2xl mb-4">🤖</div>
            <h3 className="font-bold text-xl mb-2">Assistente IA</h3>
            <p className="text-gray-600">Um chatbot inteligente que te ajuda a planear e te motiva nos momentos difíceis.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
