import {
  calcularDuracionMinutos,
  esMismoDia,
  estaEnRangoHorario,
  esAnterior,
  esPosterior,
} from './dateHelpers';

/**
 * Validadores de negocio para el módulo de citas
 */

// ==================== COLORES POR ESTADO ====================

/**
 * Obtiene las clases CSS para el color del badge según el estado de la cita
 * @param {string} estado - Estado de la cita (pendiente, confirmada, en_curso, completada, cancelada, no_show)
 * @returns {string} Clases de Tailwind CSS
 *
 * @example
 * obtenerColorEstado('confirmada') // 'bg-green-100 text-green-800'
 */
export function obtenerColorEstado(estado) {
  const colores = {
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmada: 'bg-green-100 text-green-800 border-green-200',
    en_curso: 'bg-primary-100 text-primary-800 border-primary-200',
    completada: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelada: 'bg-red-100 text-red-800 border-red-200',
    no_show: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Obtiene el label legible del estado
 * @param {string} estado
 * @returns {string} Label formateado
 *
 * @example
 * obtenerLabelEstado('en_curso') // 'En curso'
 */
export function obtenerLabelEstado(estado) {
  const labels = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    en_curso: 'En curso',
    completada: 'Completada',
    cancelada: 'Cancelada',
    no_show: 'No Show',
  };

  return labels[estado] || estado;
}

/**
 * Obtiene el ícono correspondiente al estado
 * @param {string} estado
 * @returns {string} Nombre del ícono de lucide-react
 *
 * @example
 * obtenerIconoEstado('confirmada') // 'CheckCircle'
 */
export function obtenerIconoEstado(estado) {
  const iconos = {
    pendiente: 'Clock',
    confirmada: 'CheckCircle',
    en_curso: 'PlayCircle',
    completada: 'CheckCircle2',
    cancelada: 'XCircle',
    no_show: 'AlertCircle',
  };

  return iconos[estado] || 'Circle';
}

// ==================== VALIDACIÓN DE SOLAPAMIENTO ====================

/**
 * Verifica si una cita se solapa con otras citas existentes
 * @param {Object} nuevaCita - { fecha_cita, hora_inicio, hora_fin, profesional_id }
 * @param {Array} citasExistentes - Array de citas del profesional
 * @param {number} citaIdExcluir - ID de la cita a excluir (útil para edición)
 * @returns {Object} { solapa: boolean, citasSolapadas: Array }
 *
 * @example
 * validarSolapamiento(
 *   { fecha_cita: '2025-10-17', hora_inicio: '10:00', hora_fin: '10:30', profesional_id: 1 },
 *   citasExistentes,
 *   null
 * )
 * // { solapa: false, citasSolapadas: [] }
 */
export function validarSolapamiento(nuevaCita, citasExistentes = [], citaIdExcluir = null) {
  if (!nuevaCita?.fecha_cita || !nuevaCita?.hora_inicio || !nuevaCita?.hora_fin) {
    return { solapa: false, citasSolapadas: [] };
  }

  const citasSolapadas = citasExistentes.filter((cita) => {
    // Excluir la cita actual si se está editando
    if (citaIdExcluir && cita.id === citaIdExcluir) {
      return false;
    }

    // Excluir citas canceladas o no_show
    if (cita.estado === 'cancelada' || cita.estado === 'no_show') {
      return false;
    }

    // Solo verificar citas del mismo profesional
    if (cita.profesional_id !== nuevaCita.profesional_id) {
      return false;
    }

    // Solo verificar citas del mismo día
    if (!esMismoDia(cita.fecha_cita, nuevaCita.fecha_cita)) {
      return false;
    }

    // Verificar solapamiento de horarios
    // Solapa si:
    // - Nueva inicia antes de que termine la existente Y
    // - Nueva termina después de que inicie la existente
    const nuevaInicio = nuevaCita.hora_inicio;
    const nuevaFin = nuevaCita.hora_fin;
    const existenteInicio = cita.hora_inicio;
    const existenteFin = cita.hora_fin;

    // Convertir a minutos desde medianoche para comparar
    const toMinutes = (hora) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const nI = toMinutes(nuevaInicio);
    const nF = toMinutes(nuevaFin);
    const eI = toMinutes(existenteInicio);
    const eF = toMinutes(existenteFin);

    // Hay solapamiento si los rangos se intersectan
    return nI < eF && nF > eI;
  });

  return {
    solapa: citasSolapadas.length > 0,
    citasSolapadas,
  };
}

// ==================== VALIDACIÓN DE DISPONIBILIDAD ====================

/**
 * Verifica si un profesional está disponible en un horario
 * Nota: Esta validación es básica en frontend. El backend hace la validación definitiva.
 * @param {Object} params - { profesional, fecha, hora_inicio, hora_fin }
 * @param {Array} horariosProfesional - Horarios configurados del profesional
 * @returns {Object} { disponible: boolean, motivo: string }
 *
 * @example
 * validarDisponibilidadProfesional(
 *   { profesional: prof, fecha: '2025-10-17', hora_inicio: '10:00', hora_fin: '10:30' },
 *   horariosProfesional
 * )
 * // { disponible: true, motivo: '' }
 */
export function validarDisponibilidadProfesional(params, horariosProfesional = []) {
  if (!params?.fecha || !params?.hora_inicio || !params?.hora_fin) {
    return { disponible: false, motivo: 'Datos incompletos' };
  }

  // Si no hay horarios configurados, permitir (validación final en backend)
  if (!horariosProfesional || horariosProfesional.length === 0) {
    return { disponible: true, motivo: '' };
  }

  // Obtener día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
  const fecha = new Date(params.fecha);
  const diaSemana = fecha.getDay();

  // Buscar horarios para ese día
  const horariosDelDia = horariosProfesional.filter((h) => h.dia_semana === diaSemana && h.activo);

  if (horariosDelDia.length === 0) {
    return {
      disponible: false,
      motivo: 'Profesional no tiene horario configurado para este día',
    };
  }

  // Verificar si la hora solicitada está dentro de algún horario
  const horaInicio = params.hora_inicio;
  const horaFin = params.hora_fin;

  const dentroDeHorario = horariosDelDia.some((horario) => {
    return (
      estaEnRangoHorario(horaInicio, horario.hora_inicio, horario.hora_fin) &&
      estaEnRangoHorario(horaFin, horario.hora_inicio, horario.hora_fin)
    );
  });

  if (!dentroDeHorario) {
    return {
      disponible: false,
      motivo: 'Fuera del horario de atención del profesional',
    };
  }

  return { disponible: true, motivo: '' };
}

// ==================== VALIDACIÓN DE TRANSICIONES DE ESTADO ====================

/**
 * Verifica si una transición de estado es válida
 * @param {string} estadoActual
 * @param {string} nuevoEstado
 * @returns {Object} { valida: boolean, motivo: string }
 *
 * @example
 * validarTransicionEstado('pendiente', 'confirmada') // { valida: true, motivo: '' }
 * validarTransicionEstado('completada', 'en_curso') // { valida: false, motivo: '...' }
 */
export function validarTransicionEstado(estadoActual, nuevoEstado) {
  // Transiciones válidas
  const transicionesValidas = {
    pendiente: ['confirmada', 'cancelada', 'en_curso'],
    confirmada: ['en_curso', 'cancelada', 'no_show'],
    en_curso: ['completada', 'cancelada'],
    completada: [], // Estado final, no puede cambiar
    cancelada: [], // Estado final, no puede cambiar
    no_show: [], // Estado final, no puede cambiar
  };

  if (!estadoActual || !nuevoEstado) {
    return { valida: false, motivo: 'Estados inválidos' };
  }

  if (estadoActual === nuevoEstado) {
    return { valida: false, motivo: 'La cita ya está en ese estado' };
  }

  const permitidos = transicionesValidas[estadoActual] || [];

  if (!permitidos.includes(nuevoEstado)) {
    return {
      valida: false,
      motivo: `No se puede cambiar de ${obtenerLabelEstado(estadoActual)} a ${obtenerLabelEstado(nuevoEstado)}`,
    };
  }

  return { valida: true, motivo: '' };
}

/**
 * Obtiene las acciones disponibles para una cita según su estado
 * @param {string} estado
 * @returns {Array} Array de acciones disponibles
 *
 * @example
 * obtenerAccionesDisponibles('pendiente')
 * // ['confirmar', 'cancelar', 'editar', 'eliminar']
 */
export function obtenerAccionesDisponibles(estado) {
  const acciones = {
    pendiente: [
      { accion: 'confirmar', label: 'Confirmar', icono: 'CheckCircle', color: 'green' },
      { accion: 'iniciar', label: 'Iniciar', icono: 'PlayCircle', color: 'primary' },
      { accion: 'editar', label: 'Editar', icono: 'Edit', color: 'gray' },
      { accion: 'cancelar', label: 'Cancelar', icono: 'XCircle', color: 'red' },
    ],
    confirmada: [
      { accion: 'iniciar', label: 'Iniciar', icono: 'PlayCircle', color: 'primary' },
      { accion: 'editar', label: 'Editar', icono: 'Edit', color: 'gray' },
      { accion: 'no_show', label: 'No Show', icono: 'AlertCircle', color: 'orange' },
      { accion: 'cancelar', label: 'Cancelar', icono: 'XCircle', color: 'red' },
    ],
    en_curso: [
      { accion: 'completar', label: 'Completar', icono: 'CheckCircle2', color: 'green' },
      { accion: 'cancelar', label: 'Cancelar', icono: 'XCircle', color: 'red' },
    ],
    completada: [{ accion: 'ver', label: 'Ver Detalles', icono: 'Eye', color: 'gray' }],
    cancelada: [{ accion: 'ver', label: 'Ver Detalles', icono: 'Eye', color: 'gray' }],
    no_show: [{ accion: 'ver', label: 'Ver Detalles', icono: 'Eye', color: 'gray' }],
  };

  return acciones[estado] || [];
}

// ==================== VALIDACIÓN DE DATOS DE CITA ====================

/**
 * Valida los datos básicos de una cita antes de enviarlos al backend
 * @param {Object} citaData - Datos de la cita
 * @returns {Object} { valido: boolean, errores: Array }
 *
 * @example
 * validarDatosCita({ cliente_id: 1, profesional_id: 2, ... })
 * // { valido: true, errores: [] }
 */
export function validarDatosCita(citaData) {
  const errores = [];

  // Campos requeridos
  if (!citaData.cliente_id) {
    errores.push({ campo: 'cliente_id', mensaje: 'Debe seleccionar un cliente' });
  }

  if (!citaData.profesional_id) {
    errores.push({ campo: 'profesional_id', mensaje: 'Debe seleccionar un profesional' });
  }

  if (!citaData.servicio_id) {
    errores.push({ campo: 'servicio_id', mensaje: 'Debe seleccionar un servicio' });
  }

  if (!citaData.fecha_cita) {
    errores.push({ campo: 'fecha_cita', mensaje: 'Debe seleccionar una fecha' });
  }

  if (!citaData.hora_inicio) {
    errores.push({ campo: 'hora_inicio', mensaje: 'Debe seleccionar una hora de inicio' });
  }

  if (!citaData.hora_fin) {
    errores.push({ campo: 'hora_fin', mensaje: 'Debe especificar una hora de fin' });
  }

  // Validaciones de lógica de negocio
  if (citaData.hora_inicio && citaData.hora_fin) {
    const duracion = calcularDuracionMinutos(citaData.hora_inicio, citaData.hora_fin);

    if (duracion <= 0) {
      errores.push({
        campo: 'hora_fin',
        mensaje: 'La hora de fin debe ser posterior a la hora de inicio',
      });
    }

    if (duracion > 480) {
      // Más de 8 horas
      errores.push({
        campo: 'hora_fin',
        mensaje: 'La duración de la cita no puede ser mayor a 8 horas',
      });
    }

    if (duracion < 10) {
      // Menos de 10 minutos
      errores.push({
        campo: 'hora_fin',
        mensaje: 'La duración mínima de una cita es 10 minutos',
      });
    }
  }

  // Validar precio
  if (citaData.precio_servicio !== undefined && citaData.precio_servicio < 0) {
    errores.push({ campo: 'precio_servicio', mensaje: 'El precio no puede ser negativo' });
  }

  if (citaData.descuento !== undefined && citaData.descuento < 0) {
    errores.push({ campo: 'descuento', mensaje: 'El descuento no puede ser negativo' });
  }

  if (citaData.descuento !== undefined && citaData.precio_servicio !== undefined) {
    if (citaData.descuento > citaData.precio_servicio) {
      errores.push({
        campo: 'descuento',
        mensaje: 'El descuento no puede ser mayor al precio del servicio',
      });
    }
  }

  // Validar fecha no sea en el pasado (solo para creación)
  if (citaData.fecha_cita && !citaData.id) {
    const fecha = new Date(citaData.fecha_cita);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (esAnterior(fecha, hoy)) {
      errores.push({
        campo: 'fecha_cita',
        mensaje: 'No se pueden crear citas en fechas pasadas',
      });
    }
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

// ==================== UTILIDADES PARA UI ====================

/**
 * Calcula el tiempo restante hasta una cita
 * @param {string} fechaCita - Formato ISO 'YYYY-MM-DD'
 * @param {string} horaInicio - Formato 'HH:mm:ss'
 * @returns {Object} { dias: number, horas: number, minutos: number, mensaje: string }
 *
 * @example
 * calcularTiempoRestante('2025-10-17', '14:30:00')
 * // { dias: 2, horas: 5, minutos: 30, mensaje: 'En 2 días, 5 horas' }
 */
export function calcularTiempoRestante(fechaCita, horaInicio) {
  if (!fechaCita || !horaInicio) {
    return { dias: 0, horas: 0, minutos: 0, mensaje: '' };
  }

  try {
    const ahora = new Date();
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const fecha = new Date(fechaCita);
    fecha.setHours(horas, minutos, 0);

    const diff = fecha - ahora;

    if (diff < 0) {
      return { dias: 0, horas: 0, minutos: 0, mensaje: 'Cita pasada' };
    }

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horasRestantes = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutosRestantes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let mensaje = '';
    if (dias > 0) {
      mensaje = `En ${dias} día${dias > 1 ? 's' : ''}`;
      if (horasRestantes > 0) {
        mensaje += `, ${horasRestantes} hora${horasRestantes > 1 ? 's' : ''}`;
      }
    } else if (horasRestantes > 0) {
      mensaje = `En ${horasRestantes} hora${horasRestantes > 1 ? 's' : ''}`;
      if (minutosRestantes > 0) {
        mensaje += `, ${minutosRestantes} minuto${minutosRestantes > 1 ? 's' : ''}`;
      }
    } else {
      mensaje = `En ${minutosRestantes} minuto${minutosRestantes > 1 ? 's' : ''}`;
    }

    return {
      dias,
      horas: horasRestantes,
      minutos: minutosRestantes,
      mensaje,
    };
  } catch (error) {
    console.error('Error al calcular tiempo restante:', error);
    return { dias: 0, horas: 0, minutos: 0, mensaje: '' };
  }
}

/**
 * Determina si se debe mostrar alerta de recordatorio
 * @param {string} fechaCita
 * @param {string} horaInicio
 * @param {number} horasAntes - Horas antes para mostrar alerta (default: 24)
 * @returns {boolean}
 *
 * @example
 * deberMostrarAlerta('2025-10-17', '14:30:00', 24) // true si falta menos de 24h
 */
export function deberMostrarAlerta(fechaCita, horaInicio, horasAntes = 24) {
  const { dias, horas } = calcularTiempoRestante(fechaCita, horaInicio);
  const totalHoras = dias * 24 + horas;

  return totalHoras > 0 && totalHoras <= horasAntes;
}

/**
 * Filtra citas según criterios múltiples
 * @param {Array} citas - Array de citas
 * @param {Object} filtros - { estado, profesional_id, servicio_id, fecha_desde, fecha_hasta, busqueda }
 * @returns {Array} Citas filtradas
 *
 * @example
 * filtrarCitas(todasLasCitas, { estado: 'pendiente', profesional_id: 1 })
 */
export function filtrarCitas(citas = [], filtros = {}) {
  let resultado = [...citas];

  // Filtro por estado
  if (filtros.estado) {
    resultado = resultado.filter((cita) => cita.estado === filtros.estado);
  }

  // Filtro por profesional
  if (filtros.profesional_id) {
    resultado = resultado.filter((cita) => cita.profesional_id === filtros.profesional_id);
  }

  // Filtro por servicio
  if (filtros.servicio_id) {
    resultado = resultado.filter((cita) => cita.servicio_id === filtros.servicio_id);
  }

  // Filtro por rango de fechas
  if (filtros.fecha_desde) {
    resultado = resultado.filter(
      (cita) => !esAnterior(cita.fecha_cita, filtros.fecha_desde)
    );
  }

  if (filtros.fecha_hasta) {
    resultado = resultado.filter(
      (cita) => !esPosterior(cita.fecha_cita, filtros.fecha_hasta)
    );
  }

  // Filtro por búsqueda (nombre cliente, código cita)
  if (filtros.busqueda) {
    const termino = filtros.busqueda.toLowerCase();
    resultado = resultado.filter(
      (cita) =>
        cita.cliente_nombre?.toLowerCase().includes(termino) ||
        cita.codigo_cita?.toLowerCase().includes(termino) ||
        cita.servicio_nombre?.toLowerCase().includes(termino)
    );
  }

  return resultado;
}

export default {
  // Colores y labels
  obtenerColorEstado,
  obtenerLabelEstado,
  obtenerIconoEstado,

  // Validaciones de solapamiento
  validarSolapamiento,

  // Validaciones de disponibilidad
  validarDisponibilidadProfesional,

  // Validaciones de estados
  validarTransicionEstado,
  obtenerAccionesDisponibles,

  // Validaciones de datos
  validarDatosCita,

  // Utilidades para UI
  calcularTiempoRestante,
  deberMostrarAlerta,
  filtrarCitas,
};
