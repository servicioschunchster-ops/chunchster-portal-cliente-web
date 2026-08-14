import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Package } from 'lucide-react';
import { catalogService, inventoryService } from '../../../services/invService';
import {
  estadoInicial,
  nuevaFilaAtributo,
  attributesAFilas,
  filasAAttributes,
  generarSKU,
} from '../../../utils/packageModalHelpers';
import PackageBasicInfoForm from './PackageBasicInfoForm';
import PackageAttributesEditor from './PackageAttributesEditor';
import PackageComponentsSection from './PackageComponentsSection';

export default function PackageModal({ isOpen, onClose, paqueteEditando, onSaveSuccess }) {
  const esEdicion = Boolean(paqueteEditando);

  const [form, setForm] = useState(estadoInicial);
  const [atributos, setAtributos] = useState([nuevaFilaAtributo()]);
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

  // Categorías reales tomadas del catálogo (GET /catalog), no una lista fija.
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [categoriaNuevaModo, setCategoriaNuevaModo] = useState(false);

  // Catálogo de productos (activos, no-paquete) precargado una vez al abrir el
  // modal. El selector de componentes se llena con esta lista completa
  // (sin buscador, elección directa).
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
        category_id: paqueteEditando.category_id || '',
        sku: paqueteEditando.sku || '',
        product_type: paqueteEditando.product_type || 'sale',
        base_price: paqueteEditando.base_price ?? '',
        rental_price_day: paqueteEditando.rental_price_day ?? '',
        rental_deposit: paqueteEditando.rental_deposit ?? '',
        tags: (paqueteEditando.tags || []).join(', '),
      });
      setAtributos(attributesAFilas(paqueteEditando.attributes));
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
      setForm(estadoInicial);
      setAtributos([nuevaFilaAtributo()]);
      setComponentes([]);
      setSkuEditadoManualmente(false);
    }
    setError(null);
    setProductoSeleccionado(null);
    setVariantesDisponibles([]);
    setVarianteElegida('');
    setCantidadElegida(1);
    setCategoriaNuevaModo(false);
    setNombresResueltos({});
  }, [isOpen, esEdicion, paqueteEditando]);

  // Trae las categorías reales que ya existen en el catálogo (productos + paquetes)
  // para poblar el <select> de Categoría, en vez de dejarlo como texto libre.
  useEffect(() => {
    if (!isOpen) return;

    const cargarCategorias = async () => {
      setCargandoCategorias(true);
      try {
        const res = await catalogService.getCatalog({ limit: 100 });
        const productos = res?.data?.products || [];
        const unicas = Array.from(
          new Set(productos.map((p) => p.category_id).filter((c) => c && c.trim().length > 0))
        ).sort((a, b) => a.localeCompare(b));
        setCategoriasDisponibles(unicas);

        // Si estamos editando y la categoría del paquete no está en la lista
        // (por paginación u otro motivo), la agregamos igual para no perderla.
        if (esEdicion && paqueteEditando?.category_id && !unicas.includes(paqueteEditando.category_id)) {
          setCategoriasDisponibles((prev) =>
            [...prev, paqueteEditando.category_id].sort((a, b) => a.localeCompare(b))
          );
        }
      } catch (err) {
        console.error('Error cargando categorías', err);
        setCategoriasDisponibles([]);
      } finally {
        setCargandoCategorias(false);
      }
    };

    cargarCategorias();
  }, [isOpen, esEdicion, paqueteEditando]);

  // Precarga el catálogo de productos activos (no-paquete) una sola vez al
  // abrir el modal, para que "Componentes del paquete" sea un selector directo
  // (sin buscador) con todos los productos disponibles.
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

  // Auto-generar el SKU cuando ya hay nombre + categoría, mientras el usuario
  // no lo haya editado a mano y estemos creando un paquete nuevo.
  useEffect(() => {
    if (!isOpen || esEdicion || skuEditadoManualmente) return;

    const nombreListo = form.name.trim().length > 0;
    const categoriaLista = form.category_id.trim().length > 0;

    if (nombreListo && categoriaLista) {
      const nuevoSku = generarSKU(form.name, form.category_id);
      setForm((prev) => ({ ...prev, sku: nuevoSku }));
    }
  }, [form.name, form.category_id, isOpen, esEdicion, skuEditadoManualmente]);

  const handleChange = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSkuChange = (valor) => {
    setSkuEditadoManualmente(true);
    handleChange('sku', valor);
  };

  const regenerarSku = () => {
    if (!form.name.trim() || !form.category_id.trim()) return;
    setSkuEditadoManualmente(false);
    handleChange('sku', generarSKU(form.name, form.category_id));
  };

  const handleAtributoChange = (id, campo, valor) => {
    setAtributos((prev) => prev.map((fila) => (fila.id === id ? { ...fila, [campo]: valor } : fila)));
  };

  const agregarAtributo = () => {
    setAtributos((prev) => [...prev, nuevaFilaAtributo()]);
  };

  const eliminarAtributo = (id) => {
    setAtributos((prev) => (prev.length > 1 ? prev.filter((fila) => fila.id !== id) : prev));
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
    if (!form.category_id.trim()) return 'La categoría es obligatoria.';
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

    const tagsArray = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const attributes = filasAAttributes(atributos);

    const payload = {
      name: form.name,
      description: form.description || undefined,
      category_id: form.category_id,
      sku: form.sku,
      product_type: form.product_type,
      is_package: true,
      tags: tagsArray.length ? tagsArray : undefined,
      attributes: Object.keys(attributes).length ? attributes : undefined,
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
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
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

        <div className="p-5 overflow-y-auto space-y-5">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <PackageBasicInfoForm
            form={form}
            onChange={handleChange}
            esEdicion={esEdicion}
            categoriasDisponibles={categoriasDisponibles}
            cargandoCategorias={cargandoCategorias}
            categoriaNuevaModo={categoriaNuevaModo}
            setCategoriaNuevaModo={setCategoriaNuevaModo}
            onSkuChange={handleSkuChange}
            onRegenerarSku={regenerarSku}
          />

          <PackageAttributesEditor
            atributos={atributos}
            onAtributoChange={handleAtributoChange}
            onAgregar={agregarAtributo}
            onEliminar={eliminarAtributo}
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