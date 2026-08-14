import { useState, useEffect } from 'react';
// 1. CAMBIO: Importamos catalogService desde la nueva estructura
import { catalogService } from '../../services/invService';
import { Plus, Search, Loader2, Trash2 } from 'lucide-react';

// Importamos los componentes modulares
import ProductTable from './components/ProductTable';
import ProductMobileList from './components/ProductMobileList';
import ProductModal from './components/ProductModal';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

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

  const solicitarEliminar = (producto) => {
    setProductoAEliminar(producto);
    setModalEliminarAbierto(true);
  };

  const confirmarEliminar = async () => {
    if (!productoAEliminar) return;
    setEliminando(true);
    try {
      await catalogService.deleteProduct(productoAEliminar.product_id);
      setModalEliminarAbierto(false);
      setProductoAEliminar(null);
      cargarCatalogo();
    } catch (error) {
      alert("Error al eliminar el producto");
    } finally {
      setEliminando(false);
    }
  };

  const cambiarEstadoActivo = async (productId, nuevoEstado) => {
    // Optimista: actualiza en pantalla antes de que responda el backend
    setProductos((prev) =>
      prev.map((p) => (p.product_id === productId ? { ...p, is_active: nuevoEstado } : p))
    );
    try {
      await catalogService.updateProduct(productId, { is_active: nuevoEstado });
    } catch (error) {
      alert("Error al actualizar el estado del producto");
      // Rollback si falla
      setProductos((prev) =>
        prev.map((p) => (p.product_id === productId ? { ...p, is_active: !nuevoEstado } : p))
      );
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Cabecera y Acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="font-display text-2xl font-bold text-gray-800">Gestión de Inventario</h1>

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
            onDelete={solicitarEliminar}
          />
          <ProductTable
            productos={productos}
            onEdit={abrirModalEditar}
            onDelete={solicitarEliminar}
            onToggleActive={cambiarEstadoActivo}
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

      {/* Modal de confirmación de eliminación */}
      {modalEliminarAbierto && productoAEliminar && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !eliminando && setModalEliminarAbierto(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              ¿Eliminar este producto?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Vas a eliminar <span className="font-semibold text-gray-800">"{productoAEliminar.name}"</span> permanentemente. Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setModalEliminarAbierto(false)}
                disabled={eliminando}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {eliminando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Eliminando...
                  </>
                ) : (
                  'Sí, eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}