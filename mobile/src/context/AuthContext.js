import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setAuthToken, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Lee la sesión guardada. Si el usuario guardado está corrupto, se descarta todo.
async function readStoredSession() {
  const [storedToken, storedUser] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY),
  ]);

  if (!storedToken || !storedUser) return null;

  try {
    return { token: storedToken, user: JSON.parse(storedUser) };
  } catch {
    await clearStoredSession();
    return null;
  }
}

async function clearStoredSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  // true mientras se recupera la sesión guardada al abrir la app.
  const [loading, setLoading] = useState(true);

  // Al abrir la app, recupera la sesión guardada en SecureStore.
  useEffect(() => {
    let cancelled = false;

    readStoredSession()
      .then((session) => {
        if (cancelled || !session) return;
        setAuthToken(session.token);
        setToken(session.token);
        setUser(session.user);
      })
      .catch((err) => {
        console.warn('No se pudo recuperar la sesión guardada:', err?.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // POST /auth/login → { accessToken, user }.
  // Si la API falla, el error de api.js se propaga tal cual (err.message y err.status).
  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email: email.trim(), password });

    if (!data?.accessToken || !data?.user) {
      throw new Error('Respuesta inesperada del servidor al iniciar sesión');
    }

    // Primero el token del cliente HTTP, para que la primera petición tras el login ya lo lleve.
    setAuthToken(data.accessToken);

    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, data.accessToken),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user)),
      ]);
    } catch (err) {
      // La sesión funciona igual; solo no se recordará al cerrar la app.
      console.warn('No se pudo guardar la sesión en el dispositivo:', err?.message);
    }

    setToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);

    try {
      await clearStoredSession();
    } catch (err) {
      console.warn('No se pudo borrar la sesión guardada:', err?.message);
    }
  }, []);

  // Si la API responde 401 a una petición con token (sesión expirada), se cierra la sesión.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(
    () => ({ user, token, login, logout, loading }),
    [user, token, login, logout, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export default AuthContext;
