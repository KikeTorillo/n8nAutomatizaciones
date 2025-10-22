// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
export const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://localhost:3000/api/v1/whatsapp';

// App Configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'SaaS Agendamiento';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Feature Flags
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
export const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === 'true';

// Roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  PROPIETARIO: 'propietario',
  ADMIN: 'admin',
  USUARIO: 'usuario',
  SOLO_LECTURA: 'solo_lectura',
};

// Estados de Citas
export const ESTADOS_CITA = {
  PENDIENTE: 'pendiente',
  CONFIRMADA: 'confirmada',
  EN_CURSO: 'en_curso',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
  NO_ASISTIO: 'no_asistio',
};

// Industrias
export const INDUSTRIAS = [
  { value: 'barberia', label: 'Barbería' },
  { value: 'salon_belleza', label: 'Salón de Belleza' },
  { value: 'spa', label: 'Spa' },
  { value: 'consultorio_medico', label: 'Consultorio Médico' },
  { value: 'clinica_dental', label: 'Clínica Dental' },
  { value: 'otro', label: 'Otro' },
];

// ✅ Tipos de Profesionales - MIGRADO A SISTEMA DINÁMICO
// ================================================================
// Los tipos profesionales ahora son dinámicos y se gestionan desde la base de datos.
//
// ✅ USO CORRECTO:
//   import { useTiposProfesional } from '@/hooks/useTiposProfesional';
//   const { data: tipos } = useTiposProfesional({ activo: true });
//
// CARACTERÍSTICAS:
// - 33 tipos del sistema (no editables)
// - Tipos personalizados por organización
// - Filtrado automático por industria
// - Búsqueda y filtros avanzados
//
// 📦 Backend API: GET /api/v1/tipos-profesional
// 📖 Hook: @/hooks/useTiposProfesional
// ================================================================

// Tamaños de Negocio
export const TAMANOS_NEGOCIO = [
  { value: 'independiente', label: 'Independiente' },
  { value: 'pequeno', label: 'Pequeño (2-5 empleados)' },
  { value: 'mediano', label: 'Mediano (6-20 empleados)' },
  { value: 'grande', label: 'Grande (20+ empleados)' },
];

// Regex Patterns
export const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^[1-9]\d{9}$/,  // Teléfono mexicano: exactamente 10 dígitos
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
};
