/**
 * Constantes del Módulo de Vacaciones
 * Plan de Empleados Competitivo - Fase 3
 * Enero 2026
 */

// Estados de solicitud de vacaciones
const ESTADOS_SOLICITUD = {
  PENDIENTE: 'pendiente',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
  CANCELADA: 'cancelada',
};

const ESTADOS_SOLICITUD_LABELS = {
  pendiente: 'Pendiente de aprobación',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

// Tipos de aprobador
const TIPOS_APROBADOR = {
  SUPERVISOR: 'supervisor',
  RRHH: 'rrhh',
  ROL_ESPECIFICO: 'rol_especifico',
};

const TIPOS_APROBADOR_LABELS = {
  supervisor: 'Supervisor directo',
  rrhh: 'Responsable de RRHH',
  rol_especifico: 'Rol específico',
};

// Turnos para medio día
const TURNOS_MEDIO_DIA = {
  MANANA: 'manana',
  TARDE: 'tarde',
};

const TURNOS_MEDIO_DIA_LABELS = {
  manana: 'Mañana (hasta 14:00)',
  tarde: 'Tarde (desde 14:00)',
};

// Valores por defecto de política
const DEFAULTS_POLITICA = {
  dias_por_anio: 15,
  dias_maximos_acumulables: 30,
  dias_anticipacion_minimos: 7,
  requiere_aprobacion: true,
  aprobador_tipo: 'supervisor',
  permite_medios_dias: false,
  usar_niveles_antiguedad: true,
  ignorar_festivos: true,
  permite_saldo_negativo: false,
  dias_maximos_consecutivos: 15,
  mes_inicio_periodo: 1,
  dia_inicio_periodo: 1,
};

// Niveles LFT México 2022 (datos de referencia)
const NIVELES_LFT_MEXICO = [
  { nombre: '1er año de servicio', anios_minimos: 0, anios_maximos: 1, dias_anuales: 12 },
  { nombre: '2do año de servicio', anios_minimos: 1, anios_maximos: 2, dias_anuales: 14 },
  { nombre: '3er año de servicio', anios_minimos: 2, anios_maximos: 3, dias_anuales: 16 },
  { nombre: '4to año de servicio', anios_minimos: 3, anios_maximos: 4, dias_anuales: 18 },
  { nombre: '5to año de servicio', anios_minimos: 4, anios_maximos: 5, dias_anuales: 20 },
  { nombre: '6 a 10 años de servicio', anios_minimos: 5, anios_maximos: 10, dias_anuales: 22 },
  { nombre: '11 a 15 años de servicio', anios_minimos: 10, anios_maximos: 15, dias_anuales: 24 },
  { nombre: '16 a 20 años de servicio', anios_minimos: 15, anios_maximos: 20, dias_anuales: 26 },
  { nombre: '21 a 25 años de servicio', anios_minimos: 20, anios_maximos: 25, dias_anuales: 28 },
  { nombre: '26 a 30 años de servicio', anios_minimos: 25, anios_maximos: 30, dias_anuales: 30 },
  { nombre: '31 a 35 años de servicio', anios_minimos: 30, anios_maximos: 35, dias_anuales: 32 },
  { nombre: '36+ años de servicio', anios_minimos: 35, anios_maximos: null, dias_anuales: 34 },
];

// Mensajes de error
const ERRORES_VACACIONES = {
  SALDO_INSUFICIENTE: 'No hay suficiente saldo de vacaciones disponible',
  ANTICIPACION_INSUFICIENTE: 'La solicitud debe hacerse con al menos {dias} días de anticipación',
  SOLICITUD_NO_ENCONTRADA: 'Solicitud de vacaciones no encontrada',
  SOLICITUD_YA_PROCESADA: 'Esta solicitud ya fue procesada',
  POLITICA_NO_ENCONTRADA: 'No hay política de vacaciones configurada para esta organización',
  SALDO_NO_ENCONTRADO: 'No hay saldo de vacaciones para este profesional en el año indicado',
  FECHAS_INVALIDAS: 'Las fechas de la solicitud son inválidas',
  FECHA_PASADA: 'No se pueden solicitar vacaciones para fechas pasadas',
  SOLAPAMIENTO: 'Ya existe una solicitud de vacaciones que se solapa con estas fechas',
  SIN_PERMISO_APROBAR: 'No tienes permiso para aprobar esta solicitud',
  DIAS_CONSECUTIVOS_EXCEDIDOS: 'Se excede el máximo de {max} días consecutivos permitidos',
};

// Campos seleccionables en queries
const CAMPOS_SOLICITUD = [
  'id',
  'codigo',
  'profesional_id',
  'fecha_inicio',
  'fecha_fin',
  'dias_solicitados',
  'es_medio_dia',
  'turno_medio_dia',
  'estado',
  'aprobador_id',
  'fecha_decision',
  'motivo_rechazo',
  'bloqueo_id',
  'motivo_solicitud',
  'notas_internas',
  'creado_en',
  'creado_por',
];

const CAMPOS_SALDO = [
  'id',
  'profesional_id',
  'anio',
  'dias_correspondientes',
  'dias_acumulados_anterior',
  'dias_usados',
  'dias_ajuste_manual',
  'dias_solicitados_pendientes',
  'dias_pendientes',
  'notas_ajuste',
];

const CAMPOS_POLITICA = [
  'id',
  'dias_por_anio',
  'dias_maximos_acumulables',
  'dias_anticipacion_minimos',
  'requiere_aprobacion',
  'aprobador_tipo',
  'aprobador_rol_id',
  'permite_medios_dias',
  'usar_niveles_antiguedad',
  'ignorar_festivos',
  'permite_saldo_negativo',
  'dias_maximos_consecutivos',
  'mes_inicio_periodo',
  'dia_inicio_periodo',
  'activo',
];

module.exports = {
  ESTADOS_SOLICITUD,
  ESTADOS_SOLICITUD_LABELS,
  TIPOS_APROBADOR,
  TIPOS_APROBADOR_LABELS,
  TURNOS_MEDIO_DIA,
  TURNOS_MEDIO_DIA_LABELS,
  DEFAULTS_POLITICA,
  NIVELES_LFT_MEXICO,
  ERRORES_VACACIONES,
  CAMPOS_SOLICITUD,
  CAMPOS_SALDO,
  CAMPOS_POLITICA,
};
