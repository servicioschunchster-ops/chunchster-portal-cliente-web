import { useState, useEffect } from 'react';
import { X, Loader2, MapPin, CheckCircle2, UserPlus, Search } from 'lucide-react';
import { catalogService, inventoryService } from '../../../services/invService';
import { agendaService } from '../../../services/agendaService';
import { customerService } from '../../../services/customerService';

export default function OrderModal({ isOpen, onClose, onOrderCreated }) {
  const [guardando, setGuardando] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // ------------------------------------------
  // Cliente: buscar existente o crear uno nuevo
  // ------------------------------------------
  const [modoCliente, setModoCliente] = useState('existente'); // 'existente' | 'nuevo'
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [clienteNoEncontrado, setClienteNoEncontrado] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ name: '', phone_e164: '' });

  // ------------------------------------------
  // Inventario real de la variante seleccionada
  // ------------------------------------------
  const [variantes, setVariantes] = useState([]);
  const [cargandoVariantes, setCargandoVariantes] = useState(false);

  const formInicial = {
    customer_id: '',
    order_type: 'rental',
    delivery_type: 'pickup',
    rental_start: '',
    rental_end: '',
    product_id: '',
    inventory_id: '',
    variant_key: 'DEFAULT',
    quantity: 1,
    unit_price: 0,
    rental_days: 3,
    rental_deposit_unit: 100,
    street: '',
    district: '',
    city: 'Lima',
    country: 'PE',
  };

  const [formValues, setFormValues] = useState(formInicial);

  useEffect(() => {
    if (isOpen) {
      setFormValues(formInicial);
      setModoCliente('existente');
      setClienteEncontrado(null);
      setClienteNoEncontrado(false);
      setNuevoCliente({ name: '', phone_e164: '' });
      cargarInventarioParaSelector();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const cargarInventarioParaSelector = async () => {
    try {
      setCargandoProductos(true);
      const res = await catalogService.getCatalog();
      const listaProds = res.data?.products || [];
      setProductos(listaProds);

      if (listaProds.length > 0) {
        const primero = listaProds[0];
        setFormValues((prev) => ({
          ...prev,
          product_id: primero.product_id,
          unit_price: primero.rental_price_day || primero.base_price || 0,
          rental_deposit_unit: primero.rental_deposit || 100,
        }));
        cargarVariantesDelProducto(primero.product_id);
      }
    } catch (err) {
      console.error('Error al cargar catálogo', err);
    } finally {
      setCargandoProductos(false);
    }
  };

  /**
   * Trae el inventario real del producto (GET /inventory?product_id=...) para
   * dejar de mandar el inventory_id hardcodeado "inv-001".
   * NOTA: ajusta `res.data.inventory` al nombre real del campo que devuelva tu
   * API si es distinto (ej. res.data.items) — no tengo la doc exacta de esta
   * respuesta, así que lo dejo defensivo.
   */
  const cargarVariantesDelProducto = async (productId) => {
    if (!productId) return;
    setCargandoVariantes(true);
    try {
      const res = await inventoryService.getByProduct(productId);
      const lista = res.data?.inventory || res.data?.items || [];
      setVariantes(lista);
      if (lista.length > 0) {
        setFormValues((prev) => ({
          ...prev,
          inventory_id: lista[0].inventory_id,
          variant_key: lista[0].variant_key || 'DEFAULT',
        }));
      } else {
        // Sin inventario registrado para este producto: dejamos DEFAULT y
        // avisamos, en vez de fallar en silencio.
        setFormValues((prev) => ({ ...prev, inventory_id: '', variant_key: 'DEFAULT' }));
      }
    } catch (err) {
      console.error('Error al cargar inventario del producto', err);
      setVariantes([]);
    } finally {
      setCargandoVariantes(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    if (name === 'product_id') {
      const prodSeleccionado = productos.find((p) => p.product_id === value);
      if (prodSeleccionado) {
        setFormValues((prev) => ({
          ...prev,
          product_id: value,
          unit_price: prodSeleccionado.rental_price_day || prodSeleccionado.base_price || 0,
          rental_deposit_unit: prodSeleccionado.rental_deposit || 100,
        }));
      }
      cargarVariantesDelProducto(value);
    }
  };

  const handleVarianteChange = (e) => {
    const inventoryId = e.target.value;
    const variante = variantes.find((v) => v.inventory_id === inventoryId);
    setFormValues((prev) => ({
      ...prev,
      inventory_id: inventoryId,
      variant_key: variante?.variant_key || 'DEFAULT',
    }));
  };

  // ------------------------------------------
  // Verificar cliente por ID/teléfono existente
  // ------------------------------------------
  const buscarCliente = async () => {
    const id = formValues.customer_id.trim();
    if (!id) return;
    setBuscandoCliente(true);
    setClienteEncontrado(null);
    setClienteNoEncontrado(false);
    try {
      const res = await customerService.getCustomerById(id);
      setClienteEncontrado(res.data);
    } catch (err) {
      setClienteNoEncontrado(true);
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      // Si el usuario eligió registrar un cliente nuevo, lo creamos primero
      // y usamos el customer_id que devuelva la API.
      let customerId = formValues.customer_id.trim();
      if (modoCliente === 'nuevo') {
        if (!nuevoCliente.name.trim() || !nuevoCliente.phone_e164.trim()) {
          alert('Completa el nombre y teléfono del cliente nuevo.');
          setGuardando(false);
          return;
        }
        const clienteCreado = await customerService.createCustomer(nuevoCliente);
        customerId = clienteCreado.data?.customer_id;
        if (!customerId) throw new Error('No se pudo crear el cliente.');
      }

      const orderData = {
        customer_id: customerId,
        order_type: formValues.order_type,
        delivery_type: formValues.delivery_type,
        items: [
          {
            product_id: formValues.product_id,
            inventory_id: formValues.inventory_id || 'inv-001', // Fallback si el producto no tiene inventario cargado
            variant_key: formValues.variant_key,
            quantity: parseInt(formValues.quantity),
            unit_price: parseFloat(formValues.unit_price),
          },
        ],
      };

      if (formValues.order_type === 'rental') {
        orderData.rental_start = formValues.rental_start;
        orderData.rental_end = formValues.rental_end;
        orderData.items[0].rental_days = parseInt(formValues.rental_days);
        orderData.items[0].rental_deposit_unit = parseFloat(formValues.rental_deposit_unit);
      }

      if (formValues.delivery_type === 'delivery') {
        orderData.delivery_address = {
          street: formValues.street,
          district: formValues.district,
          city: formValues.city,
          country: formValues.country,
        };
      }

      const response = await agendaService.createOrder(orderData);
      onOrderCreated(response.data);
      onClose();
    } catch (err) {
      alert(err.message || 'Error al crear la reserva en AWS.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white rounded-t-xl">
          <h3 className="text-lg font-bold text-gray-900">Registrar Nueva Reserva</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto custom-scrollbar">

          {/* CLIENTE */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setModoCliente('existente')}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${modoCliente === 'existente' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                Cliente existente
              </button>
              <button
                type="button"
                onClick={() => setModoCliente('nuevo')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${modoCliente === 'nuevo' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                <UserPlus className="w-3 h-3" /> Cliente nuevo
              </button>
            </div>

            {modoCliente === 'existente' ? (
              <>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ID del Cliente</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="customer_id"
                    value={formValues.customer_id}
                    onChange={(e) => { handleChange(e); setClienteEncontrado(null); setClienteNoEncontrado(false); }}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-yellow-400 outline-none rounded-lg text-sm transition-all"
                    placeholder="Pega o escribe el customer_id"
                    required
                  />
                  <button
                    type="button"
                    onClick={buscarCliente}
                    disabled={buscandoCliente}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {buscandoCliente ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Verificar
                  </button>
                </div>
                {clienteEncontrado && (
                  <p className="mt-1.5 text-xs text-green-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {clienteEncontrado.name} · {clienteEncontrado.phone_e164}
                  </p>
                )}
                {clienteNoEncontrado && (
                  <p className="mt-1.5 text-xs text-red-600">
                    No se encontró un cliente con ese ID. Usa "Cliente nuevo" para registrarlo.
                  </p>
                )}
              </>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={nuevoCliente.name}
                  onChange={(e) => setNuevoCliente((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  required
                />
                <input
                  type="tel"
                  placeholder="Teléfono (formato +51...)"
                  value={nuevoCliente.phone_e164}
                  onChange={(e) => setNuevoCliente((prev) => ({ ...prev, phone_e164: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de Orden</label>
              <select name="order_type" value={formValues.order_type} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 focus:ring-2 focus:ring-yellow-400 outline-none rounded-lg text-sm">
                <option value="rental">Alquiler</option>
                <option value="sale">Venta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de Entrega</label>
              <select name="delivery_type" value={formValues.delivery_type} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 focus:ring-2 focus:ring-yellow-400 outline-none rounded-lg text-sm">
                <option value="pickup">Recojo en tienda</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
          </div>

          {formValues.delivery_type === 'delivery' && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm mb-2">
                <MapPin className="w-4 h-4 text-gray-500" /> Dirección de Entrega
              </div>
              <input type="text" name="street" placeholder="Calle / Avenida" value={formValues.street} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" name="district" placeholder="Distrito" value={formValues.district} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" required />
                <input type="text" name="city" placeholder="Ciudad" value={formValues.city} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm bg-gray-100" readOnly />
              </div>
            </div>
          )}

          {formValues.order_type === 'rental' && (
            <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha de Entrega</label>
                  <input type="date" name="rental_start" value={formValues.rental_start} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha de Devolución</label>
                  <input type="date" name="rental_end" value={formValues.rental_end} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Días de Alquiler</label>
                  <input type="number" min="1" name="rental_days" value={formValues.rental_days} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Depósito Garantía (S/)</label>
                  <input type="number" step="0.01" min="0" name="rental_deposit_unit" value={formValues.rental_deposit_unit} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono" required />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Seleccionar Producto</label>
            {cargandoProductos ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2 px-3 border border-gray-200 rounded-lg bg-gray-50">
                <Loader2 className="w-4 h-4 animate-spin text-yellow-500" /> Cargando catálogo...
              </div>
            ) : (
              <select name="product_id" value={formValues.product_id} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 focus:ring-2 focus:ring-yellow-400 outline-none rounded-lg text-sm" required>
                {productos.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.name} ({p.sku}) - S/ {p.rental_price_day || p.base_price}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* VARIANTE / INVENTARIO REAL */}
          {cargandoVariantes ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando stock disponible...
            </div>
          ) : variantes.length > 1 ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Variante / Talla</label>
              <select value={formValues.inventory_id} onChange={handleVarianteChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
                {variantes.map((v) => (
                  <option key={v.inventory_id} value={v.inventory_id}>
                    {v.variant_key} — Stock: {v.qty_available ?? '—'}
                  </option>
                ))}
              </select>
            </div>
          ) : variantes.length === 0 && !cargandoProductos ? (
            <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              Este producto no tiene inventario registrado. Se usará un ID temporal — actualiza el stock antes de confirmar.
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cantidad</label>
              <input type="number" min="1" name="quantity" value={formValues.quantity} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio Unitario (S/)</label>
              <input type="number" step="0.01" name="unit_price" value={formValues.unit_price} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" required />
            </div>
          </div>
        </form>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
            Cancelar
          </button>
          <button type="submit" onClick={handleSubmit} disabled={guardando} className="px-5 py-2 text-sm font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50">
            {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
            {guardando ? 'Procesando...' : 'Crear Orden'}
          </button>
        </div>
      </div>
    </div>
  );
}