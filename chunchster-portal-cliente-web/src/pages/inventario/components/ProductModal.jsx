import { useState, useEffect, useRef } from 'react';
import { X, Wand2, Loader2, Image as ImageIcon, Trash2, UploadCloud } from 'lucide-react';
import { catalogService } from '../../../services/invService';

const ORIENTACIONES = [
  { id: 'FRONT', label: 'Frente' },
  { id: 'BACK', label: 'Atrás' },
  { id: 'LEFT', label: 'Izquierda' },
  { id: 'RIGHT', label: 'Derecha' }
];

export default function ProductModal({ isOpen, onClose, productoEditando, onSaveSuccess }) {
  const [guardando, setGuardando] = useState(false);
  
  const [formValues, setFormValues] = useState({
    name: '', sku: '', category_id: 'GENERAL', product_type: 'rental',
    base_price: '', rental_price_day: '', rental_deposit: ''
  });

  const [galeria, setGaleria] = useState({
    FRONT: { url: null, file: null, isNew: false },
    BACK: { url: null, file: null, isNew: false },
    LEFT: { url: null, file: null, isNew: false },
    RIGHT: { url: null, file: null, isNew: false }
  });

  const fileInputRefs = {
    FRONT: useRef(null),
    BACK: useRef(null),
    LEFT: useRef(null),
    RIGHT: useRef(null)
  };

  useEffect(() => {
    if (isOpen) {
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

        const urls = productoEditando.images || [];
        
        // CORRECCIÓN: Buscamos la URL basándonos en la carpeta de orientación de AWS
        const getUrlPorOrientacion = (orientacion) => {
          return urls.find(url => url.includes(`/${orientacion}/`)) || null;
        };

        setGaleria({
          FRONT: { url: getUrlPorOrientacion('FRONT'), file: null, isNew: false },
          BACK:  { url: getUrlPorOrientacion('BACK'), file: null, isNew: false },
          LEFT:  { url: getUrlPorOrientacion('LEFT'), file: null, isNew: false },
          RIGHT: { url: getUrlPorOrientacion('RIGHT'), file: null, isNew: false }
        });
      } else {
        setFormValues({
          name: '', sku: '', category_id: 'GENERAL', product_type: 'rental',
          base_price: '', rental_price_day: '', rental_deposit: ''
        });
        setGaleria({
          FRONT: { url: null, file: null, isNew: false },
          BACK: { url: null, file: null, isNew: false },
          LEFT: { url: null, file: null, isNew: false },
          RIGHT: { url: null, file: null, isNew: false }
        });
      }
    }
  }, [isOpen, productoEditando]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (orientacion, e) => {
    const file = e.target.files[0];
    if (file) {
      setGaleria(prev => ({
        ...prev,
        [orientacion]: {
          url: URL.createObjectURL(file),
          file: file,
          isNew: true
        }
      }));
    }
  };

  const handleRemoveImage = (orientacion) => {
    setGaleria(prev => ({
      ...prev,
      [orientacion]: { url: null, file: null, isNew: false }
    }));
  };

  const comprimirYConvertirBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
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

          resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const generarSKU = () => {
    if (!formValues.name) {
      alert("Escribe primero el nombre del producto.");
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

    const urlsMantenidas = Object.values(galeria)
      .filter(slot => slot.url && !slot.isNew)
      .map(slot => slot.url);

    const productoData = {
      name: formValues.name.trim(),
      sku: formValues.sku.trim().toUpperCase(),
      category_id: formValues.category_id,
      product_type: formValues.product_type,
      base_price: parseFloat(formValues.base_price),
      images: urlsMantenidas 
    };

    if (['rental', 'both'].includes(formValues.product_type)) {
      productoData.rental_price_day = parseFloat(formValues.rental_price_day);
      productoData.rental_deposit = parseFloat(formValues.rental_deposit);
    }

    try {
      let productId = productoEditando?.product_id;

      if (productoEditando) {
        await catalogService.updateProduct(productId, productoData);
      } else {
        const response = await catalogService.createProduct(productoData);
        productId = response.data.product_id;
      }

      const subidas = ORIENTACIONES.map(async ({ id: orientacion }) => {
        const slot = galeria[orientacion];
        if (slot.isNew && slot.file) {
          const base64Image = await comprimirYConvertirBase64(slot.file);
          
          return catalogService.uploadProductImage(productId, {
            content_type: slot.file.type,
            image: base64Image,
            orientation: orientacion,
            replace: true
          });
        }
      });

      try {
        await Promise.all(subidas.filter(Boolean));
      } catch (imageError) {
        console.warn("Error al subir algunas imágenes:", imageError);
        alert("El producto se guardó, pero algunas fotos fueron rechazadas.");
      }

      onSaveSuccess(); 
      onClose(); 
    } catch (error) {
      alert(error.message || "Error al guardar el producto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl transform transition-all overflow-hidden max-h-[90vh] flex flex-col">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <h3 className="text-lg font-bold text-gray-800">
            {productoEditando ? 'Editar Producto' : 'Crear Nuevo Producto'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={guardarProducto} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h4 className="block text-sm font-bold text-gray-700 mb-4">Fotos del Producto por Ángulo</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ORIENTACIONES.map(({ id, label }) => {
                const slot = galeria[id];
                
                return (
                  <div key={id} className="flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
                    
                    <div 
                      className={`relative w-full aspect-square rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center group transition-colors ${slot.url ? 'border-gray-200 bg-white' : 'border-dashed border-gray-300 bg-gray-50 hover:bg-white hover:border-yellow-400 cursor-pointer'}`}
                      onClick={() => !slot.url && fileInputRefs[id].current.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRefs[id]}
                        accept="image/jpeg, image/png, image/webp"
                        onChange={(e) => handleImageSelect(id, e)}
                        className="hidden" 
                      />

                      {slot.url ? (
                        <>
                          <img src={slot.url} alt={label} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(id); }}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 text-red-500 hover:text-red-700 hover:bg-white rounded-md shadow-sm transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {slot.isNew && (
                            <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded uppercase shadow-sm">Nueva</span>
                          )}
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-yellow-500 transition-colors mb-1" />
                          <span className="text-xs text-gray-400 group-hover:text-yellow-600 font-medium">Subir</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del Producto</label>
              <input type="text" name="name" value={formValues.name} onChange={handleChange} placeholder="Ej. Vestido de Noche Aurora" className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm" required />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoría</label>
              <select name="category_id" value={formValues.category_id} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm">
                <option value="GENERAL">General</option>
                <option value="VESTIDOS-NOCHE">Vestidos de Noche</option>
                <option value="VESTIDOS-BODA">Vestidos de Boda</option>
                <option value="ACCESORIOS">Accesorios</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">SKU (Código único)</label>
              <div className="flex gap-2">
                <input type="text" name="sku" value={formValues.sku} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg uppercase font-mono text-sm shadow-sm" required />
                <button type="button" onClick={generarSKU} className="bg-white text-gray-700 px-3 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer shadow-sm">
                  <Wand2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de Negocio</label>
              <select name="product_type" value={formValues.product_type} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm">
                <option value="rental">Solo Alquiler</option>
                <option value="sale">Solo Venta</option>
                <option value="both">Alquiler y Venta</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio de Venta Base (S/)</label>
              <input type="number" name="base_price" step="0.01" min="0" value={formValues.base_price} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm font-mono" required />
            </div>

            {['rental', 'both'].includes(formValues.product_type) && (
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio Alquiler / Día (S/)</label>
                  <input type="number" name="rental_price_day" step="0.01" min="0" value={formValues.rental_price_day} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono shadow-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Depósito de Garantía (S/)</label>
                  <input type="number" name="rental_deposit" step="0.01" min="0" value={formValues.rental_deposit} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono shadow-sm" required />
                </div>
              </div>
            )}
          </div>
          
          <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer shadow-sm">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="px-5 py-2 text-sm font-bold text-gray-900 bg-yellow-400 rounded-lg hover:bg-yellow-500 flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer">
              {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
              {guardando ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}