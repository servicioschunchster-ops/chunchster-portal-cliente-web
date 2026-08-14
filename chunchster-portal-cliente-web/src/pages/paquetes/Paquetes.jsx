import { useState, useEffect } from 'react';
import { catalogService } from '../../services/invService';
import { Plus, Loader2, Package, Trash2 } from 'lucide-react';
import PackageTable from './components/PackageTable';
import PackageModal from './components/PackageModal';

export default function Paquetes() {
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [paqueteEditando, setPaqueteEditando] = useState(null);

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [paqueteAEliminar, setPaqueteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarPaquetes();
  }, []);

  const cargarPaquetes = async () => {
    try {
      setCargando(true);
      setError(null);
      const response = await catalogService.getCatalog({ is_package: true });
      setPaquetes(response.data.products || []);
    } catch (err) {
      setError('Hubo un error al cargar los paquetes.');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalNuevo = () => {
    setPaqueteEditando(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (paquete) => {
    setPaqueteEditando(paquete);
    setModalAbierto(true);
  };

  const solicitarEliminar = (paquete) => {
    setPaqueteAEliminar(paquete);
    setModalEliminarAbierto(true);
  };

  const confirmarEliminar = async () => {
    if (!paqueteAEliminar) return;
    setEliminando(true);
    try {
      await catalogService.deleteProduct(paqueteAEliminar.product_id);
      setModalEliminarAbierto(false);
      setPaqueteAEliminar(null);
      cargarPaquetes();
    } catch (error) {
      alert('Error al eliminar el paquete');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Paquetes (Combos)</h1>
          <p className="text-sm text-gray-500 mt-1">Combos armados con productos existentes del catálogo.</p>
        </div>

        <button
          onClick={abrirModalNuevo}
          className="flex w-full md:w-auto items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Paquete</span>
        </button>
      </div>

      {cargando && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {!cargando && !error && (
        <PackageTable paquetes={paquetes} onEdit={abrirModalEditar} onDelete={solicitarEliminar} />
      )}

      <PackageModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        paqueteEditando={paqueteEditando}
        onSaveSuccess={cargarPaquetes}
      />

      {modalEliminarAbierto && paqueteAEliminar && (
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
            <h3 className="text-lg font-bold text-gray-900 mb-1">¿Eliminar este paquete?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Vas a eliminar <span className="font-semibold text-gray-800">"{paqueteAEliminar.name}"</span> permanentemente. Esta acción no se puede deshacer.
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