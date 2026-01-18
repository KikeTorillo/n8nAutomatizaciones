import { useState, useCallback } from 'react';

/**
 * Constantes para recurrencia
 */
export const FRECUENCIAS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal (cada 2 semanas)' },
  { value: 'mensual', label: 'Mensual' },
];

export const DIAS_SEMANA = [
  { value: '0', label: 'Dom' },
  { value: '1', label: 'Lun' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Mié' },
  { value: '4', label: 'Jue' },
  { value: '5', label: 'Vie' },
  { value: '6', label: 'Sáb' },
];

export const TERMINA_EN = [
  { value: 'cantidad', label: 'Después de N citas' },
  { value: 'fecha', label: 'En una fecha específica' },
];

/**
 * Hook para manejar el estado de recurrencia de citas
 * Extrae los 8 estados de recurrencia del CitaFormDrawer
 */
export function useRecurrenceState() {
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [frecuencia, setFrecuencia] = useState('semanal');
  const [diasSemana, setDiasSemana] = useState([]);
  const [intervalo, setIntervalo] = useState(1);
  const [terminaEn, setTerminaEn] = useState('cantidad');
  const [cantidadCitas, setCantidadCitas] = useState(12);
  const [fechaFinRecurrencia, setFechaFinRecurrencia] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);

  // Toggle de día de semana
  const toggleDiaSemana = useCallback((diaValue) => {
    setDiasSemana((prev) =>
      prev.includes(diaValue)
        ? prev.filter((d) => d !== diaValue)
        : [...prev, diaValue]
    );
  }, []);

  // Toggle de recurrencia
  const toggleRecurrencia = useCallback((enabled) => {
    setEsRecurrente(enabled);
    if (!enabled) {
      setPreviewData(null);
      setMostrarPreview(false);
    }
  }, []);

  // Reset de todos los estados
  const resetRecurrencia = useCallback(() => {
    setEsRecurrente(false);
    setFrecuencia('semanal');
    setDiasSemana([]);
    setIntervalo(1);
    setTerminaEn('cantidad');
    setCantidadCitas(12);
    setFechaFinRecurrencia('');
    setPreviewData(null);
    setMostrarPreview(false);
  }, []);

  // Construir objeto de patrón de recurrencia para el backend
  const buildPatronRecurrencia = useCallback(() => {
    return {
      frecuencia,
      dias_semana: frecuencia !== 'mensual' && diasSemana.length > 0
        ? diasSemana.map(Number)
        : undefined,
      intervalo,
      termina_en: terminaEn,
      ...(terminaEn === 'cantidad'
        ? { cantidad_citas: cantidadCitas }
        : { fecha_fin: fechaFinRecurrencia }
      ),
    };
  }, [frecuencia, diasSemana, intervalo, terminaEn, cantidadCitas, fechaFinRecurrencia]);

  return {
    // Estados
    esRecurrente,
    frecuencia,
    diasSemana,
    intervalo,
    terminaEn,
    cantidadCitas,
    fechaFinRecurrencia,
    previewData,
    mostrarPreview,

    // Setters
    setEsRecurrente,
    setFrecuencia,
    setDiasSemana,
    setIntervalo,
    setTerminaEn,
    setCantidadCitas,
    setFechaFinRecurrencia,
    setPreviewData,
    setMostrarPreview,

    // Helpers
    toggleDiaSemana,
    toggleRecurrencia,
    resetRecurrencia,
    buildPatronRecurrencia,
  };
}

export default useRecurrenceState;
