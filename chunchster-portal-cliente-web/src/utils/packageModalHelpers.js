export const TIPO_OPCIONES = [
  { value: 'sale', label: 'Venta' },
  { value: 'rental', label: 'Alquiler' },
  { value: 'both', label: 'Venta y Alquiler' },
];

export const estadoInicial = {
  name: '',
  description: '',
  category_id: '',
  sku: '',
  product_type: 'sale',
  base_price: '',
  rental_price_day: '',
  rental_deposit: '',
  tags: '',
};

// ---- Helpers de atributos (misma lógica que ProductModal, como guía) ----
export const nuevaFilaAtributo = (key = '', value = '') => ({
  id: `attr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  key,
  value,
});

export const attributesAFilas = (attributes) => {
  if (!attributes || typeof attributes !== 'object') return [nuevaFilaAtributo()];
  const filas = Object.entries(attributes).map(([key, value]) =>
    nuevaFilaAtributo(key, Array.isArray(value) ? value.join(', ') : String(value ?? ''))
  );
  return filas.length ? filas : [nuevaFilaAtributo()];
};

export const filasAAttributes = (filas) => {
  const attributes = {};
  filas.forEach(({ key, value }) => {
    const claveLimpia = key.trim();
    if (!claveLimpia || value.trim() === '') return;
    const partes = value.split(',').map((v) => v.trim()).filter(Boolean);
    attributes[claveLimpia] = partes.length > 1 ? partes : partes[0];
  });
  return attributes;
};

// Genera un SKU en base al nombre y la categoría del paquete.
// Ej: nombre "Combo Quinceañera — vestido + tiara" + categoria "COMBOS"
//     -> "COMBOS-QUINCEANERA-VESTIDO-XXXX"
export function generarSKU(nombre, categoria) {
  const normalizar = (texto) =>
    texto
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita tildes
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const catSlug = normalizar(categoria);
  const nombreSlug = normalizar(nombre).split('-').filter(Boolean).slice(0, 3).join('-');
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase();

  return [catSlug, nombreSlug, sufijo].filter(Boolean).join('-');
}