import axios from 'axios';
import useAuthStore from '@/store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable para controlar el refresh en progreso
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// ========== INTERCEPTOR DE REQUEST ==========
// Agregar token a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
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
      if (isRefreshing) {
        // Si ya hay un refresh en progreso, agregar esta petición a la cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, accessToken } = useAuthStore.getState();

      // Si NO hay refreshToken pero SÍ hay accessToken (onboarding),
      // el token de onboarding dura 7 días y no necesita refresh.
      // El 401 indica que el token es inválido/expirado, hacer logout.
      if (!refreshToken) {
        console.log('⚠️ Sin refreshToken - Token de onboarding expirado/inválido');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        console.log('🔄 Token expirado, intentando refresh...');

        // Hacer refresh sin el interceptor (para evitar loop)
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        console.log('✅ Tokens refrescados exitosamente');

        // Actualizar tokens en el store
        useAuthStore.getState().setTokens({
          accessToken,
          refreshToken: newRefreshToken,
        });

        // Actualizar el header de la petición original
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        // Procesar la cola de peticiones fallidas
        processQueue(null, accessToken);

        isRefreshing = false;

        // Reintentar la petición original
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Error al refrescar token:', refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;

        // Si falla el refresh, hacer logout
        useAuthStore.getState().logout();
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
