import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, User, Briefcase, Package, Clock, DollarSign, Repeat, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import MultiSelect from '@/components/ui/MultiSelect';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/forms/FormField';
import { useCrearCita, useActualizarCita, useCrearCitaRecurrente, usePreviewRecurrencia } from '@/hooks/useCitas';
import { useClientes } from '@/hooks/useClientes';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useServicios } from '@/hooks/useServicios';
import { serviciosApi, configuracionAgendamientoApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/useToast';
import { useQuery } from '@tanstack/react-query';
import { aFormatoISO } from '@/utils/dateHelpers';

// Constantes para recurrencia
const FRECUENCIAS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal (cada 2 semanas)' },
  { value: 'mensual', label: 'Mensual' },
];

const DIAS_SEMANA = [
  { value: '0', label: 'Dom' },
  { value: '1', label: 'Lun' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Mié' },
  { value: '4', label: 'Jue' },
  { value: '5', label: 'Vie' },
  { value: '6', label: 'Sáb' },
];

const TERMINA_EN = [
  { value: 'cantidad', label: 'Después de N citas' },
  { value: 'fecha', label: 'En una fecha específica' },
];

/**
 * Schema de validación Zod para CREAR cita
 * NOTA: profesional_id es opcional cuando Round-Robin está habilitado
 */
const citaCreateSchema = z
  .object({
    cliente_id: z.string().min(1, 'Debes seleccionar un cliente'),
    profesional_id: z.string().optional(), // Opcional: si vacío, usa Round-Robin
    servicios_ids: z.array(z.string()).min(1, 'Debes seleccionar al menos un servicio').max(10, 'Máximo 10 servicios por cita'),
    fecha_cita: z.string().min(1, 'La fecha es requerida'),
    hora_inicio: z
      .string()
      .min(1, 'La hora de inicio es requerida')
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
    duracion_minutos: z
      .coerce.number()
      .min(10, 'Duración mínima: 10 minutos')
      .max(480, 'Duración máxima: 8 horas'),
    precio_servicio: z.coerce.number().min(0, 'El precio no puede ser negativo'),
    descuento: z.coerce.number().min(0, 'El descuento no puede ser negativo').default(0),
    notas_cliente: z.string().max(500, 'Máximo 500 caracteres').optional(),
    notas_internas: z.string().max(500, 'Máximo 500 caracteres').optional(),
  })
  .refine(
    (data) => {
      // Validar que descuento no sea mayor al precio
      return data.descuento <= data.precio_servicio;
    },
    {
      message: 'El descuento no puede ser mayor al precio del servicio',
      path: ['descuento'],
    }
  )
  .refine(
    (data) => {
      // Validar que la fecha no sea en el pasado
      // ✅ FIX: Usar fecha LOCAL en vez de UTC
      const fechaSeleccionada = data.fecha_cita; // Ya viene en formato YYYY-MM-DD del input
      const hoyStr = aFormatoISO(new Date()); // Convertir a YYYY-MM-DD (local, no UTC)
      return fechaSeleccionada >= hoyStr;
    },
    {
      message: 'La fecha no puede ser en el pasado',
      path: ['fecha_cita'],
    }
  )
  .refine(
    (data) => {
      // Validar que la cita no cruce medianoche
      if (!data.hora_inicio || !data.duracion_minutos) return true;
      const [horas, minutos] = data.hora_inicio.split(':').map(Number);
      const minutosTotal = horas * 60 + minutos + data.duracion_minutos;
      return minutosTotal <= 24 * 60; // No debe exceder las 24:00
    },
    {
      message: 'La cita no puede terminar después de las 23:59',
      path: ['duracion_minutos'],
    }
  );

/**
 * Schema de validación Zod para EDITAR cita
 */
const citaEditSchema = z
  .object({
    cliente_id: z.string().optional(),
    profesional_id: z.string().optional(),
    servicios_ids: z.array(z.string()).min(1, 'Debes seleccionar al menos un servicio').max(10, 'Máximo 10 servicios por cita').optional(),
    fecha_cita: z.string().optional(),
    hora_inicio: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)')
      .optional(),
    duracion_minutos: z
      .coerce.number()
      .min(10, 'Duración mínima: 10 minutos')
      .max(480, 'Duración máxima: 8 horas')
      .optional(),
    precio_servicio: z.coerce.number().min(0, 'El precio no puede ser negativo').optional(),
    descuento: z.coerce.number().min(0, 'El descuento no puede ser negativo').optional(),
    notas_cliente: z.string().max(500, 'Máximo 500 caracteres').optional(),
    notas_internas: z.string().max(500, 'Máximo 500 caracteres').optional(),
  })
  .refine(
    (data) => {
      return Object.keys(data).some((key) => data[key] !== undefined && data[key] !== '');
    },
    {
      message: 'Debes modificar al menos un campo',
    }
  )
  .refine(
    (data) => {
      // Validar que la cita no cruce medianoche (si se modifican hora o duración)
      if (!data.hora_inicio || !data.duracion_minutos) return true;
      const [horas, minutos] = data.hora_inicio.split(':').map(Number);
      const minutosTotal = horas * 60 + minutos + data.duracion_minutos;
      return minutosTotal <= 24 * 60;
    },
    {
      message: 'La cita no puede terminar después de las 23:59',
      path: ['duracion_minutos'],
    }
  );

