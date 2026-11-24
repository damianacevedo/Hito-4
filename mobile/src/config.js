// URL base de la API. Se define en mobile/.env (ver .env.example).
// Expo solo reemplaza la variable si se lee exactamente como process.env.EXPO_PUBLIC_API_URL.
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!rawApiUrl) {
  console.warn(
    'Falta EXPO_PUBLIC_API_URL. Crea mobile/.env a partir de .env.example y reinicia Expo.'
  );
}

// Sin "/" final, para concatenar rutas que empiezan con "/".
export const API_URL = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '';

const config = { API_URL };
export default config;
