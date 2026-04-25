import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './pages/Dashboard'; // Importa o Dashboard como layout
import Tasks from './pages/Tasks';
import Ranking from './pages/Ranking';
import Community from './pages/Community';
import Inspiration from './pages/Inspiration';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rota do Dashboard como layout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="tasks" replace />} /> {/* Redireciona /dashboard para /dashboard/tasks */}
          <Route path="tasks" element={<Tasks />} />
          <Route path="ranking" element={<Ranking />} />
          <Route path="community" element={<Community />} />
          <Route path="inspiration" element={<Inspiration />} />
        </Route>

        {/* Redirecionar qualquer rota desconhecida para a Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
