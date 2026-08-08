import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Package, CalendarClock, BarChart3 } from 'lucide-react';
import logoChunchster from '../../assets/logo.jpeg';

const CARACTERISTICAS = [
  { icon: Package, label: 'Catálogo e inventario en tiempo real' },
  { icon: CalendarClock, label: 'Agenda de alquileres y entregas' },
  { icon: BarChart3, label: 'Pedidos, pagos y notificaciones al cliente' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError(false);
    setEnviando(true);

    // Hardcodeamos un usuario de prueba
    setTimeout(() => {
      if (email === 'admin@chunchster.com' && password === '123456') {
        navigate('/lobby');
      } else {
        setError(true);
        setEnviando(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen flex bg-chunchster-cream">
      {/* ---------- PANEL DE MARCA (oculto en mobile) ---------- */}
      <div className="hidden lg:flex lg:w-[44%] relative flex-col justify-between bg-gradient-to-br from-chunchster to-chunchster-dark text-white p-12 overflow-hidden">
        {/* Textura de líneas en su propia capa: si comparte background-image con el
            gradiente de arriba, una de las dos declaraciones pisa a la otra por completo. */}
        <div className="absolute inset-0 chunchster-ledger pointer-events-none" />
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-chunchster-yellow/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 w-64 h-64 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <img src={logoChunchster} alt="Chunchster" className="w-11 h-11 rounded-xl bg-white p-1 shadow-lg shrink-0" />
          <span className="font-display font-bold text-lg tracking-tight">Chunchster</span>
        </div>

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-chunchster-yellow mb-4">
            Portal de Clientes
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.1] mb-5">
            Tu negocio,<br />un paso adelante.
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm mb-8">
            Automatización de negocios: gestiona catálogo, inventario y agenda de
            alquileres desde un solo lugar.
          </p>

          <ul className="space-y-3">
            {CARACTERISTICAS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-white/85">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-chunchster-yellow" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-white/40">
          © {new Date().getFullYear()} Chunchster — Automatización de Negocios
        </p>
      </div>

      {/* ---------- PANEL DE FORMULARIO ---------- */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Cabecera de marca compacta, solo en mobile */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <img src={logoChunchster} alt="Chunchster" className="w-20 h-20 mb-3" />
          <span className="font-display font-bold text-chunchster text-lg">Chunchster</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-gray-900">
              Bienvenido de vuelta
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">
              Ingresa tus credenciales para continuar al panel.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-chunchster/40 focus:border-chunchster transition-all shadow-sm"
                  placeholder="cliente@empresa.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-chunchster/40 focus:border-chunchster transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                Credenciales incorrectas. Verifica tu correo y contraseña.
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-chunchster hover:bg-chunchster-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chunchster transition-colors mt-2 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {enviando ? 'Ingresando...' : 'Ingresar al sistema'}
              {!enviando && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-3">
            <span className="font-mono font-semibold text-gray-500 shrink-0">Demo</span>
            <span>admin@chunchster.com · 123456</span>
          </div>
        </div>
      </div>
    </div>
  );
}
