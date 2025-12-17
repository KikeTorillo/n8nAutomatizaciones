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

  /**
   * POLÍTICA DE CONTRASEÑAS DEL SISTEMA
   *
   * Requisitos:
   * - Mínimo 8 caracteres
   * - Al menos 1 mayúscula (A-Z)
   * - Al menos 1 minúscula (a-z)
   * - Al menos 1 número (0-9)
   * - Caracteres especiales: OPCIONALES
   *
   * Permite CUALQUIER carácter (incluyendo internacionales: ñ, é, ü, etc.)
   * para soportar usuarios con teclados no-ingleses.
   *
   * Homologado con backend: auth.schemas.js (PASSWORD_STRONG_PATTERN)
   *
   * Aplicado en:
   * - Onboarding (creación de cuenta)
   * - Reset password
   * - Cambio de contraseña
   *
   * Ejemplos válidos:
   * - Password123 ✅
   * - MiClave2024 ✅
   * - Contraseña1 ✅ (con ñ)
   * - Sécurité9 ✅ (con acentos)
   */
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
};
