import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Palette, Mail, Settings, Send, Clock, CheckCircle, XCircle, RefreshCw, Camera, X, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import FormField from '@/components/forms/FormField';
import {
  useCrearProfesional,
  useActualizarProfesional,
  useProfesional,
  useActualizarModulos
} from '@/hooks/useProfesionales';
import { useTiposProfesional } from '@/hooks/useTiposProfesional';
import { useToast } from '@/hooks/useToast';
import { invitacionesApi } from '@/services/api/endpoints';
import { useUploadArchivo } from '@/hooks/useStorage';

/**
 * Colores predefinidos para el calendario
 */
const COLORES_CALENDARIO = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
];

/**
 * Schema de validación Zod para CREAR profesional
 * 🔄 Migrado: tipo_profesional (string) → tipo_profesional_id (integer)
 */
const profesionalCreateSchema = z.object({
  nombre_completo: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  tipo_profesional_id: z.number({
    required_error: 'Debes seleccionar un tipo de profesional',
    invalid_type_error: 'Tipo inválido',
  }).int().positive('Debes seleccionar un tipo de profesional'),
  // Email obligatorio para enviar invitación al crear
  email: z.string({
    required_error: 'El email es obligatorio para enviar la invitación',
  }).email('Email inválido').max(100, 'Máximo 100 caracteres'),
  telefono: z.string().regex(/^[1-9]\d{9}$/, 'El teléfono debe ser válido de 10 dígitos (ej: 5512345678)').optional().or(z.literal('')),
  color_calendario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').default('#3b82f6'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  activo: z.boolean().default(true),
});

/**
 * Schema de validación Zod para EDITAR profesional
 * 🔄 Migrado: tipo_profesional (string) → tipo_profesional_id (integer)
 */
const profesionalEditSchema = z.object({
  nombre_completo: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres').optional(),
  tipo_profesional_id: z.number().int().positive().optional(),
  email: z.string().email('Email inválido').max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  telefono: z.string().regex(/^[1-9]\d{9}$/, 'El teléfono debe ser válido de 10 dígitos (ej: 5512345678)').optional().or(z.literal('')),
  color_calendario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').optional(),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  activo: z.boolean().optional(),
}).refine((data) => {
  return Object.keys(data).some(key => data[key] !== undefined && data[key] !== '');
}, {
  message: 'Debes modificar al menos un campo',
});

/**
 * Modal de formulario para crear y editar profesionales
 * @param {string} mode - 'create' o 'edit'
 * @param {object|null} profesional - Datos del profesional a editar (solo en modo edit)
 */
