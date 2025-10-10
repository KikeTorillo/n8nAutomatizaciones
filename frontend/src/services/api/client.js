import axios from 'axios';
import { API_URL } from '@/lib/constants';

/**
 * Cliente Axios configurado con interceptors para JWT
 */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 segundos
});

/**
 * Request Interceptor
 * - Agrega token JWT automáticamente
 * - Agrega X-Organization-Id para super_admin
 */
apiClient.interceptors.request.use(
  (config) => {
    // Obtener tokens del localStorage
    const authData = localStorage.getItem('auth-storage');

    if (authData) {
      try {
        const { state } = JSON.parse(authData);
        const { accessToken, user } = state;

        // Agregar Authorization header
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Si es super_admin y hay organizacion_id en params, moverlo a header
        if (user?.rol === 'super_admin' && config.params?.organizacion_id) {
          config.headers['X-Organization-Id'] = config.params.organizacion_id;
          delete config.params.organizacion_id;
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * - Auto-refresh token en 401
 * - Manejo de errores centralizado
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no es un retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Obtener refresh token
        const authData = localStorage.getItem('auth-storage');
        if (!authData) {
          throw new Error('No auth data');
        }

        const { state } = JSON.parse(authData);
        const { refreshToken } = state;

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Intentar refresh
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Actualizar tokens en localStorage
        const updatedAuthData = {
          ...JSON.parse(authData),
          state: {
            ...state,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
        };
        localStorage.setItem('auth-storage', JSON.stringify(updatedAuthData));

        // Reintentar request original con nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Si falla el refresh, limpiar auth y redirigir a login
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Manejo de errores
    const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default apiClient;
