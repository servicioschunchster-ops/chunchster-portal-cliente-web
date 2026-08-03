import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/auth/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Lobby from './pages/Lobby';
import Inventario from './pages/inventario/Inventario';
import Agenda from './pages/agenda/Agenda';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas (Sin menú lateral) */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Privadas (Envueltas en el DashboardLayout) */}
        <Route element={<DashboardLayout />}>
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/agenda" element={<Agenda />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;