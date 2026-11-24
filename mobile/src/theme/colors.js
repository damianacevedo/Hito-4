// Identidad visual de la web (frontend/src/styles/styles.css), adaptada a la app.
const colors = {
  // Rojo UNAB: color principal (--unab-red y sus variantes).
  primary: '#AD0F0F',
  primaryDark: '#810B0B', // --unab-red-hover
  primaryActive: '#670808', // --unab-red-active
  primaryLight: '#FDF2F2', // --unab-red-light
  secondary: '#810B0B', // mismo que primaryDark: corazones, acciones destacadas

  // Azul institucional: solo como color de apoyo (ej. "Marketplace" en el logo).
  navy: '#0E2133',

  background: '#F8F9FA', // --unab-gray-bg
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9', // fondos grises suaves (miniaturas, marcadores)
  border: '#E2E8F0', // --unab-border

  text: '#212529',
  textMuted: '#6C757D',
  textOnPrimary: '#FFFFFF',

  success: '#15803D',
  danger: '#B91C1C',
  dangerLight: '#FEF2F2', // fondo de los avisos de error
  inactive: '#94A3B8',
};

export default colors;
