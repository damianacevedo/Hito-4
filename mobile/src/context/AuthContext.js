import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setAuthToken, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Campos del usuario de la sesión (misma forma que devuelve POST /auth/login).
const SESSION_USER_FIELDS = ['id', 'name', 'email', 'role', 'career', 'campus'];

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
  const [user, setUserState] = useState(null);
  // true mientras se recupera la sesión guardada al abrir la app.
  const [loading, setLoading] = useState(true);

  // Copia síncrona del usuario actual, para que updateUser sea una función estable
  // (no cambia en cada render) y siempre mezcle sobre el valor más reciente.
  const userRef = useRef(null);
  const setUser = useCallback((nextUser) => {
    userRef.current = nextUser;
    setUserState(nextUser);
  }, []);

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
  }, [setUser]);

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
  }, [setUser]);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);

    try {
      await clearStoredSession();
    } catch (err) {
      console.warn('No se pudo borrar la sesión guardada:', err?.message);
    }
  }, [setUser]);

  // Actualiza el usuario de la sesión (ej. tras GET o PATCH /users/me) sin tocar el token.
  // Mezcla los datos nuevos sobre el user actual, copiando solo los campos de la sesión,
  // para que el user guardado mantenga la misma forma que en el login.
  const updateUser = useCallback(
    async (changes) => {
      const current = userRef.current;
      if (!current || !changes) return current; // sin sesión (ej. tras logout) no hace nada

      const next = { ...current };
      let changed = false;
      SESSION_USER_FIELDS.forEach((key) => {
        if (changes[key] !== undefined && changes[key] !== current[key]) {
          next[key] = changes[key];
          changed = true;
        }
      });
      if (!changed) return current;

      setUser(next);
      try {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('No se pudo guardar el usuario actualizado:', err?.message);
      }
      return next;
    },
    [setUser]
  );

  // Si la API responde 401 a una petición con token (sesión expirada), se cierra la sesión.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(
    () => ({ user, token, login, logout, updateUser, loading }),
    [user, token, login, logout, updateUser, loading]
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
