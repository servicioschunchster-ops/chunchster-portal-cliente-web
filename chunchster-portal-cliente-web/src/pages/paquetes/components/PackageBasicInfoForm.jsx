import { Sparkles } from 'lucide-react';
import { TIPO_OPCIONES } from '../../../utils/packageModalHelpers';

export default function PackageBasicInfoForm({
  form,
  onChange,
  esEdicion,
  onSkuChange,
  onRegenerarSku,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nombre del paquete</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Combo Quinceañera — vestido + tiara"
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={2}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block flex items-center justify-between">
          <span>SKU</span>
          {!esEdicion && (
            <button
              type="button"
              onClick={onRegenerarSku}
              disabled={!form.name.trim()}
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
          placeholder={esEdicion ? '' : 'Se genera al escribir el nombre'}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Tipo</label>
        <div className="flex gap-2 flex-wrap">
          {TIPO_OPCIONES.map((op) => (
            <button
              key={op.value}
              type="button"
              onClick={() => onChange('product_type', op.value)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
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
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Precio de venta (S/)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.base_price}
            onChange={(e) => onChange('base_price', e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      )}

      {['rental', 'both'].includes(form.product_type) && (
        <>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Alquiler por día (S/)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.rental_price_day}
              onChange={(e) => onChange('rental_price_day', e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Depósito garantía (S/)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.rental_deposit}
              onChange={(e) => onChange('rental_deposit', e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </>
      )}
    </div>
  );
}