import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Package, Calendar, Layers, LogOut } from 'lucide-react';
import logoChunchster from '../../assets/logo.jpeg';

export default function DashboardLayout() {
  const location = useLocation();

  // Lista de rutas usando los componentes de icono de Lucide
  const menuItems = [
    { path: '/lobby', label: 'Inicio', icon: Home },
    { path: '/inventario', label: 'Inventario', icon: Package },
    { path: '/agenda', label: 'Agenda', icon: Calendar },
    { path: '/paquetes', label: 'Paquetes', icon: Layers }, // <-- Nueva ruta añadida aquí
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* --- NAVEGACIÓN: Barra Inferior (Móvil) / Sidebar (Desktop) --- */}
      <aside className="
        fixed bottom-0 left-0 z-50 w-full h-16 bg-chunchster text-white flex flex-row items-center justify-around shadow-[0_-4px_10px_rgba(0,0,0,0.1)]
        md:relative md:w-64 md:h-screen md:flex-col md:justify-start md:shadow-none md:chunchster-ledger
      ">
        {/* Cabecera del Sidebar con Logo (Solo visible en Desktop) */}
        <div className="hidden md:flex items-center gap-2.5 h-20 w-full px-5 border-b border-white/10">
          <img src={logoChunchster} alt="Chunchster" className="h-9 w-9 rounded-lg bg-white p-1 shrink-0" />
          <span className="font-display font-bold text-white text-base tracking-tight">Chunchster</span>
        </div>

        {/* Enlaces de Navegación */}
        <nav className="flex flex-row w-full justify-around md:flex-col md:p-3 md:space-y-1 md:mt-3 md:justify-start">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon; // Extraemos el componente del icono
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-3.5 py-2 md:py-2.5 w-full rounded-lg md:rounded-xl transition-colors ${
                  isActive 
                    ? 'text-chunchster-yellow md:bg-white/10 md:text-white md:font-bold' 
                    : 'text-gray-300 hover:text-white md:hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5 md:w-[18px] md:h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] md:text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
                {isActive && <span className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-chunchster-yellow" />}
              </Link>
            );
          })}

          {/* Botón de Cerrar Sesión */}
          <Link 
            to="/login" 
            className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-3.5 py-2 md:py-2.5 w-full text-gray-300 hover:text-white md:hover:bg-white/5 rounded-lg md:rounded-xl transition-colors md:absolute md:bottom-4 md:w-[calc(100%-1.5rem)] md:border-t md:border-white/10 md:pt-4"
          >
            <LogOut className="w-5 h-5 md:w-[18px] md:h-[18px]" strokeWidth={2} />
            <span className="text-[10px] md:text-sm font-medium">Salir</span>
          </Link>
        </nav>
      </aside>

      {/* --- ÁREA PRINCIPAL (Contenido) --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        
        {/* Barra superior (Topbar) */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          
          <div className="md:hidden flex items-center gap-2">
             <img src={logoChunchster} alt="Chunchster" className="h-8 w-8 rounded-md" />
             <span className="font-display font-bold text-chunchster">Chunchster</span>
          </div>
          
          <h2 className="hidden md:block font-display text-xl font-semibold text-gray-800">
            Panel de Control
          </h2>
          
          {/* Info del usuario a la derecha */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-chunchster-yellow flex items-center justify-center text-chunchster-dark font-bold text-sm">
              A
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">Admin</span>
          </div>
        </header>

        {/* Contenedor donde se inyectan las vistas */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}