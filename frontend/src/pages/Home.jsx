import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Gestão de tarefas',
    description:
      'Cria tarefas, define prioridades, acompanha estados e mantém o teu dia organizado de forma simples e visual.',
    accentStyle: {
      background: 'linear-gradient(to bottom right, rgba(110, 231, 183, 0.2), rgba(15, 23, 42, 0.1))'
    }
  },
  {
    title: 'Gamificação',
    description:
      'Ganha XP, sobe de nível e transforma pequenos objetivos diários numa evolução contínua e motivadora.',
    accentStyle: {
      background: 'linear-gradient(to bottom right, rgba(190, 242, 100, 0.2), rgba(15, 23, 42, 0.1))'
    }
  },
  {
    title: 'Estatísticas de progresso',
    description:
      'Analisa gráficos, produtividade, tarefas concluídas, XP ganho e evolução ao longo do tempo.',
    accentStyle: {
      background: 'linear-gradient(to bottom right, rgba(103, 232, 249, 0.2), rgba(15, 23, 42, 0.1))'
    }
  },
  {
    title: 'Comunidade',
    description:
      'Cria grupos, adiciona amigos e prepara tarefas partilhadas, comparações e colaboração entre utilizadores.',
    accentStyle: {
      background: 'linear-gradient(to bottom right, rgba(94, 234, 212, 0.2), rgba(15, 23, 42, 0.1))'
    }
  },
  {
    title: 'Inspiração diária',
    description:
      'Recebe mensagens motivacionais e versículos diários, guarda favoritos e mantém uma fonte de encorajamento.',
    accentStyle: {
      background: 'linear-gradient(to bottom right, rgba(231, 229, 228, 0.2), rgba(15, 23, 42, 0.1))'
    }
  },
  {
    title: 'Assistente inteligente',
    description:
      'Um chatbot integrado irá ajudar no planeamento, sugestões de tarefas e apoio motivacional dentro da aplicação.',
    accentStyle: {
      background: 'linear-gradient(to bottom right, rgba(165, 180, 252, 0.2), rgba(15, 23, 42, 0.1))'
    }
  }
];

const productHighlights = [
  {
    label: 'Tarefas',
    value: 'Organizar',
    text: 'Planeamento diário com prioridades, estados e filtros.'
  },
  {
    label: 'XP',
    value: 'Evoluir',
    text: 'Sistema de pontos, níveis e progresso visual.'
  },
  {
    label: 'Grupos',
    value: 'Colaborar',
    text: 'Comunidade com amigos, grupos e convites.'
  },
  {
    label: 'Dados',
    value: 'Analisar',
    text: 'Gráficos para perceber padrões e produtividade.'
  }
];

