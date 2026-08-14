import { Sparkles } from 'lucide-react';
import { TIPO_OPCIONES } from '../../../utils/packageModalHelpers';

export default function PackageBasicInfoForm({
  form,
  onChange,
  esEdicion,
  categoriasDisponibles,
  cargandoCategorias,
  categoriaNuevaModo,
  setCategoriaNuevaModo,
  onSkuChange,
  onRegenerarSku,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre del paquete</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Combo Quinceañera — vestido + tiara"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Categoría</label>
        {categoriaNuevaModo ? (
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={form.category_id}
              onChange={(e) => onChange('category_id', e.target.value)}
              placeholder="Nombre de la nueva categoría"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              type="button"
              onClick={() => {
                setCategoriaNuevaModo(false);
                onChange('category_id', '');
              }}
              title="Volver a elegir de la lista"
              className="px-2 text-xs text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg cursor-pointer shrink-0"
            >
              Lista
            </button>
          </div>
        ) : (
          <select
            value={form.category_id}
            onChange={(e) => {
              if (e.target.value === '__nueva__') {
                setCategoriaNuevaModo(true);
                onChange('category_id', '');
              } else {
                onChange('category_id', e.target.value);
              }
            }}
            disabled={cargandoCategorias}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer disabled:opacity-50"
          >
            <option value="">
              {cargandoCategorias ? 'Cargando categorías...' : 'Selecciona una categoría'}
            </option>
            {categoriasDisponibles.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__nueva__">+ Nueva categoría...</option>
          </select>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center justify-between">
          <span>SKU</span>
          {!esEdicion && (
            <button
              type="button"
              onClick={onRegenerarSku}
              disabled={!form.name.trim() || !form.category_id.trim()}
              title="Regenerar SKU automáticamente"
              className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 disabled:opacity-30 disabled:hover:text-indigo-500 cursor-pointer normal-case font-medium"
            >
              <Sparkles className="w-3 h-3" /> Auto
            </button>
          )}
        </label>
        <input
          type="text"
          value={form.sku}
          onChange={(e) => onSkuChange(e.target.value)}
          placeholder={esEdicion ? '' : 'Se genera al completar nombre y categoría'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Tipo</label>
        <div className="flex gap-2">
          {TIPO_OPCIONES.map((op) => (
            <button
              key={op.value}
              type="button"
              onClick={() => onChange('product_type', op.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                form.product_type === op.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {['sale', 'both'].includes(form.product_type) && (
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Precio de venta (S/)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.base_price}
            onChange={(e) => onChange('base_price', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      )}

      {['rental', 'both'].includes(form.product_type) && (
        <>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Alquiler por día (S/)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.rental_price_day}
              onChange={(e) => onChange('rental_price_day', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Depósito garantía (S/)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.rental_deposit}
              onChange={(e) => onChange('rental_deposit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </>
      )}

      <div className="sm:col-span-2">
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Etiquetas (tags)</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => onChange('tags', e.target.value)}
          placeholder="Ej. combo, quinceañera, vestido, tiara"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <p className="text-xs text-gray-400 mt-1">Sepáralas con comas. Se usan para la búsqueda multi-tag del catálogo.</p>
      </div>
    </div>
  );
}