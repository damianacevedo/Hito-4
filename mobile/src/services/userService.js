import api from './api';

// Únicos campos que acepta PATCH /users/me. Cualquier otro (email, role...) responde 400.
const EDITABLE_FIELDS = ['name', 'career', 'campus', 'phone'];

export const userService = {
  // GET /users/me → { id, name, email, role, career, campus, phone, createdAt }
  async getMe() {
    return api.get('/users/me');
  },

  // PATCH /users/me  body: { name?, career?, campus?, phone? }
  // Un texto vacío en career, campus o phone borra el dato en el backend.
  async updateMe(datos = {}) {
    const body = {};
    EDITABLE_FIELDS.forEach((key) => {
      const value = datos[key];
      if (value !== undefined && value !== null) {
        body[key] = String(value).trim();
      }
    });
    return api.patch('/users/me', body);
  },
};

export default userService;
