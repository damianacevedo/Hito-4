// Formateo manual (sin Intl) para que se vea igual en Android e iOS.

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const ORDER_STATUS_LABELS = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  enviado: 'En camino',
  listo_retiro: 'Listo para retiro',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

// 15000 → "$15.000" (pesos chilenos, sin decimales).
export function formatPrice(precio) {
  const amount = Math.round(Number(precio) || 0);
  const sign = amount < 0 ? '-' : '';
  const digits = String(Math.abs(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$${digits}`;
}

// "2026-11-12T15:02:00.000Z" → "12 nov 2026" (en la hora local del teléfono).
export function formatDate(fecha) {
  if (!fecha) return '';
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// "listo_retiro" → "Listo para retiro". Un estado desconocido se devuelve tal cual.
export function orderStatusLabel(estado) {
  return ORDER_STATUS_LABELS[estado] || estado || '';
}