function Home() {
  return (
    <div
      className="min-h-screen text-white overflow-hidden"
      style={{ backgroundColor: '#070b0a' }}
    >
      {/* BACKGROUND GERAL */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-45"
        style={{ backgroundImage: "url('/images/home-bg.png')" }}
      ></div>

      <div
        className="fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at top, rgba(155, 180, 165, 0.2), transparent 35%), linear-gradient(to bottom, rgba(7, 11, 10, 0.45), #070b0a 75%)'
        }}
      ></div>

      <div className="relative z-10">
        {/* NAVBAR */}
        <header
          className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-2xl"
          style={{ backgroundColor: 'rgba(7, 11, 10, 0.7)' }}
        >
          <div className="max-w-screen-2xl mx-auto px-6 h-20 flex items-center justify-between">
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

            <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-300">
              <a href="#features" className="hover:text-white transition-colors">
                Funcionalidades
              </a>
              <a href="#product" className="hover:text-white transition-colors">
                Plataforma
              </a>
              <a href="#community" className="hover:text-white transition-colors">
                Comunidade
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Entrar
              </Link>

              <Link
                to="/register"
                className="px-5 py-3 rounded-xl bg-white text-slate-950 text-sm font-black hover:bg-slate-200 transition-all shadow-xl shadow-white/10"
              >
                Começar Agora
              </Link>
            </div>
          </div>
        </header>

        <main>
          {/* HERO */}
          <section className="max-w-screen-2xl mx-auto px-6 pt-20 pb-24">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-8">
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-300"
                    style={{ boxShadow: '0 0 18px rgba(110, 231, 183, 0.8)' }}
                  ></span>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                    Gestão e motivação diária
                  </p>
                </div>

                <h1 className="text-5xl md:text-7xl xl:text-8xl font-black tracking-tighter leading-none max-w-5xl">
                  Organiza a tua vida com uma experiência{' '}
                  <span
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, #f1f5f9, #a7f3d0, #64748b)'
                    }}
                  >
                    mais calma, focada e motivadora.
                  </span>
                </h1>

                <p className="mt-8 text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl">
                  Lifinity combina tarefas, gamificação, estatísticas,
                  comunidade, inspiração diária e inteligência artificial para
                  transformar produtividade em progresso real.
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    to="/register"
                    className="px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-sm hover:bg-slate-200 transition-all shadow-2xl shadow-white/10"
                  >
                    Criar Conta Grátis
                  </Link>

                  <a
                    href="#features"
                    className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10 transition-all backdrop-blur-xl"
                  >
                    Explorar Plataforma
                  </a>
                </div>

                <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {productHighlights.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
                    >
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                        {item.label}
                      </p>
                      <p className="text-2xl font-black tracking-tight text-white">
                        {item.value}
                      </p>
                      <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PAINEL VISUAL */}
              <div className="relative">
                <div className="absolute -inset-8 bg-emerald-300/10 blur-3xl rounded-full"></div>

                <div
                  className="relative rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden"
                  style={{ backgroundColor: 'rgba(13, 18, 16, 0.8)' }}
                >
                  <div className="h-14 border-b border-white/10 flex items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-400/70"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-300/70"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-300/70"></span>
                    </div>

                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Preview Lifinity
                    </p>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-3">
                        Progresso de hoje
                      </p>

                      <div className="flex items-end justify-between gap-6">
                        <div>
                          <p className="text-5xl font-black tracking-tighter">
                            82%
                          </p>
                          <p className="text-slate-400 text-sm font-bold mt-2">
                            Produtividade diária
                          </p>
                        </div>

                        <div className="flex gap-2 items-end h-24">
                          <div className="w-7 rounded-t-xl bg-white/10 h-10"></div>
                          <div className="w-7 rounded-t-xl bg-white/10 h-16"></div>
                          <div className="w-7 rounded-t-xl bg-emerald-300 h-20"></div>
                          <div className="w-7 rounded-t-xl bg-white/10 h-12"></div>
                          <div className="w-7 rounded-t-xl bg-emerald-200 h-24"></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                          Nível
                        </p>
                        <p className="text-4xl font-black mt-2">6</p>
                        <div className="w-full h-2 bg-white/10 rounded-full mt-5 overflow-hidden">
                          <div
                            className="h-full bg-emerald-300 rounded-full"
                            style={{ width: '72%' }}
                          ></div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                          XP
                        </p>
                        <p className="text-4xl font-black mt-2">1252</p>
                        <p className="text-sm text-slate-400 mt-5">
                          Evolução acumulada
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                          Tarefas recentes
                        </p>
                        <span className="px-3 py-1 rounded-full bg-emerald-300/10 text-emerald-200 text-xs font-black uppercase tracking-widest">
                          Ativo
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                          <span className="text-sm font-bold text-slate-200">
                            Preparar apresentação
                          </span>
                          <span className="text-xs font-black uppercase text-emerald-200">
                            Alta
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                          <span className="text-sm font-bold text-slate-200">
                            Rever estatísticas
                          </span>
                          <span className="text-xs font-black uppercase text-slate-400">
                            Média
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                          <span className="text-sm font-bold text-slate-200">
                            Atualizar diagramas
                          </span>
                          <span className="text-xs font-black uppercase text-slate-400">
                            Média
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="max-w-screen-2xl mx-auto px-6 py-20">
            <div className="max-w-3xl mb-12">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-4">
                Funcionalidades principais
              </p>

              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                Uma plataforma completa para produtividade pessoal e colaborativa.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl hover:bg-white/10 transition-all"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={feature.accentStyle}
                  ></div>

                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                      <div className="w-4 h-4 rounded-full bg-emerald-200"></div>
                    </div>

                    <h3 className="text-2xl font-black tracking-tight text-white mb-3">
                      {feature.title}
                    </h3>

                    <p className="text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PRODUCT SECTION */}
          <section id="product" className="max-w-screen-2xl mx-auto px-6 py-20">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 md:p-12">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-4">
                    Experiência integrada
                  </p>

                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight">
                    Tudo ligado numa única jornada de progresso.
                  </h2>

                  <p className="text-slate-400 text-lg leading-relaxed mt-6">
                    As tarefas alimentam o XP, o XP alimenta o ranking, as
                    estatísticas mostram a evolução, e a comunidade prepara a
                    colaboração entre utilizadores.
                  </p>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-black/20 border border-white/10 p-5">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                        Estatísticas
                      </p>
                      <p className="text-slate-200 font-bold">
                        Gráficos por período, métrica e evolução.
                      </p>
                    </div>

                    <div className="rounded-3xl bg-black/20 border border-white/10 p-5">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                        Comunidade
                      </p>
                      <p className="text-slate-200 font-bold">
                        Amigos, grupos e colaboração futura.
                      </p>
                    </div>

                    <div className="rounded-3xl bg-black/20 border border-white/10 p-5">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                        Inspiração
                      </p>
                      <p className="text-slate-200 font-bold">
                        Versículos diários, favoritos e partilha.
                      </p>
                    </div>

                    <div className="rounded-3xl bg-black/20 border border-white/10 p-5">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                        IA
                      </p>
                      <p className="text-slate-200 font-bold">
                        Assistente inteligente para apoio diário.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="relative border-t lg:border-t-0 lg:border-l border-white/10 p-8"
                  style={{ minHeight: 520, backgroundColor: '#0b100e' }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(circle at top right, rgba(167, 243, 208, 0.18), transparent 35%)'
                    }}
                  ></div>

                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
                        Fluxo da plataforma
                      </p>

                      <div className="space-y-4">
                        {[
                          'Criar tarefa',
                          'Concluir objetivo',
                          'Ganhar XP',
                          'Subir no ranking',
                          'Analisar progresso'
                        ].map((step, index) => (
                          <div key={step} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-xl bg-emerald-300/10 text-emerald-200 flex items-center justify-center text-xs font-black">
                              {index + 1}
                            </div>
                            <p className="text-slate-200 font-bold">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                        Objetivo do Lifinity
                      </p>
                      <p className="text-2xl font-black tracking-tight text-white">
                        Ajudar o utilizador a manter consistência, motivação e
                        clareza no seu progresso diário.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* COMMUNITY */}
          <section id="community" className="max-w-screen-2xl mx-auto px-6 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-4">
                  Colaboração
                </p>

                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight">
                  Produtividade também pode ser partilhada.
                </h2>

                <p className="mt-6 text-slate-400 text-lg leading-relaxed">
                  A comunidade permite criar grupos, adicionar amigos e preparar
                  funcionalidades como tarefas partilhadas, comparação de
                  estatísticas, partilha de inspiração e chat.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    to="/register"
                    className="px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-sm hover:bg-slate-200 transition-all"
                  >
                    Entrar na comunidade
                  </Link>

                  <Link
                    to="/login"
                    className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10 transition-all"
                  >
                    Já tenho conta
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-7">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-3">
                    Grupos
                  </p>
                  <p className="text-3xl font-black text-white">Convites</p>
                  <p className="text-slate-400 mt-4 leading-relaxed">
                    Criação de grupos com código para entrada rápida.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-7">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-3">
                    Amigos
                  </p>
                  <p className="text-3xl font-black text-white">Rede</p>
                  <p className="text-slate-400 mt-4 leading-relaxed">
                    Pesquisa de utilizadores e pedidos de amizade.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-7">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-3">
                    Comparação
                  </p>
                  <p className="text-3xl font-black text-white">Progresso</p>
                  <p className="text-slate-400 mt-4 leading-relaxed">
                    Base para comparar estatísticas com amigos e grupos.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-7">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-3">
                    Futuro chat
                  </p>
                  <p className="text-3xl font-black text-white">Partilha</p>
                  <p className="text-slate-400 mt-4 leading-relaxed">
                    Preparação para mensagens e envio de inspiração.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="max-w-screen-2xl mx-auto px-6 py-20">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 md:p-12">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, rgba(110, 231, 183, 0.1), transparent, rgba(255, 255, 255, 0.05))'
                }}
              ></div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-4">
                    Começa agora
                  </p>

                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight max-w-4xl">
                    Transforma organização em progresso visível.
                  </h2>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/register"
                    className="px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-sm hover:bg-slate-200 transition-all"
                  >
                    Criar Conta
                  </Link>

                  <Link
                    to="/login"
                    className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10 transition-all"
                  >
                    Entrar
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Home;
