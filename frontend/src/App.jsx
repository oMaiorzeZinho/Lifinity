import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const DashboardLayout = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Ranking = lazy(() => import('./pages/Ranking'));
const Community = lazy(() => import('./pages/Community'));
const Inspiration = lazy(() => import('./pages/Inspiration'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Profile = lazy(() => import('./pages/Profile'));
const Chat = lazy(() => import('./pages/Chat'));

const PageLoader = () => (
  <div className="min-h-screen bg-[#101713] p-10 text-center text-xs font-black uppercase tracking-widest text-slate-400">
    A carregar...
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="tasks" replace />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="community" element={<Community />} />
            <Route path="inspiration" element={<Inspiration />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="profile" element={<Profile />} />
            <Route path="chat" element={<Chat />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