/**
 * Modal de formulario para crear y editar citas
 * @param {string} mode - 'create' o 'edit'
 * @param {object|null} cita - Datos de la cita a editar (solo en modo edit)
 * @param {string|null} fechaPreseleccionada - Fecha preseleccionada desde el calendario (formato ISO YYYY-MM-DD)
 */
function CitaFormModal({ isOpen, onClose, mode = 'create', cita = null, fechaPreseleccionada = null, clientePreseleccionado = null }) {
  const toast = useToast();
  const isEditMode = mode === 'edit';

  // Estados locales
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [precioCalculado, setPrecioCalculado] = useState(0);

  // Estados para citas recurrentes
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [frecuencia, setFrecuencia] = useState('semanal');
  const [diasSemana, setDiasSemana] = useState([]);
  const [intervalo, setIntervalo] = useState(1);
  const [terminaEn, setTerminaEn] = useState('cantidad');
  const [cantidadCitas, setCantidadCitas] = useState(12);
  const [fechaFinRecurrencia, setFechaFinRecurrencia] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);

  // Fetch data
  const { data: clientesData } = useClientes({ activo: true });
  const { data: profesionalesData } = useProfesionales({ activo: true });
  const profesionales = profesionalesData?.profesionales || [];
  const { data: serviciosData } = useServicios({ activo: true });
  const servicios = serviciosData?.servicios || [];

  // Fetch configuración Round-Robin
  const { data: configAgendamiento } = useQuery({
    queryKey: ['configuracion-agendamiento'],
    queryFn: async () => {
      const response = await configuracionAgendamientoApi.obtener();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  const roundRobinHabilitado = configAgendamiento?.round_robin_habilitado || false;

  // Hooks de mutación
  const crearMutation = useCrearCita();
  const actualizarMutation = useActualizarCita();
  const crearRecurrenteMutation = useCrearCitaRecurrente();
  const previewMutation = usePreviewRecurrencia();

  // React Hook Form con validación Zod
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditMode ? citaEditSchema : citaCreateSchema),
    mode: 'onSubmit', // Solo valida al hacer submit, no durante la escritura
    reValidateMode: 'onSubmit', // NO re-valida automáticamente después de errores
    shouldUnregister: false, // Mantiene los valores aunque se desmonte/re-monte
    defaultValues: isEditMode
      ? {}
      : {
          cliente_id: '',
          profesional_id: '',
          servicios_ids: [],
          fecha_cita: fechaPreseleccionada || '',
          hora_inicio: '',
          duracion_minutos: 30,
          precio_servicio: 0,
          descuento: 0,
          notas_cliente: '',
          notas_internas: '',
        },
  });

  // Watch fields para cálculos automáticos
  const watchProfesional = watch('profesional_id');
  const watchServicios = watch('servicios_ids');
  const watchPrecio = watch('precio_servicio');
  const watchDescuento = watch('descuento');

  // Preseleccionar cliente si viene de otra página
  useEffect(() => {
    if (isOpen && clientePreseleccionado && !isEditMode) {
      setValue('cliente_id', String(clientePreseleccionado));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clientePreseleccionado, isEditMode]); // setValue es estable

  // Cargar servicios del profesional seleccionado
  useEffect(() => {
    const cargarServiciosProfesional = async () => {
      // Si es 'auto' (Round-Robin) o vacío, no cargar servicios de un profesional específico
      if (!watchProfesional || watchProfesional === '' || watchProfesional === 'auto') {
        setServiciosDisponibles([]);
        return;
      }

      setCargandoServicios(true);
      try {
        const response = await serviciosApi.obtenerServiciosPorProfesional(
          parseInt(watchProfesional)
        );
        const serviciosProf = response.data.data || [];
        setServiciosDisponibles(serviciosProf);
      } catch (error) {
        console.error('Error al cargar servicios del profesional:', error);
        toast.error('Error al cargar servicios del profesional');
        setServiciosDisponibles([]);
      } finally {
        setCargandoServicios(false);
      }
    };

    cargarServiciosProfesional();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchProfesional]);

  // Servicios con estado de disponibilidad (filtrado dual)
  const serviciosDisponiblesConEstado = useMemo(() => {
    // Si NO hay profesional seleccionado o es 'auto' (Round-Robin): mostrar TODOS los servicios con estado
    if (!watchProfesional || watchProfesional === '' || watchProfesional === 'auto') {
      return servicios?.servicios?.map(s => ({
        ...s,
        disponible: s.total_profesionales_asignados > 0,
        razon_no_disponible: s.total_profesionales_asignados === 0
          ? 'Sin profesionales asignados' : null
      })) || [];
    }

    // Si HAY profesional seleccionado: solo mostrar servicios del profesional (todos disponibles)
    return serviciosDisponibles.map(s => ({
      ...s,
      disponible: true,
      razon_no_disponible: null
    }));
  }, [servicios, serviciosDisponibles, watchProfesional]);

  // Auto-calcular totales de servicios seleccionados
  // Nota: Solo calcular cuando el modal está abierto para evitar loops innecesarios
  useEffect(() => {
    // Guard: No ejecutar si el modal está cerrado
    if (!isOpen) return;

    if (watchServicios && watchServicios.length > 0) {
      // Calcular totales sumando TODOS los servicios seleccionados
      let duracionTotal = 0;
      let precioTotal = 0;

      // Usar serviciosDisponiblesConEstado que funciona tanto con profesional específico como con Round-Robin
      // Si está vacío, usar el catálogo general de servicios
      const listaServicios = serviciosDisponiblesConEstado.length > 0
        ? serviciosDisponiblesConEstado
        : (servicios?.servicios || []);

      watchServicios.forEach((servicioId) => {
        const servicio = listaServicios.find(
          (s) => s.id === parseInt(servicioId)
        );
        if (servicio) {
          duracionTotal += servicio.duracion_minutos || 0;
          precioTotal += parseFloat(servicio.precio) || 0;
        }
      });

      setValue('duracion_minutos', duracionTotal);
      setValue('precio_servicio', precioTotal);
    } else if (isOpen && !isEditMode) {
      // Si no hay servicios seleccionados y es modo crear, resetear a 0
      // No resetear en modo edición para preservar valores cargados
      setValue('duracion_minutos', 0);
      setValue('precio_servicio', 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, watchServicios, serviciosDisponiblesConEstado, servicios, isEditMode]); // setValue es estable

  // Calcular precio total
  useEffect(() => {
    const precio = parseFloat(watchPrecio) || 0;
    const descuento = parseFloat(watchDescuento) || 0;
    setPrecioCalculado(precio - descuento);
  }, [watchPrecio, watchDescuento]);

  // Pre-cargar datos de la cita en modo edición
  // Nota: El reset en modo creación se maneja con key prop en CitasPage
  useEffect(() => {
    if (isEditMode && cita && isOpen) {
      // Convertir servicios a array de IDs si existe el campo servicios
      let serviciosIds = [];
      if (cita.servicios && Array.isArray(cita.servicios)) {
        // Si cita tiene array de servicios (respuesta de listar con JSON_AGG)
        serviciosIds = cita.servicios.map(s => s.servicio_id?.toString());
      } else if (cita.servicio_id) {
        // Backward compatibility: si solo tiene servicio_id (respuesta antigua)
        serviciosIds = [cita.servicio_id.toString()];
      }

      // Convertir fecha ISO a formato yyyy-MM-dd para input type="date"
      let fechaFormateada = '';
      if (cita.fecha_cita) {
        // Si viene como "2025-11-24T00:00:00.000Z", extraer solo "2025-11-24"
        fechaFormateada = cita.fecha_cita.split('T')[0];
      }

      reset({
        cliente_id: cita.cliente_id?.toString() || '',
        profesional_id: cita.profesional_id?.toString() || '',
        servicios_ids: serviciosIds,
        fecha_cita: fechaFormateada,
        hora_inicio: cita.hora_inicio?.substring(0, 5) || '', // "14:30:00" → "14:30"
        duracion_minutos: cita.duracion_total_minutos || cita.duracion_minutos || 30,
        precio_servicio: cita.precio_total || cita.precio_servicio || 0,
        descuento: cita.descuento || 0,
        notas_cliente: cita.notas_cliente || '',
        notas_internas: cita.notas_internas || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, cita, isOpen]);

  // Pre-rellenar fecha cuando se abre el modal con fecha preseleccionada
  useEffect(() => {
    if (isOpen && !isEditMode && fechaPreseleccionada) {
      setValue('fecha_cita', fechaPreseleccionada);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fechaPreseleccionada, isEditMode]);

  // Limpiar formulario cuando se abre en modo creación (no cuando se cierra)
  useEffect(() => {
    if (isOpen && !isEditMode) {
      // Solo limpiar serviciosDisponibles en modo creación
      setServiciosDisponibles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditMode]);

  // Función para obtener preview de recurrencia
  const handlePreviewRecurrencia = async () => {
    const formData = watch();
    if (!formData.profesional_id || !formData.fecha_cita || !formData.hora_inicio || !formData.duracion_minutos) {
      toast.error('Completa profesional, fecha, hora y duración para ver el preview');
      return;
    }

    const patronRecurrencia = {
      frecuencia,
      dias_semana: frecuencia !== 'mensual' && diasSemana.length > 0 ? diasSemana.map(Number) : undefined,
      intervalo,
      termina_en: terminaEn,
      ...(terminaEn === 'cantidad' ? { cantidad_citas: cantidadCitas } : { fecha_fin: fechaFinRecurrencia }),
    };

    try {
      const result = await previewMutation.mutateAsync({
        fecha_inicio: formData.fecha_cita,
        hora_inicio: `${formData.hora_inicio}:00`,
        duracion_minutos: formData.duracion_minutos,
        profesional_id: parseInt(formData.profesional_id),
        patron_recurrencia: patronRecurrencia,
      });
      setPreviewData(result);
      setMostrarPreview(true);
    } catch (error) {
      toast.error('Error al generar preview: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handler de submit
  const onSubmit = async (data) => {
    try {
      // Calcular hora_fin
      const horaInicio = data.hora_inicio;
      const duracion = data.duracion_minutos;
      const [horas, minutos] = horaInicio.split(':').map(Number);
      const minutosTotal = horas * 60 + minutos + duracion;
      const horasFin = Math.floor(minutosTotal / 60) % 24;
      const minutosFin = minutosTotal % 60;
      const horaFin = `${String(horasFin).padStart(2, '0')}:${String(minutosFin).padStart(2, '0')}:00`;

      // Sanitizar datos
      // NOTA: profesional_id puede ser 'auto' o vacío para Round-Robin (auto-asignación)
      // Cuando es Round-Robin, NO enviamos profesional_id (undefined) para que el backend lo asigne
      const sanitized = {
        cliente_id: parseInt(data.cliente_id),
        // Solo incluir profesional_id si hay uno seleccionado (no es 'auto' ni vacío)
        ...(data.profesional_id && data.profesional_id !== 'auto' ? { profesional_id: parseInt(data.profesional_id) } : {}),
        servicios_ids: data.servicios_ids.map(id => parseInt(id)),
        fecha_cita: data.fecha_cita,
        hora_inicio: `${data.hora_inicio}:00`, // Agregar segundos
        hora_fin: horaFin,
        duracion_minutos: data.duracion_minutos,
        precio_servicio: data.precio_servicio,
        descuento: data.descuento || 0,
        notas_cliente: data.notas_cliente?.trim() || undefined,
        notas_internas: data.notas_internas?.trim() || undefined,
      };

      if (isEditMode) {
        // Modo edición
        await actualizarMutation.mutateAsync({ id: cita.id, ...sanitized });
        toast.success('Cita actualizada exitosamente');
      } else if (esRecurrente) {
        // Modo creación recurrente
        const patronRecurrencia = {
          frecuencia,
          dias_semana: frecuencia !== 'mensual' && diasSemana.length > 0 ? diasSemana.map(Number) : undefined,
          intervalo,
          termina_en: terminaEn,
          ...(terminaEn === 'cantidad' ? { cantidad_citas: cantidadCitas } : { fecha_fin: fechaFinRecurrencia }),
        };

        const result = await crearRecurrenteMutation.mutateAsync({
          ...sanitized,
          es_recurrente: true,
          patron_recurrencia: patronRecurrencia,
        });

        // Mostrar resumen de citas creadas
        if (result.citas_omitidas?.length > 0) {
          toast.warning(`Serie creada: ${result.citas_creadas?.length} citas. ${result.citas_omitidas?.length} fechas omitidas por conflictos.`);
        } else {
          toast.success(`Serie creada: ${result.citas_creadas?.length} citas`);
        }
      } else {
        // Modo creación simple
        await crearMutation.mutateAsync(sanitized);
        toast.success('Cita creada exitosamente');
      }

      // Resetear estados de recurrencia
      setEsRecurrente(false);
      setPreviewData(null);
      setMostrarPreview(false);

      onClose();
      reset();
    } catch (error) {
      // Extraer el mensaje de error del response del backend
      let mensajeError = '';
      const accion = isEditMode ? 'actualizar' : esRecurrente ? 'crear serie de citas' : 'crear';

      if (error.response?.data?.message) {
        // El backend envía el error en response.data.message
        mensajeError = error.response.data.message;
      } else if (error.response?.data?.error) {
        // Fallback a response.data.error
        mensajeError = error.response.data.error;
      } else if (error.message) {
        // Fallback a error.message si no hay response
        mensajeError = error.message;
      } else {
        mensajeError = `Error al ${accion}`;
      }

      // Agregar prefijo descriptivo solo si el mensaje no lo tiene ya
      const mensajeFinal = mensajeError.startsWith('No se puede') ||
                           mensajeError.startsWith('Error') ||
                           mensajeError.startsWith('Conflicto')
        ? mensajeError
        : `No se puede ${accion}: ${mensajeError}`;

      // Mostrar el error con un toast
      toast.error(mensajeFinal);
    }
  };

  // Loading state durante fetch de datos
  // Como ahora usamos el prop cita directamente (no hacemos fetch), no hay estado de loading
  const isLoadingData = false;

  // Opciones de selects
  // NOTA: No incluimos opción placeholder vacía porque el componente Select ya la agrega automáticamente
  const clientesOpciones = (clientesData?.clientes || []).map((c) => ({
    value: c.id.toString(),
    label: `${c.nombre} ${c.apellidos || ''} - ${c.telefono || 'Sin teléfono'}`,
  }));

  const profesionalesOpciones = [
    // Agregar opción de auto-asignar si Round-Robin está habilitado
    ...(roundRobinHabilitado ? [{
      value: 'auto',
      label: '🔄 Auto-asignar (Round-Robin)',
    }] : []),
    // Profesionales disponibles
    ...(profesionales || []).map((p) => ({
      value: p.id.toString(),
      label: `${p.nombre_completo} - ${p.tipo_nombre || 'Profesional'}`,
    })),
  ];

  const serviciosOpciones = serviciosDisponiblesConEstado.map((s) => ({
    value: s.id.toString(),
    label: s.disponible
      ? `${s.nombre} - $${s.precio?.toLocaleString('es-CO')} - ${s.duracion_minutos}min`
      : `${s.nombre} - $${s.precio?.toLocaleString('es-CO')} - ${s.duracion_minutos}min (${s.razon_no_disponible})`,
    disabled: !s.disponible, // Deshabilitar opciones no disponibles
  }));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Cita' : 'Nueva Cita'}
      subtitle={isEditMode ? 'Modifica los datos de la cita' : 'Completa la información de la cita'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Loading state durante fetch de datos en modo edición */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando datos de la cita...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Campos del formulario */}
            <div className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cliente {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <Controller
                    name="cliente_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={clientesOpciones}
                        placeholder="Selecciona un cliente"
                        className="flex-1"
                        disabled={isEditMode}
                      />
                    )}
                  />
                </div>
                {errors.cliente_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.cliente_id.message}</p>
                )}
              </div>

              {/* Profesional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Profesional{' '}
                  {!isEditMode && !roundRobinHabilitado && <span className="text-red-500">*</span>}
                  {roundRobinHabilitado && <span className="text-gray-400 text-xs font-normal">(opcional)</span>}
                </label>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <Controller
                    name="profesional_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={profesionalesOpciones}
                        placeholder={roundRobinHabilitado ? 'Auto-asignar (Round-Robin)' : 'Selecciona un profesional'}
                        className="flex-1"
                      />
                    )}
                  />
                </div>
                {errors.profesional_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.profesional_id.message}</p>
                )}
                {!errors.profesional_id && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {roundRobinHabilitado
                      ? '🔄 Si no seleccionas, el sistema asignará automáticamente al profesional disponible'
                      : '💡 Selecciona un profesional para ver solo sus servicios'}
                  </p>
                )}
              </div>

              {/* Servicios (MultiSelect) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Servicios {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-start gap-2">
                  <Package className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-3" />
                  <Controller
                    name="servicios_ids"
                    control={control}
                    render={({ field }) => (
                      <MultiSelect
                        {...field}
                        options={serviciosOpciones}
                        placeholder={cargandoServicios ? 'Cargando servicios...' : 'Selecciona uno o más servicios'}
                        className="flex-1"
                        disabled={((!watchProfesional || watchProfesional === '') && !roundRobinHabilitado) || cargandoServicios}
                        max={10}
                        helper={!errors.servicios_ids && watchServicios?.length > 0 && `${watchServicios.length} servicio(s) seleccionado(s)`}
                      />
                    )}
                  />
                </div>
                {(!watchProfesional || watchProfesional === '') && !roundRobinHabilitado && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Primero selecciona un profesional
                  </p>
                )}
                {((!watchProfesional || watchProfesional === '') && roundRobinHabilitado) || watchProfesional === 'auto' ? (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    🔄 Round-Robin: el sistema asignará automáticamente al profesional disponible
                  </p>
                ) : null}
                {errors.servicios_ids && (
                  <p className="mt-1 text-sm text-red-600">{errors.servicios_ids.message}</p>
                )}
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de la Cita {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    {...register('fecha_cita')}
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {errors.fecha_cita && (
                    <p className="mt-1 text-sm text-red-600">{errors.fecha_cita.message}</p>
                  )}
                </div>

                {/* Hora Inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hora de Inicio {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      {...register('hora_inicio')}
                      type="time"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  {errors.hora_inicio && (
                    <p className="mt-1 text-sm text-red-600">{errors.hora_inicio.message}</p>
                  )}
                </div>
              </div>

              {/* Duración, Precio y Descuento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Duración - Mostrar como texto si hay servicios, input si no */}
                <div>
                  {!isEditMode && watchServicios?.length > 0 ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duración
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {watch('duracion_minutos') || 0} min
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                        Calculado de servicios
                      </p>
                    </>
                  ) : (
                    <FormField
                      name="duracion_minutos"
                      control={control}
                      label="Duración (minutos)"
                      type="number"
                      placeholder="30"
                      required={!isEditMode}
                    />
                  )}
                </div>

                {/* Precio - Mostrar como texto si hay servicios, input si no */}
                <div>
                  {!isEditMode && watchServicios?.length > 0 ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Precio
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${(watch('precio_servicio') || 0).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                        Calculado de servicios
                      </p>
                    </>
                  ) : (
                    <FormField
                      name="precio_servicio"
                      control={control}
                      label="Precio del Servicio"
                      type="number"
                      placeholder="25000"
                      required={!isEditMode}
                    />
                  )}
                </div>

                {/* Descuento */}
                <FormField
                  name="descuento"
                  control={control}
                  label="Descuento"
                  type="number"
                  placeholder="0"
                />
              </div>

              {/* Precio Total Calculado */}
              <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total a Pagar:</span>
                  </div>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    ${precioCalculado.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {/* Notas del Cliente */}
              <Controller
                name="notas_cliente"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label="Notas del Cliente (Opcional)"
                    rows={3}
                    maxLength={500}
                    placeholder="Preferencias, alergias, solicitudes especiales..."
                    error={errors.notas_cliente?.message}
                  />
                )}
              />

              {/* Notas Internas */}
              <Controller
                name="notas_internas"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label="Notas Internas (Opcional)"
                    rows={2}
                    maxLength={500}
                    placeholder="Notas privadas del negocio (no visibles para el cliente)..."
                    helper="Solo visible para el personal del negocio"
                    error={errors.notas_internas?.message}
                  />
                )}
              />

              {/* Sección de Recurrencia (solo en modo creación) */}
              {!isEditMode && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  {/* Toggle de recurrencia */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cita Recurrente
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={esRecurrente}
                        onChange={(e) => {
                          setEsRecurrente(e.target.checked);
                          if (!e.target.checked) {
                            setPreviewData(null);
                            setMostrarPreview(false);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Panel de configuración de recurrencia */}
                  {esRecurrente && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
                      {/* Frecuencia */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Frecuencia
                        </label>
                        <select
                          value={frecuencia}
                          onChange={(e) => setFrecuencia(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          {FRECUENCIAS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Días de la semana (solo para semanal/quincenal) */}
                      {(frecuencia === 'semanal' || frecuencia === 'quincenal') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Días de la semana (opcional)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {DIAS_SEMANA.map((dia) => (
                              <button
                                key={dia.value}
                                type="button"
                                onClick={() => {
                                  setDiasSemana((prev) =>
                                    prev.includes(dia.value)
                                      ? prev.filter((d) => d !== dia.value)
                                      : [...prev, dia.value]
                                  );
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                  diasSemana.includes(dia.value)
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                              >
                                {dia.label}
                              </button>
                            ))}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Si no seleccionas días, se usará el mismo día de la semana que la fecha inicial
                          </p>
                        </div>
                      )}

                      {/* Intervalo (solo para semanal) */}
                      {frecuencia === 'semanal' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cada cuántas semanas
                          </label>
                          <select
                            value={intervalo}
                            onChange={(e) => setIntervalo(parseInt(e.target.value))}
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value={1}>Cada semana</option>
                            <option value={2}>Cada 2 semanas</option>
                            <option value={3}>Cada 3 semanas</option>
                            <option value={4}>Cada 4 semanas</option>
                          </select>
                        </div>
                      )}

                      {/* Terminación */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Termina
                          </label>
                          <select
                            value={terminaEn}
                            onChange={(e) => setTerminaEn(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            {TERMINA_EN.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        {terminaEn === 'cantidad' ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Número de citas
                            </label>
                            <input
                              type="number"
                              min={2}
                              max={52}
                              value={cantidadCitas}
                              onChange={(e) => setCantidadCitas(parseInt(e.target.value) || 12)}
                              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Fecha de fin
                            </label>
                            <input
                              type="date"
                              value={fechaFinRecurrencia}
                              onChange={(e) => setFechaFinRecurrencia(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        )}
                      </div>

                      {/* Botón de Preview */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewRecurrencia}
                        isLoading={previewMutation.isPending}
                        className="w-full"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Ver fechas disponibles
                      </Button>

                      {/* Preview de fechas */}
                      {mostrarPreview && previewData && (
                        <div className="mt-4 space-y-3">
                          {/* Resumen */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {previewData.descripcion_patron}
                            </span>
                            <span className={`font-medium ${
                              previewData.porcentaje_disponibilidad >= 80 ? 'text-green-600' :
                              previewData.porcentaje_disponibilidad >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {previewData.porcentaje_disponibilidad}% disponible
                            </span>
                          </div>

                          {/* Estadísticas */}
                          <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2">
                              <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-bold">{previewData.total_disponibles}</span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Disponibles</span>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-2">
                              <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                                <XCircle className="w-4 h-4" />
                                <span className="font-bold">{previewData.total_no_disponibles}</span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Conflictos</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                              <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span className="font-bold">{previewData.total_solicitadas}</span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                            </div>
                          </div>

                          {/* Lista expandible de fechas */}
                          <details className="text-sm">
                            <summary className="cursor-pointer text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                              Ver detalle de fechas
                            </summary>
                            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                              {previewData.fechas_disponibles?.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                </div>
                              ))}
                              {previewData.fechas_no_disponibles?.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                  <XCircle className="w-3 h-3" />
                                  <span>{new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} - {f.motivo}</span>
                                </div>
                              ))}
                            </div>
                          </details>

                          {/* Advertencia si hay muchos conflictos */}
                          {previewData.porcentaje_disponibilidad < 50 && (
                            <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-sm">
                              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                              <span className="text-yellow-700 dark:text-yellow-300">
                                Muchas fechas no están disponibles. Considera ajustar el horario o el profesional.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={crearMutation.isPending || actualizarMutation.isPending || crearRecurrenteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={crearMutation.isPending || actualizarMutation.isPending || crearRecurrenteMutation.isPending}
                disabled={crearMutation.isPending || actualizarMutation.isPending || crearRecurrenteMutation.isPending}
              >
                {isEditMode
                  ? actualizarMutation.isPending
                    ? 'Actualizando...'
                    : 'Actualizar Cita'
                  : esRecurrente
                    ? crearRecurrenteMutation.isPending
                      ? 'Creando serie...'
                      : `Crear ${previewData?.total_disponibles || cantidadCitas} Citas`
                    : crearMutation.isPending
                      ? 'Creando...'
                      : 'Crear Cita'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Drawer>
  );
}

export default CitaFormModal;