function ProfesionalFormModal({ isOpen, onClose, mode = 'create', profesional = null }) {
  const toast = useToast();
  const [selectedColor, setSelectedColor] = useState(COLORES_CALENDARIO[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Nov 2025: Estado para módulos e invitación
  const [modulosAcceso, setModulosAcceso] = useState({
    agendamiento: true,
    pos: false,
    inventario: false
  });
  const [emailInvitacion, setEmailInvitacion] = useState('');
  const [invitacionActual, setInvitacionActual] = useState(null);
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false);

  // Dic 2025: Estado para foto de perfil
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoUrl, setFotoUrl] = useState(null);
  const uploadMutation = useUploadArchivo();

  const isEditMode = mode === 'edit';
  const profesionalId = profesional?.id;

  // Fetch tipos de profesional (dinámicos desde DB)
  const { data: tiposProfesional = [], isLoading: loadingTipos } = useTiposProfesional({ activo: true });

  // Fetch datos del profesional en modo edición
  const { data: profesionalData, isLoading: loadingProfesional } = useProfesional(profesionalId);

  // Hooks de mutación
  const crearMutation = useCrearProfesional();
  const actualizarMutation = useActualizarProfesional();
  const actualizarModulosMutation = useActualizarModulos();

  // Cargar invitación actual en modo edición
  useEffect(() => {
    const cargarInvitacion = async () => {
      if (isEditMode && profesionalId && isOpen) {
        try {
          const response = await invitacionesApi.obtenerPorProfesional(profesionalId);
          setInvitacionActual(response.data.data.invitacion);
        } catch (err) {
          // No hay invitación, es normal
          setInvitacionActual(null);
        }
      }
    };
    cargarInvitacion();
  }, [isEditMode, profesionalId, isOpen]);

  // React Hook Form con validación Zod
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditMode ? profesionalEditSchema : profesionalCreateSchema),
    defaultValues: isEditMode
      ? {}
      : {
          nombre_completo: '',
          tipo_profesional_id: undefined, // Integer ID (requerido en create)
          email: '',
          telefono: '',
          color_calendario: COLORES_CALENDARIO[0],
          descripcion: '',
          activo: true,
        },
  });

  // Reset formulario cuando cambia el modo (create/edit)
  useEffect(() => {
    if (isOpen) {
      if (!isEditMode) {
        // Modo creación: resetear a valores vacíos
        reset({
          nombre_completo: '',
          tipo_profesional_id: undefined,
          email: '',
          telefono: '',
          color_calendario: COLORES_CALENDARIO[0],
          descripcion: '',
          activo: true,
        });
        setSelectedColor(COLORES_CALENDARIO[0]);
      }
    }
  }, [isOpen, isEditMode, profesionalId, reset]);

  // Pre-cargar datos del profesional en modo edición
  useEffect(() => {
    if (isEditMode && profesionalData && isOpen) {
      reset({
        nombre_completo: profesionalData.nombre_completo || '',
        tipo_profesional_id: profesionalData.tipo_profesional_id || undefined, // Integer ID
        email: profesionalData.email || '',
        telefono: profesionalData.telefono || '',
        color_calendario: profesionalData.color_calendario || COLORES_CALENDARIO[0],
        descripcion: profesionalData.biografia || '', // Backend usa 'biografia'
        activo: profesionalData.activo !== undefined ? profesionalData.activo : true,
      });
      setSelectedColor(profesionalData.color_calendario || COLORES_CALENDARIO[0]);

      // Nov 2025: Cargar módulos
      setModulosAcceso(profesionalData.modulos_acceso || {
        agendamiento: true,
        pos: false,
        inventario: false
      });

      // Dic 2025: Cargar foto existente
      if (profesionalData.foto_url) {
        setFotoUrl(profesionalData.foto_url);
        setFotoPreview(profesionalData.foto_url);
      } else {
        setFotoUrl(null);
        setFotoPreview(null);
      }
      setFotoFile(null);
    }
  }, [isEditMode, profesionalData, isOpen, reset]);

  // Reset form cuando cierra el modal
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedColor(COLORES_CALENDARIO[0]);
      setShowColorPicker(false);
      setEmailInvitacion('');
      setInvitacionActual(null);
      // Dic 2025: Limpiar foto
      setFotoFile(null);
      setFotoPreview(null);
      setFotoUrl(null);
    }
  }, [isOpen, reset]);

  // Handler para enviar invitación
  const handleEnviarInvitacion = async () => {
    if (!emailInvitacion || !emailInvitacion.includes('@')) {
      toast.error('Ingresa un email válido');
      return;
    }

    setEnviandoInvitacion(true);
    try {
      const response = await invitacionesApi.crear({
        profesional_id: profesionalId,
        email: emailInvitacion,
        nombre_sugerido: profesionalData?.nombre_completo
      });
      setInvitacionActual(response.data.data.invitacion);
      setEmailInvitacion('');
      toast.success('Invitación enviada exitosamente');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar invitación');
    } finally {
      setEnviandoInvitacion(false);
    }
  };

  // Handler para reenviar invitación
  const handleReenviarInvitacion = async () => {
    if (!invitacionActual?.id) return;

    setEnviandoInvitacion(true);
    try {
      const response = await invitacionesApi.reenviar(invitacionActual.id);
      setInvitacionActual(response.data.data.invitacion);
      toast.success('Invitación reenviada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al reenviar invitación');
    } finally {
      setEnviandoInvitacion(false);
    }
  };

  // Handler para cancelar invitación
  const handleCancelarInvitacion = async () => {
    if (!invitacionActual?.id) return;

    if (!window.confirm('¿Cancelar esta invitación?')) return;

    try {
      await invitacionesApi.cancelar(invitacionActual.id);
      setInvitacionActual(null);
      toast.success('Invitación cancelada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cancelar invitación');
    }
  };

  // Dic 2025: Handler para seleccionar foto
  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar 5MB');
        return;
      }
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  // Dic 2025: Handler para eliminar foto
  const handleEliminarFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    setFotoUrl(null);
  };

  // Handler para seleccionar color
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setValue('color_calendario', color);
    setShowColorPicker(false);
  };

  // Handler de submit
  const onSubmit = async (data) => {
    try {
      // Dic 2025: Subir foto si hay una nueva
      let urlFotoFinal = fotoUrl;
      if (fotoFile) {
        const resultado = await uploadMutation.mutateAsync({
          file: fotoFile,
          folder: 'profesionales',
          isPublic: true,
        });
        urlFotoFinal = resultado?.url || resultado;
      }

      // Sanitizar campos opcionales vacíos
      const sanitized = {
        nombre_completo: data.nombre_completo?.trim(),
        tipo_profesional_id: data.tipo_profesional_id, // Integer ID (requerido)
        email: data.email?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        color_calendario: data.color_calendario,
        biografia: data.descripcion?.trim() || undefined, // Backend usa 'biografia'
        activo: data.activo,
        // Nov 2025: Incluir módulos
        modulos_acceso: modulosAcceso,
        // Dic 2025: Incluir foto
        foto_url: urlFotoFinal || undefined,
      };

      // Si se eliminó la foto existente
      if (fotoUrl === null && profesionalData?.foto_url) {
        sanitized.foto_url = null;
      }

      if (isEditMode) {
        // Modo edición: actualizar datos básicos
        await actualizarMutation.mutateAsync({ id: profesionalId, data: sanitized });

        // Nov 2025: Si cambiaron los módulos, actualizarlos
        const modulosCambiaron = JSON.stringify(profesionalData?.modulos_acceso) !== JSON.stringify(modulosAcceso);
        if (modulosCambiaron) {
          await actualizarModulosMutation.mutateAsync({
            profesionalId,
            modulosAcceso
          });
        }

        toast.success('Profesional actualizado exitosamente');
      } else {
        // Modo creación: crear profesional y enviar invitación automáticamente
        const resultado = await crearMutation.mutateAsync(sanitized);
        const nuevoProfesionalId = resultado.data?.id || resultado.id;

        // Enviar invitación automáticamente
        if (nuevoProfesionalId && data.email?.trim()) {
          try {
            await invitacionesApi.crear({
              profesional_id: nuevoProfesionalId,
              email: data.email.trim(),
              nombre_sugerido: data.nombre_completo?.trim()
            });
            toast.success('Profesional creado e invitación enviada');
          } catch (invErr) {
            // El profesional se creó pero falló la invitación
            console.error('Error enviando invitación:', invErr);
            toast.warning('Profesional creado, pero hubo un error al enviar la invitación. Puedes reenviarla desde la edición.');
          }
        } else {
          toast.success('Profesional creado exitosamente');
        }
      }

      onClose();
      reset();
      setSelectedColor(COLORES_CALENDARIO[0]);
      setModulosAcceso({ agendamiento: true, pos: false, inventario: false });
      setEmailInvitacion('');
      setInvitacionActual(null);
      // Dic 2025: Limpiar foto
      setFotoFile(null);
      setFotoPreview(null);
      setFotoUrl(null);
    } catch (error) {
      toast.error(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} profesional`);
    }
  };

  // Loading state durante fetch de datos
  const isLoadingData = isEditMode && loadingProfesional;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Profesional' : 'Nuevo Profesional'}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header con foto de perfil */}
        <div className="flex items-center gap-4 pb-4 border-b">
          {/* Foto de perfil editable */}
          <div className="relative">
            {fotoPreview ? (
              <div className="relative">
                <img
                  src={fotoPreview}
                  alt="Foto del profesional"
                  className="w-16 h-16 rounded-full object-cover border-2"
                  style={{ borderColor: selectedColor }}
                />
                <button
                  type="button"
                  onClick={handleEliminarFoto}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: selectedColor }}
              >
                <User className="w-8 h-8" />
              </div>
            )}
            {/* Botón para cambiar foto */}
            <label className="absolute -bottom-1 -right-1 bg-white border border-gray-300 rounded-full p-1.5 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
              <Camera className="h-3.5 w-3.5 text-gray-600" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="sr-only"
                disabled={uploadMutation.isPending}
              />
            </label>
            {uploadMutation.isPending && (
              <div className="absolute inset-0 bg-white bg-opacity-75 rounded-full flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditMode ? 'Editar Profesional' : 'Crear Nuevo Profesional'}
            </h3>
            <p className="text-sm text-gray-600">
              {isEditMode
                ? 'Modifica los datos del profesional'
                : 'Completa la información del profesional'}
            </p>
          </div>
        </div>

        {/* Loading state durante fetch de datos en modo edición */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-600">Cargando datos del profesional...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Campos del formulario */}
            <div className="space-y-4">
              {/* Nombre Completo */}
              <FormField
                name="nombre_completo"
                control={control}
                label="Nombre Completo"
                placeholder="Ej: María García López"
                required={!isEditMode}
              />

              {/* Tipo de Profesional - Select dinámico desde DB */}
              <Controller
                name="tipo_profesional_id"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Select
                    {...field}
                    label="Tipo de Profesional"
                    value={value?.toString() || ''}
                    onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    options={tiposProfesional.map((tipo) => ({
                      value: tipo.id.toString(),
                      label: `${tipo.nombre}${tipo.es_sistema ? '' : ' (Personalizado)'}`,
                    }))}
                    placeholder={loadingTipos ? 'Cargando tipos...' : 'Selecciona un tipo de profesional'}
                    disabled={loadingTipos}
                    required={!isEditMode}
                    error={errors.tipo_profesional_id?.message}
                  />
                )}
              />

              {/* Email y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="email"
                  control={control}
                  label={isEditMode ? "Email" : "Email del empleado"}
                  type="email"
                  placeholder="ejemplo@correo.com"
                  required={!isEditMode}
                  helperText={!isEditMode ? "Se enviará invitación a este correo" : undefined}
                />
                <FormField
                  name="telefono"
                  control={control}
                  type="tel"
                  label="Teléfono (Opcional)"
                  placeholder="5512345678"
                  maxLength={10}
                />
              </div>

              {/* Selector de Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color para Calendario
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-12 h-12 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <Palette className="w-5 h-5 text-white" />
                  </button>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Color seleccionado: <span className="font-mono font-medium">{selectedColor}</span>
                    </p>
                  </div>
                </div>

                {/* Paleta de colores */}
                {showColorPicker && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-6 gap-2">
                      {COLORES_CALENDARIO.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorSelect(color)}
                          className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                            selectedColor === color
                              ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {errors.color_calendario && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.color_calendario.message}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción (Opcional)
                    </label>
                    <textarea
                      {...field}
                      id="descripcion"
                      rows={3}
                      placeholder="Información adicional sobre el profesional..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    {errors.descripcion && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.descripcion.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Nov 2025: Sección Acceso al Sistema y Módulos */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-gray-500" />
                  <h4 className="font-medium text-gray-900">Acceso al Sistema</h4>
                </div>

                {/* Estado actual: Usuario vinculado, invitación pendiente, o info */}
                {profesionalData?.usuario_id ? (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Usuario vinculado</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      {profesionalData.usuario_nombre || profesionalData.usuario_email}
                    </p>
                  </div>
                ) : isEditMode ? (
                  /* Sección de Invitación (solo en modo edición) */
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Estado de invitación
                      </span>
                    </label>

                    {/* Mostrar invitación actual si existe */}
                    {invitacionActual && invitacionActual.estado === 'pendiente' ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-700">
                            <Clock className="h-5 w-5" />
                            <span className="font-medium">Invitación pendiente</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleReenviarInvitacion}
                              disabled={enviandoInvitacion}
                              className="p-1 text-amber-600 hover:text-amber-800"
                              title="Reenviar"
                            >
                              <RefreshCw className={`h-4 w-4 ${enviandoInvitacion ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelarInvitacion}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Cancelar"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-amber-600 mt-1">
                          Enviada a: {invitacionActual.email}
                        </p>
                        <p className="text-xs text-amber-500 mt-1">
                          Expira: {new Date(invitacionActual.expira_en).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    ) : invitacionActual && invitacionActual.estado === 'aceptada' ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Invitación aceptada</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          {invitacionActual.email}
                        </p>
                      </div>
                    ) : (
                      /* Formulario para nueva invitación (si no hay invitación previa) */
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={emailInvitacion}
                          onChange={(e) => setEmailInvitacion(e.target.value)}
                          placeholder="correo@empleado.com"
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleEnviarInvitacion}
                          disabled={enviandoInvitacion || !emailInvitacion}
                          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {enviandoInvitacion ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Enviar
                        </button>
                      </div>
                    )}

                    <p className="mt-2 text-xs text-gray-500">
                      El empleado recibirá un email con un enlace para completar su registro.
                    </p>
                  </div>
                ) : (
                  /* Modo creación: mensaje informativo */
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Mail className="h-5 w-5" />
                      <span className="font-medium">Invitación automática</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      Al guardar, se enviará automáticamente un email de invitación al correo ingresado.
                    </p>
                  </div>
                )}

                {/* Módulos Habilitados */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Módulos habilitados
                  </label>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modulosAcceso.agendamiento}
                        onChange={(e) => setModulosAcceso({
                          ...modulosAcceso,
                          agendamiento: e.target.checked
                        })}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Agendamiento</span>
                        <p className="text-xs text-gray-500">Puede atender citas de clientes</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modulosAcceso.pos}
                        onChange={(e) => setModulosAcceso({
                          ...modulosAcceso,
                          pos: e.target.checked
                        })}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Punto de Venta</span>
                        <p className="text-xs text-gray-500">Puede registrar ventas como vendedor</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modulosAcceso.inventario}
                        onChange={(e) => setModulosAcceso({
                          ...modulosAcceso,
                          inventario: e.target.checked
                        })}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Inventario</span>
                        <p className="text-xs text-gray-500">Puede gestionar productos y stock</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Estado Activo */}
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                    <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                      Profesional activo
                    </label>
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
                isLoading={crearMutation.isPending || actualizarMutation.isPending || uploadMutation.isPending}
                disabled={crearMutation.isPending || actualizarMutation.isPending || uploadMutation.isPending}
              >
                {uploadMutation.isPending
                  ? 'Subiendo foto...'
                  : isEditMode
                    ? actualizarMutation.isPending
                      ? 'Actualizando...'
                      : 'Actualizar Profesional'
                    : crearMutation.isPending
                      ? 'Creando...'
                      : 'Crear Profesional'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

export default ProfesionalFormModal;
