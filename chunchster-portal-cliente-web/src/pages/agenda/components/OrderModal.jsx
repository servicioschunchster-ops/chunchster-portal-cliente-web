import { useState, useEffect } from 'react';
import { X, Loader2, MapPin } from 'lucide-react';
import { catalogService } from '../../../services/invService';
import { agendaService } from '../../../services/agendaService';

export default function OrderModal({ isOpen, onClose, onOrderCreated }) {
  const [guardando, setGuardando] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  const formInicial = {
    customer_id: 'CLI-DEMO-001',
    order_type: 'rental',
    delivery_type: 'pickup',
    rental_start: '',
    rental_end: '',
    product_id: '',
    variant_key: 'DEFAULT', // Necesario para el envío a la API[cite: 1]
    quantity: 1,
    unit_price: 0,
    rental_days: 3,
    rental_deposit_unit: 100,
    street: '',
    district: '',
    city: 'Lima',
    country: 'PE'
  };

  const [formValues, setFormValues] = useState(formInicial);

  useEffect(() => {
    if (isOpen) {
      setFormValues(formInicial); 
      cargarInventarioParaSelector();
    }
  }, [isOpen]);

  const cargarInventarioParaSelector = async () => {
    try {
      setCargandoProductos(true);
      const res = await catalogService.getCatalog();
      const listaProds = res.data?.products || [];
      setProductos(listaProds);
      
      if (listaProds.length > 0) {
        const primero = listaProds[0];
        setFormValues(prev => ({
          ...prev,
          product_id: primero.product_id,
          unit_price: primero.rental_price_day || primero.base_price || 0,
          rental_deposit_unit: primero.rental_deposit || 100,
          // Tomar la primera variante o dejar DEFAULT
          variant_key: primero.attributes?.tallas?.[0] ? `${primero.attributes.tallas[0]}-DEFAULT` : 'DEFAULT'
        }));
      }
    } catch (err) {
      console.error("Error al cargar catálogo", err);
    } finally {
      setCargandoProductos(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));

    // Autocompletar precios según selección de catálogo[cite: 1]
    if (name === 'product_id') {
      const prodSeleccionado = productos.find(p => p.product_id === value);
      if (prodSeleccionado) {
        setFormValues(prev => ({
          ...prev,
          product_id: value,
          unit_price: prodSeleccionado.rental_price_day || prodSeleccionado.base_price || 0,
          rental_deposit_unit: prodSeleccionado.rental_deposit || 100
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    // Estructura raíz requerida para la API versión 1.1[cite: 1]
    const orderData = {
      customer_id: formValues.customer_id.trim(),
      order_type: formValues.order_type,
      delivery_type: formValues.delivery_type,
      items: [
        {
          product_id: formValues.product_id,
          inventory_id: "inv-001", // Nota: En producción esto debe venir del GET /inventory
          variant_key: formValues.variant_key,
          quantity: parseInt(formValues.quantity),
          unit_price: parseFloat(formValues.unit_price)
        }
      ]
    };

    // Agregar fechas obligatorias a nivel raíz y configuración de depósito en el ítem si es alquiler[cite: 1]
    if (formValues.order_type === 'rental') {
      orderData.rental_start = formValues.rental_start;
      orderData.rental_end = formValues.rental_end;
      // Los días y el depósito unitario van a nivel de ítem[cite: 1]
      orderData.items[0].rental_days = parseInt(formValues.rental_days);
      orderData.items[0].rental_deposit_unit = parseFloat(formValues.rental_deposit_unit);
    }

    // El objeto delivery_address es requerido solo si delivery_type es 'delivery'[cite: 1]
    if (formValues.delivery_type === 'delivery') {
      orderData.delivery_address = {
        street: formValues.street,
        district: formValues.district,
        city: formValues.city,
        country: formValues.country
      };
    }

    try {
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
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white rounded-t-xl">
          <h3 className="text-lg font-bold text-gray-900">Registrar Nueva Reserva</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">ID o Código del Cliente</label>
            <input type="text" name="customer_id" value={formValues.customer_id} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-yellow-400 outline-none rounded-lg text-sm transition-all" required />
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

          {/* CAMPOS DINÁMICOS: DIRECCIÓN (Obligatorios si delivery_type es delivery)[cite: 1] */}
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

          {/* CAMPOS DINÁMICOS: FECHAS (Obligatorios si el order_type es rental)[cite: 1] */}
          {formValues.order_type === 'rental' && (
            <div className="grid grid-cols-2 gap-4 bg-yellow-50/50 p-4 rounded-lg border border-yellow-100">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha de Entrega</label>
                <input type="date" name="rental_start" value={formValues.rental_start} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha de Devolución</label>
                <input type="date" name="rental_end" value={formValues.rental_end} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" required />
              </div>
            </div>
          )}

          {/* SELECTOR DE PRODUCTOS */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Seleccionar Producto</label>
            {cargandoProductos ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2 px-3 border border-gray-200 rounded-lg bg-gray-50">
                <Loader2 className="w-4 h-4 animate-spin text-yellow-500" /> Cargando catálogo...
              </div>
            ) : (
              <select name="product_id" value={formValues.product_id} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 focus:ring-2 focus:ring-yellow-400 outline-none rounded-lg text-sm" required>
                {productos.map(p => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.name} ({p.sku}) - S/ {p.rental_price_day || p.base_price}
                  </option>
                ))}
              </select>
            )}
          </div>

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

        {/* FOOTER DEL MODAL */}
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