import axios from 'axios';
import useAuthStore from '@/store/authStore';
import {
  getAccessToken,
  setAccessToken,
  getIsRefreshing,
  setIsRefreshing,
  subscribeToRefresh,
  notifyRefreshSubscribers,
  resetTokenManager,
} from '@/services/auth/tokenManager';

const apiClient = axios.create({
  // Usar ruta relativa para que el proxy de Vite funcione
  // En desarrollo: /api/v1 → Vite proxy → http://back:3000/api/v1
  // En producción: /api/v1 → Nginx/Backend directo
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  // Ene 2026: Enviar cookies automáticamente (refreshToken httpOnly)
  withCredentials: true,
});

// ========== INTERCEPTOR DE REQUEST ==========
// Agregar token a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    // Ene 2026: Obtener token de memoria via tokenManager
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Si el data es FormData, dejar que axios maneje el Content-Type automáticamente
    // (necesario para el boundary de multipart/form-data)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ========== INTERCEPTOR DE RESPONSE ==========
// Manejo de errores y auto-refresh de token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos intentado refresh aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si ya hay un refresh en progreso, agregar a la cola
      if (getIsRefreshing()) {
        return new Promise((resolve, reject) => {
          subscribeToRefresh((refreshError, newToken) => {
            if (refreshError) {
              reject(refreshError);
            } else {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              resolve(apiClient(originalRequest));
            }
          });
        });
      }

      originalRequest._retry = true;
      setIsRefreshing(true);

      try {
        console.log('🔄 Token expirado, intentando refresh...');

        // Ene 2026: Hacer refresh con body vacío
        // La cookie httpOnly (refreshToken) se envía automáticamente
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {}, // Body vacío - el refreshToken viene en la cookie
          { withCredentials: true }
        );

        const { accessToken: newAccessToken } = response.data.data;

        console.log('✅ Token refrescado exitosamente');

        // Guardar nuevo token en memoria
        setAccessToken(newAccessToken);

        // Actualizar el header de la petición original
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Notificar a peticiones en cola
        notifyRefreshSubscribers(null, newAccessToken);

        setIsRefreshing(false);

        // Reintentar la petición original
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Error al refrescar token:', refreshError);
        notifyRefreshSubscribers(refreshError, null);
        setIsRefreshing(false);

        // Limpiar estado de autenticación
        resetTokenManager();
        useAuthStore.getState().logout();
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient as api };
