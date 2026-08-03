import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Importamos el logo que guardaste en la carpeta assets
import logoChunchster from '../../assets/logo.jpeg'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Hardcodeamos un usuario de prueba
    if (email === 'admin@chunchster.com' && password === '123456') {
      navigate('/lobby'); // Ahora vamos al lobby, no directo al inventario
    } else {
      alert('Credenciales incorrectas. Usa admin@chunchster.com / 123456');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        
        {/* Cabecera con el Logo de la Empresa */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img 
            src={logoChunchster} 
            alt="Logo Chunchster" 
            className="w-40 h-auto mb-4"
          />
          <h2 className="text-xl font-bold text-chunchster">
            Portal de Clientes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chunchster focus:border-transparent transition-all"
              placeholder="cliente@empresa.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chunchster focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Botón con el color corporativo */}
          <button
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-chunchster hover:bg-chunchster-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chunchster transition-colors mt-4"
          >
            Ingresar al Sistema
          </button>
        </form>
        
      </div>
    </div>
  );
}