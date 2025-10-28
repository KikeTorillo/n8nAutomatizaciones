import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, User, Briefcase, Package, Clock, DollarSign } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import MultiSelect from '@/components/ui/MultiSelect';
import FormField from '@/components/forms/FormField';
import { useCrearCita, useActualizarCita, useCita } from '@/hooks/useCitas';
import { useClientes } from '@/hooks/useClientes';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useServicios } from '@/hooks/useServicios';
import { serviciosApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/useToast';
import { aFormatoISO } from '@/utils/dateHelpers';

/**
 * Schema de validación Zod para CREAR cita
 */
const citaCreateSchema = z
  .object({
    cliente_id: z.string().min(1, 'Debes seleccionar un cliente'),
    profesional_id: z.string().min(1, 'Debes seleccionar un profesional'),
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
  );

/**
 * Modal de formulario para crear y editar citas
 * @param {string} mode - 'create' o 'edit'
 * @param {object|null} cita - Datos de la cita a editar (solo en modo edit)
 * @param {string|null} fechaPreseleccionada - Fecha preseleccionada desde el calendario (formato ISO YYYY-MM-DD)
 */
function CitaFormModal({ isOpen, onClose, mode = 'create', cita = null, fechaPreseleccionada = null }) {
  const toast = useToast();
  const isEditMode = mode === 'edit';
  const citaId = cita?.id;

  // Estados locales
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [precioCalculado, setPrecioCalculado] = useState(0);

  // Fetch data
  const { data: citaData, isLoading: loadingCita } = useCita(citaId);
  const { data: clientesData } = useClientes({ activo: true });
  const { data: profesionales } = useProfesionales({ activo: true });
  const { data: servicios } = useServicios({ activo: true });

  // Hooks de mutación
  const crearMutation = useCrearCita();
  const actualizarMutation = useActualizarCita();

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

  // Cargar servicios del profesional seleccionado
  useEffect(() => {
    const cargarServiciosProfesional = async () => {
      if (!watchProfesional || watchProfesional === '') {
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
    // Si NO hay profesional seleccionado: mostrar TODOS los servicios con estado
    if (!watchProfesional || watchProfesional === '') {
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
  useEffect(() => {
    if (watchServicios && watchServicios.length > 0) {
      // Calcular totales sumando TODOS los servicios seleccionados
      let duracionTotal = 0;
      let precioTotal = 0;

      watchServicios.forEach((servicioId) => {
        const servicio = serviciosDisponibles.find(
          (s) => s.id === parseInt(servicioId)
        );
        if (servicio) {
          duracionTotal += servicio.duracion_minutos || 0;
          precioTotal += parseFloat(servicio.precio) || 0;
        }
      });

      setValue('duracion_minutos', duracionTotal);
      setValue('precio_servicio', precioTotal);
    } else {
      // Si no hay servicios seleccionados, resetear a 0
      setValue('duracion_minutos', 0);
      setValue('precio_servicio', 0);
    }
  }, [watchServicios, serviciosDisponibles, setValue]);

  // Calcular precio total
  useEffect(() => {
    const precio = parseFloat(watchPrecio) || 0;
    const descuento = parseFloat(watchDescuento) || 0;
    setPrecioCalculado(precio - descuento);
  }, [watchPrecio, watchDescuento]);

  // Reset formulario cuando cambia el modo (create/edit)
  // TEMPORALMENTE COMENTADO PARA DEBUGGING Bug #7
  /*
  useEffect(() => {
    if (isOpen && !isEditMode) {
      // Modo creación: resetear a valores vacíos
      reset({
        cliente_id: '',
        profesional_id: '',
        servicio_id: '',
        fecha_cita: '',
        hora_inicio: '',
        duracion_minutos: 30,
        precio_servicio: 0,
        descuento: 0,
        notas_cliente: '',
        notas_internas: '',
      });
      setProfesionalSeleccionado('');
      setServiciosDisponibles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditMode]);
  */

  // Pre-cargar datos de la cita en modo edición
  useEffect(() => {
    if (isEditMode && citaData && isOpen) {
      // Convertir servicios a array de IDs si existe el campo servicios
      let serviciosIds = [];
      if (citaData.servicios && Array.isArray(citaData.servicios)) {
        // Si citaData tiene array de servicios (respuesta de listar con JSON_AGG)
        serviciosIds = citaData.servicios.map(s => s.servicio_id?.toString());
      } else if (citaData.servicio_id) {
        // Backward compatibility: si solo tiene servicio_id (respuesta antigua)
        serviciosIds = [citaData.servicio_id.toString()];
      }

      reset({
        cliente_id: citaData.cliente_id?.toString() || '',
        profesional_id: citaData.profesional_id?.toString() || '',
        servicios_ids: serviciosIds,
        fecha_cita: citaData.fecha_cita || '',
        hora_inicio: citaData.hora_inicio?.substring(0, 5) || '', // "14:30:00" → "14:30"
        duracion_minutos: citaData.duracion_total_minutos || citaData.duracion_minutos || 30,
        precio_servicio: citaData.precio_total || citaData.precio_servicio || 0,
        descuento: citaData.descuento || 0,
        notas_cliente: citaData.notas_cliente || '',
        notas_internas: citaData.notas_internas || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, citaData, isOpen]);

  // Pre-rellenar fecha cuando se abre el modal con fecha preseleccionada
  useEffect(() => {
    if (isOpen && !isEditMode && fechaPreseleccionada) {
      setValue('fecha_cita', fechaPreseleccionada);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fechaPreseleccionada, isEditMode]);

  // Reset form cuando cierra el modal
  useEffect(() => {
    if (!isOpen) {
      reset();
      setServiciosDisponibles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
      const sanitized = {
        cliente_id: parseInt(data.cliente_id),
        profesional_id: parseInt(data.profesional_id),
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
        await actualizarMutation.mutateAsync({ id: citaId, ...sanitized });
        toast.success('Cita actualizada exitosamente');
      } else {
        // Modo creación
        await crearMutation.mutateAsync(sanitized);
        toast.success('Cita creada exitosamente');
      }

      onClose();
      reset();
    } catch (error) {
      // Extraer el mensaje de error del response del backend
      let mensajeError = '';
      const accion = isEditMode ? 'actualizar' : 'crear';

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
        mensajeError = `Error al ${accion} la cita`;
      }

      // Agregar prefijo descriptivo solo si el mensaje no lo tiene ya
      const mensajeFinal = mensajeError.startsWith('No se puede') ||
                           mensajeError.startsWith('Error') ||
                           mensajeError.startsWith('Conflicto')
        ? mensajeError
        : `No se puede ${accion} la cita: ${mensajeError}`;

      // Mostrar el error con un toast
      toast.error(mensajeFinal);
    }
  };

  // Loading state durante fetch de datos
  const isLoadingData = isEditMode && loadingCita;

  // Opciones de selects
  // NOTA: No incluimos opción placeholder vacía porque el componente Select ya la agrega automáticamente
  const clientesOpciones = (clientesData?.clientes || []).map((c) => ({
    value: c.id.toString(),
    label: `${c.nombre} ${c.apellidos || ''} - ${c.telefono || 'Sin teléfono'}`,
  }));

  const profesionalesOpciones = (profesionales || []).map((p) => ({
    value: p.id.toString(),
    label: `${p.nombre_completo} - ${p.tipo_nombre || 'Profesional'}`,
  }));

  const serviciosOpciones = serviciosDisponiblesConEstado.map((s) => ({
    value: s.id.toString(),
    label: s.disponible
      ? `${s.nombre} - $${s.precio?.toLocaleString('es-CO')} - ${s.duracion_minutos}min`
      : `${s.nombre} - $${s.precio?.toLocaleString('es-CO')} - ${s.duracion_minutos}min (${s.razon_no_disponible})`,
    disabled: !s.disponible, // Deshabilitar opciones no disponibles
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Cita' : 'Nueva Cita'}
      size="large"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header con icono */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditMode ? 'Editar Cita' : 'Crear Nueva Cita'}
            </h3>
            <p className="text-sm text-gray-600">
              {isEditMode ? 'Modifica los datos de la cita' : 'Completa la información de la cita'}
            </p>
          </div>
        </div>

        {/* Loading state durante fetch de datos en modo edición */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-600">Cargando datos de la cita...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Campos del formulario */}
            <div className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profesional {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <Controller
                    name="profesional_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={profesionalesOpciones}
                        placeholder="Selecciona un profesional"
                        className="flex-1"
                      />
                    )}
                  />
                </div>
                {errors.profesional_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.profesional_id.message}</p>
                )}
                {!errors.profesional_id && (
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Selecciona un profesional para ver solo sus servicios, o deja vacío para ver todos los servicios disponibles
                  </p>
                )}
              </div>

              {/* Servicios (MultiSelect) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servicios {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-start gap-2">
                  <Package className="w-5 h-5 text-gray-400 mt-3" />
                  <Controller
                    name="servicios_ids"
                    control={control}
                    render={({ field }) => (
                      <MultiSelect
                        {...field}
                        options={serviciosOpciones}
                        placeholder={cargandoServicios ? 'Cargando servicios...' : 'Selecciona uno o más servicios'}
                        className="flex-1"
                        disabled={!watchProfesional || cargandoServicios}
                        max={10}
                        helper={!errors.servicios_ids && watchServicios?.length > 0 && `${watchServicios.length} servicio(s) seleccionado(s)`}
                      />
                    )}
                  />
                </div>
                {!watchProfesional && (
                  <p className="mt-1 text-xs text-gray-500">
                    Primero selecciona un profesional
                  </p>
                )}
                {errors.servicios_ids && (
                  <p className="mt-1 text-sm text-red-600">{errors.servicios_ids.message}</p>
                )}
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de la Cita {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    {...register('fecha_cita')}
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                  {errors.fecha_cita && (
                    <p className="mt-1 text-sm text-red-600">{errors.fecha_cita.message}</p>
                  )}
                </div>

                {/* Hora Inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Inicio {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <input
                      {...register('hora_inicio')}
                      type="time"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  {errors.hora_inicio && (
                    <p className="mt-1 text-sm text-red-600">{errors.hora_inicio.message}</p>
                  )}
                </div>
              </div>

              {/* Duración, Precio y Descuento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Duración */}
                <FormField
                  name="duracion_minutos"
                  control={control}
                  label="Duración (minutos)"
                  type="number"
                  placeholder="30"
                  required={!isEditMode}
                />

                {/* Precio */}
                <FormField
                  name="precio_servicio"
                  control={control}
                  label="Precio del Servicio"
                  type="number"
                  placeholder="25000"
                  required={!isEditMode}
                />

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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Total a Pagar:</span>
                  </div>
                  <span className="text-xl font-bold text-primary-600">
                    ${precioCalculado.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {/* Notas del Cliente */}
              <Controller
                name="notas_cliente"
                control={control}
                render={({ field }) => (
                  <div>
                    <label
                      htmlFor="notas_cliente"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Notas del Cliente (Opcional)
                    </label>
                    <textarea
                      {...field}
                      id="notas_cliente"
                      rows={3}
                      placeholder="Preferencias, alergias, solicitudes especiales..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    {errors.notas_cliente && (
                      <p className="mt-1 text-sm text-red-600">{errors.notas_cliente.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Notas Internas */}
              <Controller
                name="notas_internas"
                control={control}
                render={({ field }) => (
                  <div>
                    <label
                      htmlFor="notas_internas"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Notas Internas (Opcional)
                    </label>
                    <textarea
                      {...field}
                      id="notas_internas"
                      rows={2}
                      placeholder="Notas privadas del negocio (no visibles para el cliente)..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    {errors.notas_internas && (
                      <p className="mt-1 text-sm text-red-600">{errors.notas_internas.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={crearMutation.isPending || actualizarMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={crearMutation.isPending || actualizarMutation.isPending}
                disabled={crearMutation.isPending || actualizarMutation.isPending}
              >
                {isEditMode
                  ? actualizarMutation.isPending
                    ? 'Actualizando...'
                    : 'Actualizar Cita'
                  : crearMutation.isPending
                    ? 'Creando...'
                    : 'Crear Cita'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

export default CitaFormModal;
