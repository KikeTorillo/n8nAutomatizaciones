import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Briefcase, Package, Clock } from 'lucide-react';
import {
  Button,
  Drawer,
  MultiSelect,
  Select,
} from '@/components/ui';
import { useCrearCita, useActualizarCita, useCrearCitaRecurrente, usePreviewRecurrencia } from '@/hooks/agendamiento';
import { useClientes, useProfesionales } from '@/hooks/personas';
import { useServicios } from '@/hooks/agendamiento';
import { configuracionAgendamientoApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { useQuery } from '@tanstack/react-query';
import { aFormatoISO } from '@/utils/dateHelpers';

// Schemas centralizados (Ene 2026)
import { citaCreateSchema, citaEditSchema } from '@/schemas';

// Hooks y componentes refactorizados (Ene 2026)
import {
  useRecurrenceState,
  useProfesionalServices,
  useServicesTotalCalculation,
} from '@/hooks/agendamiento/citas';
import {
  RecurrencePanel,
  ServicesPriceSection,
  NotesSection,
} from './cita-form';

// ===============================
// COMPONENTE PRINCIPAL
// ===============================

/**
 * Modal de formulario para crear y editar citas
 * Refactorizado en Enero 2026 para reducir complejidad
 */
function CitaFormDrawer({ isOpen, onClose, mode = 'create', cita = null, fechaPreseleccionada = null, clientePreseleccionado = null }) {
  const toast = useToast();
  const isEditMode = mode === 'edit';

  // ===============================
  // FETCH DATA
  // ===============================
  const { data: clientesData } = useClientes({ activo: true });
  const { data: profesionalesData } = useProfesionales({ activo: true });
  const profesionales = profesionalesData?.profesionales || [];
  const { data: serviciosData } = useServicios({ activo: true });

  // Configuración Round-Robin
  const { data: configAgendamiento } = useQuery({
    queryKey: ['configuracion-agendamiento'],
    queryFn: async () => {
      const response = await configuracionAgendamientoApi.obtener();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const roundRobinHabilitado = configAgendamiento?.round_robin_habilitado || false;

  // ===============================
  // MUTATIONS
  // ===============================
  const crearMutation = useCrearCita();
  const actualizarMutation = useActualizarCita();
  const crearRecurrenteMutation = useCrearCitaRecurrente();
  const previewMutation = usePreviewRecurrencia();

  // ===============================
  // REACT HOOK FORM
  // ===============================
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
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    shouldUnregister: false,
    defaultValues: isEditMode ? {} : {
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

  const watchProfesional = watch('profesional_id');
  const watchServicios = watch('servicios_ids');
  const watchPrecio = watch('precio_servicio');
  const watchDescuento = watch('descuento');

  // ===============================
  // CUSTOM HOOKS (Refactorizados Ene 2026)
  // ===============================

  // Hook de recurrencia
  const recurrenceState = useRecurrenceState();

  // Hook de servicios por profesional
  const {
    serviciosDisponiblesConEstado,
    cargandoServicios,
    limpiarServicios,
    puedeSeleccionarServicios,
    mensajeAyudaServicios,
  } = useProfesionalServices(watchProfesional, serviciosData, roundRobinHabilitado);

  // Hook de cálculo de totales
  const {
    precioCalculado,
    calcularPrecioTotal,
    mostrarDuracionCalculada,
    mostrarPrecioCalculado,
  } = useServicesTotalCalculation({
    serviciosIds: watchServicios,
    serviciosDisponiblesConEstado,
    serviciosCatalogo: serviciosData,
    isOpen,
    isEditMode,
    setValue,
  });

  // ===============================
  // EFFECTS
  // ===============================

  // Preseleccionar cliente si viene de otra página
  useEffect(() => {
    if (isOpen && clientePreseleccionado && !isEditMode) {
      setValue('cliente_id', String(clientePreseleccionado));
    }
  }, [isOpen, clientePreseleccionado, isEditMode, setValue]);

  // Calcular precio total con descuento
  useEffect(() => {
    calcularPrecioTotal(watchPrecio, watchDescuento);
  }, [watchPrecio, watchDescuento, calcularPrecioTotal]);

  // Pre-cargar datos de la cita en modo edición
  useEffect(() => {
    if (isEditMode && cita && isOpen) {
      let serviciosIds = [];
      if (cita.servicios && Array.isArray(cita.servicios)) {
        serviciosIds = cita.servicios.map(s => s.servicio_id?.toString());
      } else if (cita.servicio_id) {
        serviciosIds = [cita.servicio_id.toString()];
      }

      let fechaFormateada = '';
      if (cita.fecha_cita) {
        fechaFormateada = cita.fecha_cita.split('T')[0];
      }

      reset({
        cliente_id: cita.cliente_id?.toString() || '',
        profesional_id: cita.profesional_id?.toString() || '',
        servicios_ids: serviciosIds,
        fecha_cita: fechaFormateada,
        hora_inicio: cita.hora_inicio?.substring(0, 5) || '',
        duracion_minutos: cita.duracion_total_minutos || cita.duracion_minutos || 30,
        precio_servicio: cita.precio_total || cita.precio_servicio || 0,
        descuento: cita.descuento || 0,
        notas_cliente: cita.notas_cliente || '',
        notas_internas: cita.notas_internas || '',
      });
    }
  }, [isEditMode, cita, isOpen, reset]);

  // Pre-rellenar fecha cuando se abre el modal con fecha preseleccionada
  useEffect(() => {
    if (isOpen && !isEditMode && fechaPreseleccionada) {
      setValue('fecha_cita', fechaPreseleccionada);
    }
  }, [isOpen, fechaPreseleccionada, isEditMode, setValue]);

  // Limpiar formulario cuando se abre en modo creación
  useEffect(() => {
    if (isOpen && !isEditMode) {
      limpiarServicios();
    }
  }, [isOpen, isEditMode, limpiarServicios]);

  // ===============================
  // HANDLERS
  // ===============================

  // Handler para preview de recurrencia
  const handlePreviewRecurrencia = async () => {
    const formData = watch();
    if (!formData.profesional_id || !formData.fecha_cita || !formData.hora_inicio || !formData.duracion_minutos) {
      toast.error('Completa profesional, fecha, hora y duración para ver el preview');
      return;
    }

    try {
      const result = await previewMutation.mutateAsync({
        fecha_inicio: formData.fecha_cita,
        hora_inicio: `${formData.hora_inicio}:00`,
        duracion_minutos: formData.duracion_minutos,
        profesional_id: parseInt(formData.profesional_id),
        patron_recurrencia: recurrenceState.buildPatronRecurrencia(),
      });
      recurrenceState.setPreviewData(result);
      recurrenceState.setMostrarPreview(true);
    } catch (error) {
      toast.error('Error al generar preview: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handler de submit
  const onSubmit = async (data) => {
    try {
      // Calcular hora_fin
      const [horas, minutos] = data.hora_inicio.split(':').map(Number);
      const minutosTotal = horas * 60 + minutos + data.duracion_minutos;
      const horasFin = Math.floor(minutosTotal / 60) % 24;
      const minutosFin = minutosTotal % 60;
      const horaFin = `${String(horasFin).padStart(2, '0')}:${String(minutosFin).padStart(2, '0')}:00`;

      const sanitized = {
        cliente_id: parseInt(data.cliente_id),
        ...(data.profesional_id && data.profesional_id !== 'auto' ? { profesional_id: parseInt(data.profesional_id) } : {}),
        servicios_ids: data.servicios_ids.map(id => parseInt(id)),
        fecha_cita: data.fecha_cita,
        hora_inicio: `${data.hora_inicio}:00`,
        hora_fin: horaFin,
        duracion_minutos: data.duracion_minutos,
        precio_servicio: data.precio_servicio,
        descuento: data.descuento || 0,
        notas_cliente: data.notas_cliente?.trim() || undefined,
        notas_internas: data.notas_internas?.trim() || undefined,
      };

      if (isEditMode) {
        await actualizarMutation.mutateAsync({ id: cita.id, ...sanitized });
        toast.success('Cita actualizada exitosamente');
      } else if (recurrenceState.esRecurrente) {
        const result = await crearRecurrenteMutation.mutateAsync({
          ...sanitized,
          es_recurrente: true,
          patron_recurrencia: recurrenceState.buildPatronRecurrencia(),
        });

        if (result.citas_omitidas?.length > 0) {
          toast.warning(`Serie creada: ${result.citas_creadas?.length} citas. ${result.citas_omitidas?.length} fechas omitidas por conflictos.`);
        } else {
          toast.success(`Serie creada: ${result.citas_creadas?.length} citas`);
        }
      } else {
        await crearMutation.mutateAsync(sanitized);
        toast.success('Cita creada exitosamente');
      }

      recurrenceState.resetRecurrencia();
      onClose();
      reset();
    } catch (error) {
      const accion = isEditMode ? 'actualizar' : recurrenceState.esRecurrente ? 'crear serie de citas' : 'crear';
      const mensajeError = error.response?.data?.message || error.response?.data?.error || error.message || `Error al ${accion}`;
      const mensajeFinal = mensajeError.startsWith('No se puede') || mensajeError.startsWith('Error') || mensajeError.startsWith('Conflicto')
        ? mensajeError
        : `No se puede ${accion}: ${mensajeError}`;
      toast.error(mensajeFinal);
    }
  };

  // ===============================
  // OPCIONES DE SELECTS
  // ===============================
  const clientesOpciones = (clientesData?.clientes || []).map((c) => ({
    value: c.id.toString(),
    label: `${c.nombre} ${c.apellidos || ''} - ${c.telefono || 'Sin teléfono'}`,
  }));

  const profesionalesOpciones = [
    ...(roundRobinHabilitado ? [{ value: 'auto', label: '🔄 Auto-asignar (Round-Robin)' }] : []),
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
    disabled: !s.disponible,
  }));

  const isPending = crearMutation.isPending || actualizarMutation.isPending || crearRecurrenteMutation.isPending;

  // ===============================
  // RENDER
  // ===============================
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Cita' : 'Nueva Cita'}
      subtitle={isEditMode ? 'Modifica los datos de la cita' : 'Completa la información de la cita'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cliente {!isEditMode && <span className="text-red-500">*</span>}
            </label>
            <div className="flex items-center gap-2 w-full">
              <User className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <div className="flex-1">
                <Controller
                  name="cliente_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={clientesOpciones}
                      placeholder="Selecciona un cliente"
                      disabled={isEditMode}
                    />
                  )}
                />
              </div>
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
            <div className="flex items-center gap-2 w-full">
              <Briefcase className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <div className="flex-1">
                <Controller
                  name="profesional_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={profesionalesOpciones}
                      placeholder={roundRobinHabilitado ? 'Auto-asignar (Round-Robin)' : 'Selecciona un profesional'}
                    />
                  )}
                />
              </div>
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
            <div className="flex items-start gap-2 w-full">
              <Package className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-2.5 flex-shrink-0" />
              <div className="flex-1">
                <Controller
                  name="servicios_ids"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      {...field}
                      options={serviciosOpciones}
                      placeholder={cargandoServicios ? 'Cargando servicios...' : 'Selecciona uno o más servicios'}
                      disabled={!puedeSeleccionarServicios || cargandoServicios}
                      max={10}
                      helper={!errors.servicios_ids && watchServicios?.length > 0 && `${watchServicios.length} servicio(s) seleccionado(s)`}
                    />
                  )}
                />
              </div>
            </div>
            {mensajeAyudaServicios?.tipo === 'seleccionar-profesional' && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {mensajeAyudaServicios.mensaje}
              </p>
            )}
            {mensajeAyudaServicios?.tipo === 'round-robin' && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                🔄 {mensajeAyudaServicios.mensaje}
              </p>
            )}
            {errors.servicios_ids && (
              <p className="mt-1 text-sm text-red-600">{errors.servicios_ids.message}</p>
            )}
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de la Cita {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <input
                {...register('fecha_cita')}
                type="date"
                className="block w-full px-3 h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              {errors.fecha_cita && (
                <p className="mt-1 text-sm text-red-600">{errors.fecha_cita.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora de Inicio {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <div className="flex items-center gap-2 w-full">
                <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <input
                  {...register('hora_inicio')}
                  type="time"
                  className="flex-1 px-3 h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              {errors.hora_inicio && (
                <p className="mt-1 text-sm text-red-600">{errors.hora_inicio.message}</p>
              )}
            </div>
          </div>

          {/* Sección de Servicios, Precios y Total */}
          <ServicesPriceSection
            control={control}
            isEditMode={isEditMode}
            mostrarDuracionCalculada={mostrarDuracionCalculada}
            mostrarPrecioCalculado={mostrarPrecioCalculado}
            duracion={watch('duracion_minutos')}
            precio={watch('precio_servicio')}
            precioTotal={precioCalculado}
          />

          {/* Sección de Notas */}
          <NotesSection control={control} errors={errors} />

          {/* Panel de Recurrencia (solo en modo creación) */}
          {!isEditMode && (
            <RecurrencePanel
              esRecurrente={recurrenceState.esRecurrente}
              onToggleRecurrencia={recurrenceState.toggleRecurrencia}
              frecuencia={recurrenceState.frecuencia}
              onFrecuenciaChange={recurrenceState.setFrecuencia}
              diasSemana={recurrenceState.diasSemana}
              onToggleDiaSemana={recurrenceState.toggleDiaSemana}
              intervalo={recurrenceState.intervalo}
              onIntervaloChange={recurrenceState.setIntervalo}
              terminaEn={recurrenceState.terminaEn}
              onTerminaEnChange={recurrenceState.setTerminaEn}
              cantidadCitas={recurrenceState.cantidadCitas}
              onCantidadCitasChange={recurrenceState.setCantidadCitas}
              fechaFinRecurrencia={recurrenceState.fechaFinRecurrencia}
              onFechaFinChange={recurrenceState.setFechaFinRecurrencia}
              onPreview={handlePreviewRecurrencia}
              isLoadingPreview={previewMutation.isPending}
              mostrarPreview={recurrenceState.mostrarPreview}
              previewData={recurrenceState.previewData}
            />
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            disabled={isPending}
          >
            {isEditMode
              ? actualizarMutation.isPending ? 'Actualizando...' : 'Actualizar Cita'
              : recurrenceState.esRecurrente
                ? crearRecurrenteMutation.isPending
                  ? 'Creando serie...'
                  : `Crear ${recurrenceState.previewData?.total_disponibles || recurrenceState.cantidadCitas} Citas`
                : crearMutation.isPending ? 'Creando...' : 'Crear Cita'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default CitaFormDrawer;
