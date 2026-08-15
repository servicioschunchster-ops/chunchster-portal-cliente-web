import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Package } from 'lucide-react';
import { catalogService, inventoryService } from '../../../services/invService';
import { estadoInicial, generarSKU } from '../../../utils/packageModalHelpers';
import PackageBasicInfoForm from './PackageBasicInfoForm';
import PackageComponentsSection from './PackageComponentsSection';

// Categoría fija para paquetes. Se manda al backend igual que antes,
// pero ya no se le pide al usuario que la elija en el formulario.
const CATEGORIA_PAQUETES = 'Paquetes';

export default function PackageModal({ isOpen, onClose, paqueteEditando, onSaveSuccess }) {
  const esEdicion = Boolean(paqueteEditando);

  const [form, setForm] = useState(estadoInicial);
  const [componentes, setComponentes] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Controla si el SKU fue tocado a mano por el usuario, para dejar de auto-generarlo.
  const [skuEditadoManualmente, setSkuEditadoManualmente] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [variantesDisponibles, setVariantesDisponibles] = useState([]);
  const [cargandoVariantes, setCargandoVariantes] = useState(false);
  const [varianteElegida, setVarianteElegida] = useState('');
  const [cantidadElegida, setCantidadElegida] = useState(1);

  // Catálogo de productos (activos, no-paquete) precargado una vez al abrir el
  // modal. El selector de componentes es un buscador (autocompletar) sobre
  // esta lista, en vez de un <select> con cientos de <option>.
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [cargandoCatalogoProductos, setCargandoCatalogoProductos] = useState(false);

  // Diccionario aparte { product_id: nombre } para componentes cuyo producto
  // no aparece en productosCatalogo (p. ej. quedó inactivo). Importante: esto
  // NUNCA escribe sobre el estado `componentes` — evita cualquier condición de
  // carrera entre "resolver nombres" y "agregar/guardar componentes".
  const [nombresResueltos, setNombresResueltos] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    if (esEdicion) {
      setForm({
        name: paqueteEditando.name || '',
        description: paqueteEditando.description || '',
        category_id: paqueteEditando.category_id || CATEGORIA_PAQUETES,
        sku: paqueteEditando.sku || '',
        product_type: paqueteEditando.product_type || 'sale',
        base_price: paqueteEditando.base_price ?? '',
        rental_price_day: paqueteEditando.rental_price_day ?? '',
        rental_deposit: paqueteEditando.rental_deposit ?? '',
      });
      const comps = paqueteEditando.components || paqueteEditando.inventory || [];
      setComponentes(
        comps.map((c) => ({
          product_id: c.product_id,
          variant_key: c.variant_key,
          quantity: c.quantity ?? 1,
          // La API no manda el nombre del producto dentro de "components", solo
          // product_id/variant_key/quantity. Si no viene, queda null y se
          // resuelve aparte contra el catálogo (ver nombresResueltos).
          _nombre: c.product_name || c.name || null,
        }))
      );
      // En edición no auto-generamos SKU: ya tiene uno.
      setSkuEditadoManualmente(true);
    } else {
      setForm({ ...estadoInicial, category_id: CATEGORIA_PAQUETES });
      setComponentes([]);
      setSkuEditadoManualmente(false);
    }
    setError(null);
    setProductoSeleccionado(null);
    setVariantesDisponibles([]);
    setVarianteElegida('');
    setCantidadElegida(1);
    setNombresResueltos({});
  }, [isOpen, esEdicion, paqueteEditando]);

  // Precarga el catálogo de productos activos (no-paquete) una sola vez al
  // abrir el modal, para que "Componentes del paquete" tenga sobre qué buscar.
  useEffect(() => {
    if (!isOpen) return;

    const cargarProductos = async () => {
      setCargandoCatalogoProductos(true);
      try {
        const res = await catalogService.getCatalog({
          is_package: false,
          is_active: true,
          limit: 200,
        });
        const productos = res?.data?.products || [];
        setProductosCatalogo(productos.filter((p) => p.is_active !== false));
      } catch (err) {
        console.error('Error precargando catálogo de productos', err);
        setProductosCatalogo([]);
      } finally {
        setCargandoCatalogoProductos(false);
      }
    };

    cargarProductos();
  }, [isOpen]);

  // Resuelve el nombre de componentes cuyo producto no está en productosCatalogo
  // (p. ej. porque quedó inactivo). Solo escribe en `nombresResueltos`, jamás
  // en `componentes` — así se agregan/quitan componentes libremente sin
  // interferencia de este efecto.
  useEffect(() => {
    if (!isOpen || componentes.length === 0) return;

    const idsPendientes = Array.from(
      new Set(
        componentes
          .filter(
            (c) =>
              !c._nombre &&
              !productosCatalogo.some((p) => p.product_id === c.product_id) &&
              !nombresResueltos[c.product_id]
          )
          .map((c) => c.product_id)
      )
    );

    if (idsPendientes.length === 0) return;

    let cancelado = false;
    (async () => {
      for (const productId of idsPendientes) {
        try {
          const res = await catalogService.getProductDetails(productId);
          const nombre = res?.data?.product?.name || res?.data?.name;
          if (!cancelado && nombre) {
            setNombresResueltos((prev) => ({ ...prev, [productId]: nombre }));
          }
        } catch (err) {
          console.error('No se pudo resolver el nombre del componente', productId, err);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [isOpen, componentes, productosCatalogo, nombresResueltos]);

  // Auto-generar el SKU cuando ya hay nombre, mientras el usuario no lo haya
  // editado a mano y estemos creando un paquete nuevo.
  useEffect(() => {
    if (!isOpen || esEdicion || skuEditadoManualmente) return;

    if (form.name.trim().length > 0) {
      const nuevoSku = generarSKU(form.name, CATEGORIA_PAQUETES);
      setForm((prev) => ({ ...prev, sku: nuevoSku }));
    }
  }, [form.name, isOpen, esEdicion, skuEditadoManualmente]);

  const handleChange = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSkuChange = (valor) => {
    setSkuEditadoManualmente(true);
    handleChange('sku', valor);
  };

  const regenerarSku = () => {
    if (!form.name.trim()) return;
    setSkuEditadoManualmente(false);
    handleChange('sku', generarSKU(form.name, CATEGORIA_PAQUETES));
  };

  // Nombre a mostrar para un componente: el que trajo al agregarlo, o el del
  // catálogo precargado, o el resuelto aparte, o null (todavía cargando).
  const nombreDeComponente = (c) =>
    c._nombre ||
    productosCatalogo.find((p) => p.product_id === c.product_id)?.name ||
    nombresResueltos[c.product_id] ||
    null;

  const elegirProductoParaComponente = async (productId) => {
    const producto = productosCatalogo.find((p) => p.product_id === productId);
    if (!producto) {
      setProductoSeleccionado(null);
      return;
    }
    setProductoSeleccionado(producto);
    setVarianteElegida('');
    setCantidadElegida(1);
    setCargandoVariantes(true);
    try {
      const res = await inventoryService.getByProduct(producto.product_id);
      const inv = res?.data?.inventory || [];
      setVariantesDisponibles(inv);
      if (inv.length === 1) setVarianteElegida(inv[0].variant_key);
    } catch (err) {
      console.error('Error cargando variantes', err);
      setVariantesDisponibles([]);
    } finally {
      setCargandoVariantes(false);
    }
  };

  const agregarComponente = () => {
    if (!productoSeleccionado || !varianteElegida || Number(cantidadElegida) < 1) return;

    setComponentes((prev) => {
      const yaExiste = prev.some(
        (c) => c.product_id === productoSeleccionado.product_id && c.variant_key === varianteElegida
      );
      if (yaExiste) {
        setError('Ese producto y variante ya está agregado como componente.');
        return prev;
      }
      setError(null);
      return [
        ...prev,
        {
          product_id: productoSeleccionado.product_id,
          variant_key: varianteElegida,
          quantity: Number(cantidadElegida),
          _nombre: productoSeleccionado.name,
        },
      ];
    });

    setProductoSeleccionado(null);
    setVariantesDisponibles([]);
    setVarianteElegida('');
    setCantidadElegida(1);
  };

  const quitarComponente = (index) => {
    setComponentes((prev) => prev.filter((_, i) => i !== index));
  };

  const validar = () => {
    if (!form.name.trim()) return 'El nombre es obligatorio.';
    if (!form.sku.trim()) return 'El SKU es obligatorio.';
    if (componentes.length === 0) return 'Agrega al menos un componente al paquete.';

    if (['sale', 'both'].includes(form.product_type) && !form.base_price) {
      return 'El precio de venta es obligatorio para este tipo de paquete.';
    }
    if (['rental', 'both'].includes(form.product_type)) {
      if (!form.rental_price_day) return 'El precio de alquiler por día es obligatorio.';
      if (!form.rental_deposit) return 'El depósito de garantía es obligatorio.';
    }
    return null;
  };

  const handleGuardar = async () => {
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setGuardando(true);
    setError(null);

    const payload = {
      name: form.name,
      description: form.description || undefined,
      category_id: form.category_id,
      sku: form.sku,
      product_type: form.product_type,
      is_package: true,
      components: componentes.map((c) => ({
        product_id: c.product_id,
        variant_key: c.variant_key,
        quantity: c.quantity,
      })),
    };

    if (['sale', 'both'].includes(form.product_type)) {
      payload.base_price = Number(form.base_price);
    }
    if (['rental', 'both'].includes(form.product_type)) {
      payload.rental_price_day = Number(form.rental_price_day);
      payload.rental_deposit = Number(form.rental_deposit);
    }

    try {
      if (esEdicion) {
        await catalogService.updateProduct(paqueteEditando.product_id, payload);
      } else {
        await catalogService.createProduct(payload);
      }
      onSaveSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error al guardar el paquete', err);
      setError(err.message || 'Error al guardar el paquete. Verifica los datos.');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">
              {esEdicion ? 'Editar paquete' : 'Nuevo paquete'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <PackageBasicInfoForm
            form={form}
            onChange={handleChange}
            esEdicion={esEdicion}
            onSkuChange={handleSkuChange}
            onRegenerarSku={regenerarSku}
          />

          <PackageComponentsSection
            componentes={componentes}
            nombreDeComponente={nombreDeComponente}
            onQuitarComponente={quitarComponente}
            productosCatalogo={productosCatalogo}
            cargandoCatalogoProductos={cargandoCatalogoProductos}
            productoSeleccionado={productoSeleccionado}
            onElegirProducto={elegirProductoParaComponente}
            onCancelarSeleccion={() => setProductoSeleccionado(null)}
            cargandoVariantes={cargandoVariantes}
            variantesDisponibles={variantesDisponibles}
            varianteElegida={varianteElegida}
            setVarianteElegida={setVarianteElegida}
            cantidadElegida={cantidadElegida}
            setCantidadElegida={setCantidadElegida}
            onAgregarComponente={agregarComponente}
          />
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={guardando}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
              </>
            ) : esEdicion ? (
              'Guardar cambios'
            ) : (
              'Crear paquete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}