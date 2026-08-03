import { useState, useEffect } from 'react';
import { X, Wand2, Loader2, Image as ImageIcon } from 'lucide-react';
import { invService } from '../../../services/invService';

export default function ProductModal({ isOpen, onClose, productoEditando, onSaveSuccess }) {
  const [guardando, setGuardando] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '', sku: '', category_id: 'GENERAL', product_type: 'rental',
    base_price: '', rental_price_day: '', rental_deposit: ''
  });

  // Estado para la imagen seleccionada
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setImagenArchivo(null);
      setImagenPreview(null);
      if (productoEditando) {
        setFormValues({
          name: productoEditando.name || '',
          sku: productoEditando.sku || '',
          category_id: productoEditando.category_id || 'GENERAL',
          product_type: productoEditando.product_type || 'rental',
          base_price: productoEditando.base_price || '',
          rental_price_day: productoEditando.rental_price_day || '',
          rental_deposit: productoEditando.rental_deposit || ''
        });
      } else {
        setFormValues({
          name: '', sku: '', category_id: 'GENERAL', product_type: 'rental',
          base_price: '', rental_price_day: '', rental_deposit: ''
        });
      }
    }
  }, [isOpen, productoEditando]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Manejar la selección de la imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenArchivo(file);
      setImagenPreview(URL.createObjectURL(file));
    }
  };

  // Función auxiliar para convertir archivo a Base64
 // Función para comprimir la imagen antes de convertirla a Base64
  const comprimirYConvertirBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Ancho máximo seguro para la API
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Comprimimos a formato JPEG con calidad del 80% para evitar el error 413
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64String = dataUrl.split(',')[1];
          resolve(base64String);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };
  const generarSKU = () => {
    if (!formValues.name) {
      alert("Escribe primero el nombre del producto para generar el SKU.");
      return;
    }
    const prefijo = formValues.category_id.substring(0, 3).toUpperCase();
    const nombreLimpio = formValues.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    setFormValues(prev => ({ ...prev, sku: `${prefijo}-${nombreLimpio}-${random}` }));
  };

const guardarProducto = async (e) => {
    e.preventDefault();
    setGuardando(true);

    const productoData = {
      name: formValues.name.trim(),
      sku: formValues.sku.trim().toUpperCase(),
      category_id: formValues.category_id,
      product_type: formValues.product_type,
      base_price: parseFloat(formValues.base_price),
    };

    if (['rental', 'both'].includes(formValues.product_type)) {
      productoData.rental_price_day = parseFloat(formValues.rental_price_day);
      productoData.rental_deposit = parseFloat(formValues.rental_deposit);
    }

    try {
      let productId = productoEditando?.product_id;

      if (productoEditando) {
        await invService.updateProduct(productId, productoData);
      } else {
        const response = await invService.createProduct(productoData);
        productId = response.data.product_id;
      }

      // Intentamos subir la imagen, pero si el servidor de AWS bloquea por CORS, 
      // atrapamos el error para que al menos el producto sí se guarde con éxito.
      if (imagenArchivo && productId) {
        try {
          const base64Image = await comprimirYConvertirBase64(imagenArchivo);
          await invService.uploadProductImage(productId, {
            content_type: imagenArchivo.type,
            image: base64Image,
            orientation: 'FRONT',
            replace: true
          });
        } catch (imageError) {
          console.warn("Aviso: El producto se guardó, pero la imagen falló por restricciones de CORS en el servidor de AWS:", imageError);
          alert("Producto guardado correctamente, pero la subida de la foto fue bloqueada por la política de CORS de AWS.");
        }
      }

      onSaveSuccess(); 
      onClose(); 
    } catch (error) {
      alert(error.message || "Error al guardar el producto. Verifica que el SKU no esté repetido.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl transform transition-all overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <h3 className="text-lg font-bold text-gray-800">
            {productoEditando ? 'Editar Producto' : 'Crear Nuevo Producto'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={guardarProducto} className="p-5 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* SECCIÓN DE FOTO */}
            <div className="sm:col-span-2 flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="w-20 h-20 bg-white rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                {imagenPreview ? (
                  <img src={imagenPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fotografía Principal</label>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp, image/gif"
                  onChange={handleImageChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-chunchster/10 file:text-chunchster hover:file:bg-chunchster/20 cursor-pointer" 
                />
                <p className="text-xs text-gray-400 mt-1">Formatos permitidos: JPG, PNG, WebP</p>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
              <input type="text" name="name" value={formValues.name} onChange={handleChange} placeholder="Ej. Vestido de Noche Aurora" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chunchster" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select name="category_id" value={formValues.category_id} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chunchster">
                <option value="GENERAL">General</option>
                <option value="VESTIDOS-NOCHE">Vestidos de Noche</option>
                <option value="VESTIDOS-BODA">Vestidos de Boda</option>
                <option value="ACCESORIOS">Accesorios</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Código único)</label>
              <div className="flex gap-2">
                <input type="text" name="sku" value={formValues.sku} onChange={handleChange} placeholder="Ej. VEST-AURO-1234" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chunchster uppercase font-mono text-sm" required />
                <button type="button" onClick={generarSKU} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 transition-colors flex items-center justify-center cursor-pointer" title="Auto-generar SKU">
                  <Wand2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Negocio</label>
              <select name="product_type" value={formValues.product_type} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chunchster">
                <option value="rental">Solo Alquiler</option>
                <option value="sale">Solo Venta</option>
                <option value="both">Alquiler y Venta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta Base (S/)</label>
              <input type="number" name="base_price" step="0.01" min="0" value={formValues.base_price} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chunchster" required />
            </div>

            {['rental', 'both'].includes(formValues.product_type) && (
              <>
                <div className="sm:col-span-2 pt-2 pb-1">
                  <h4 className="text-sm font-bold text-gray-800 border-b pb-1">Configuración de Alquiler</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Alquiler / Día (S/)</label>
                  <input type="number" name="rental_price_day" step="0.01" min="0" value={formValues.rental_price_day} onChange={handleChange} className="w-full px-4 py-2 bg-blue-50/50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chunchster" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depósito de Garantía (S/)</label>
                  <input type="number" name="rental_deposit" step="0.01" min="0" value={formValues.rental_deposit} onChange={handleChange} className="w-full px-4 py-2 bg-blue-50/50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-chunchster" required />
                </div>
              </>
            )}
          </div>
          <div className="pt-5 flex justify-end gap-3 border-t border-gray-100 mt-6 bg-white">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="px-5 py-2.5 text-sm font-medium text-white bg-chunchster rounded-lg hover:bg-chunchster-hover transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer">
              {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
              {guardando ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}