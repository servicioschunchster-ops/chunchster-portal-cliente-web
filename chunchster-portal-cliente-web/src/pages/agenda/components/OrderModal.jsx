import { useState, useEffect } from 'react';
import { X, Loader2, Package } from 'lucide-react';
import { invService } from '../../../services/invService';
import { agendaService } from '../../../services/agendaService';

export default function OrderModal({ isOpen, onClose, onOrderCreated }) {
  const [guardando, setGuardando] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  const [formValues, setFormValues] = useState({
    customer_id: 'CLI-DEMO-001',
    order_type: 'rental',
    delivery_type: 'pickup',
    rental_start: '',
    rental_end: '',
    product_id: '',
    quantity: 1,
    unit_price: 0,
    rental_days: 3
  });

  // Cargar productos del inventario al abrir el modal para que el usuario elija por nombre
  useEffect(() => {
    if (isOpen) {
      cargarInventarioParaSelector();
    }
  }, [isOpen]);

  const cargarInventarioParaSelector = async () => {
    try {
      setCargandoProductos(true);
      const res = await invService.getCatalog();
      const listaProds = res.data?.products || [];
      setProductos(listaProds);
      
      // Si hay productos, seleccionamos el primero por defecto y seteamos su precio
      if (listaProds.length > 0) {
        const primero = listaProds[0];
        setFormValues(prev => ({
          ...prev,
          product_id: primero.product_id,
          unit_price: primero.rental_price_day || primero.base_price || 0
        }));
      }
    } catch (err) {
      console.error("Error al cargar inventario para el selector", err);
    } finally {
      setCargandoProductos(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));

    // Si cambia el producto seleccionado, actualizamos automáticamente su precio unitario
    if (name === 'product_id') {
      const prodSeleccionado = productos.find(p => p.product_id === value);
      if (prodSeleccionado) {
        setFormValues(prev => ({
          ...prev,
          product_id: value,
          unit_price: prodSeleccionado.rental_price_day || prodSeleccionado.base_price || 0
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    const orderData = {
      customer_id: formValues.customer_id.trim(),
      order_type: formValues.order_type,
      delivery_type: formValues.delivery_type,
      rental_start: formValues.rental_start || undefined,
      rental_end: formValues.rental_end || undefined,
      items: [
        {
          product_id: formValues.product_id,
          inventory_id: "DEFAULT-INV",
          variant_key: "DEFAULT",
          quantity: parseInt(formValues.quantity),
          unit_price: parseFloat(formValues.unit_price),
          rental_days: parseInt(formValues.rental_days)
        }
      ]
    };

    try {
      const response = await agendaService.createOrder(orderData);
      onOrderCreated(response.data);
      onClose();
    } catch (err) {
      alert(err.message || 'Error al crear la reserva.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg transform transition-all overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <h3 className="text-lg font-bold text-gray-800">Registrar Nueva Reserva</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre o Código del Cliente</label>
            <input type="text" name="customer_id" value={formValues.customer_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Orden</label>
              <select name="order_type" value={formValues.order_type} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="rental">Alquiler</option>
                <option value="sale">Venta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Entrega</label>
              <select name="delivery_type" value={formValues.delivery_type} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="pickup">Recojo en tienda</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
          </div>

          {formValues.order_type === 'rental' && (
            <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
                <input type="date" name="rental_start" value={formValues.rental_start} onChange={handleChange} className="w-full px-3 py-2 bg-white border rounded-md text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Devolución</label>
                <input type="date" name="rental_end" value={formValues.rental_end} onChange={handleChange} className="w-full px-3 py-2 bg-white border rounded-md text-sm" required />
              </div>
            </div>
          )}

          {/* SELECTOR AMIGABLE DE PRODUCTOS DEL INVENTARIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Producto</label>
            {cargandoProductos ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-chunchster" /> Cargando catálogo...
              </div>
            ) : (
              <select name="product_id" value={formValues.product_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm bg-white" required>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input type="number" min="1" name="quantity" value={formValues.quantity} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario (S/)</label>
              <input type="number" step="0.01" name="unit_price" value={formValues.unit_price} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50" required />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border rounded-lg cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="px-4 py-2 text-sm font-medium text-white bg-chunchster rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50">
              {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
              {guardando ? 'Guardando...' : 'Crear en AWS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}