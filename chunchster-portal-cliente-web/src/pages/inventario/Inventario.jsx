import { useState, useEffect } from 'react';
// 1. CAMBIO: Importamos catalogService desde la nueva estructura
import { catalogService } from '../../services/invService';
import { Plus, Search, Loader2 } from 'lucide-react';

// Importamos los componentes modulares
import ProductTable from './components/ProductTable';
import ProductMobileList from './components/ProductMobileList';
import ProductModal from './components/ProductModal';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  useEffect(() => {
    cargarCatalogo();
  }, []);

  const cargarCatalogo = async () => {
    try {
      setCargando(true);
      // 2. CAMBIO: Usamos el método de la clase catalogService
      const response = await catalogService.getCatalog();
      setProductos(response.data.products); 
    } catch (err) {
      setError('Hubo un error al cargar el inventario.');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalNuevo = () => {
    setProductoEditando(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (producto) => {
    setProductoEditando(producto);
    setModalAbierto(true);
  };

  const eliminarProducto = async (productoId) => {
    if(window.confirm("¿Estás seguro de que deseas eliminar este producto? Una vez borrado, no podrás verlo de nuevo.")) {
      try {
        // 3. CAMBIO: Usamos catalogService para eliminar
        await catalogService.deleteProduct(productoId);
        cargarCatalogo();
      } catch (error) {
        alert("Error al eliminar el producto");
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Cabecera y Acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Inventario</h1>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-chunchster focus:border-transparent outline-none text-sm"
            />
          </div>
          
          <button 
            onClick={abrirModalNuevo}
            className="flex w-full sm:w-auto items-center justify-center gap-2 bg-chunchster hover:bg-chunchster-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Estados de Carga / Error */}
      {cargando && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-chunchster" />
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Contenido Principal Componentizado */}
      {!cargando && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ProductMobileList 
            productos={productos} 
            onEdit={abrirModalEditar} 
            onDelete={eliminarProducto} 
          />
          <ProductTable 
            productos={productos} 
            onEdit={abrirModalEditar} 
            onDelete={eliminarProducto} 
          />
        </div>
      )}

      {/* Modal Aislado */}
      <ProductModal 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)} 
        productoEditando={productoEditando} 
        onSaveSuccess={cargarCatalogo} 
      />
    </div>
  );
}