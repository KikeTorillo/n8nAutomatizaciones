import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
// NOTA: Importar directamente para evitar dependencia circular con features/auth/index.js
import useAuthStore from '@/features/auth/store/authStore';
import {
  getAccessToken,
  setAccessToken,
  getIsRefreshing,
  setIsRefreshing,
  subscribeToRefresh,
  notifyRefreshSubscribers,
  resetTokenManager,
} from '@/features/auth/services/tokenManager';

// ========== TYPES ==========

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ========== API CLIENT ==========

const apiClient = axios.create({
  // Usar ruta relativa para que el proxy de Vite funcione
  // En desarrollo: /api/v1 → Vite proxy → http://back:3000/api/v1
  // En producción: /api/v1 → Nginx/Backend directo
  baseURL: '/api/v1',
  timeout: 30000, // 30 segundos - Ene 2026
  headers: {
    'Content-Type': 'application/json',
  },
  // Ene 2026: Enviar cookies automáticamente (refreshToken httpOnly)
  withCredentials: true,
});

// ========== RETRY CON EXPONENTIAL BACKOFF (Ene 2026) ==========
// Reintentar automáticamente en errores de red o servidor (5xx)
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay, // 1s, 2s, 4s
  retryCondition: (error) => {
    // Reintentar en errores de red o errores 5xx del servidor
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status !== undefined && error.response.status >= 500 && error.response.status < 600)
    );
  },
  onRetry: () => {
    // Retry silencioso - el comportamiento está documentado en axiosRetry config
  },
});

// ========== INTERCEPTOR DE REQUEST ==========
// Agregar token a todas las peticiones
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig;

    // Si el error es 401 y no hemos intentado refresh aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si ya hay un refresh en progreso, agregar a la cola
      if (getIsRefreshing()) {
        return new Promise((resolve, reject) => {
          subscribeToRefresh((refreshError: Error | null, newToken: string | null) => {
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
        // Hacer refresh con body vacío
        // La cookie httpOnly (refreshToken) se envía automáticamente
        const response = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {}, // Body vacío - el refreshToken viene en la cookie
          { withCredentials: true, timeout: 10000 } // 10s para refresh
        );

        const { accessToken: newAccessToken } = response.data.data;

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
        console.error('Error al refrescar token:', refreshError);
        notifyRefreshSubscribers(refreshError as Error, null);
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

// ========== PUBLIC API CLIENT (Ene 2026) ==========
// Cliente para rutas públicas sin autenticación (eventos-digitales, website, etc.)
const publicApiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 30000, // 30 segundos - Ene 2026
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // No enviar cookies de sesión
});

// Retry básico para public client
axiosRetry(publicApiClient, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
});

export default apiClient;
export { apiClient as api, publicApiClient };
export type { AxiosResponse };
