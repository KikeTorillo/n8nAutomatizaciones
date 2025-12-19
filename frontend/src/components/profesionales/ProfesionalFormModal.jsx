import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Palette, Mail, Settings, Send, Clock, CheckCircle, XCircle, RefreshCw,
  Camera, X, Loader2, Building2, Briefcase, UserCheck, Tag, Calendar, MapPin, Phone, ChevronDown
} from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import FormField from '@/components/forms/FormField';
import {
  useCrearProfesional,
  useActualizarProfesional,
  useProfesional,
  useActualizarModulos,
  useSincronizarCategorias,
  TIPOS_EMPLEADO,
  ESTADOS_LABORALES,
  TIPOS_CONTRATACION,
  GENEROS,
  ESTADOS_CIVILES
} from '@/hooks/useProfesionales';
import { useToast } from '@/hooks/useToast';
import { invitacionesApi } from '@/services/api/endpoints';
import { useUploadArchivo } from '@/hooks/useStorage';
import { DepartamentoSelect, PuestoSelect, SupervisorSelect, CategoriasSelect } from '@/components/organizacion';

/**
 * Colores predefinidos para el calendario
 * El primero es el color de marca Nexo (#753572) como default
 */
const COLORES_CALENDARIO = [
  '#753572', // Nexo Purple (color de marca - default)
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
  '#84cc16', // lime-500
];

/**
 * Schema de validación Zod para CREAR profesional
 * Dic 2025: Ampliado con campos de gestión de empleados
 */
const profesionalCreateSchema = z.object({
  // === Datos Básicos ===
  nombre_completo: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  email: z.string({
    required_error: 'El email es obligatorio para enviar la invitación',
  }).email('Email inválido').max(100, 'Máximo 100 caracteres'),
  telefono: z.string().regex(/^[1-9]\d{9}$/, 'El teléfono debe ser válido de 10 dígitos (ej: 5512345678)').optional().or(z.literal('')),
  color_calendario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').default('#753572'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  activo: z.boolean().default(true),

  // === Datos Personales (Dic 2025) ===
  codigo: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  genero: z.enum(['masculino', 'femenino', 'otro', 'no_especificado']).optional(),
  estado_civil: z.enum(['soltero', 'casado', 'divorciado', 'viudo', 'union_libre']).optional(),
  direccion: z.string().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  contacto_emergencia_nombre: z.string().max(100).optional().or(z.literal('')),
  contacto_emergencia_telefono: z.string().regex(/^[1-9]\d{9}$/, 'Teléfono inválido').optional().or(z.literal('')),

  // === Clasificación Laboral (Dic 2025) ===
  tipo: z.enum(['operativo', 'administrativo', 'gerencial', 'ventas']).optional(),
  estado: z.enum(['activo', 'vacaciones', 'incapacidad', 'suspendido', 'baja']).default('activo'),
  tipo_contratacion: z.enum(['tiempo_completo', 'medio_tiempo', 'temporal', 'contrato', 'freelance']).optional(),
  fecha_contratacion: z.string().optional().or(z.literal('')),

  // === Estructura Organizacional (Dic 2025) ===
  departamento_id: z.number().int().positive().optional().nullable(),
  puesto_id: z.number().int().positive().optional().nullable(),
  supervisor_id: z.number().int().positive().optional().nullable(),
});

/**
 * Schema de validación Zod para EDITAR profesional
 * Dic 2025: Ampliado con campos de gestión de empleados
 */
const profesionalEditSchema = z.object({
  // === Datos Básicos ===
  nombre_completo: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres').optional(),
  email: z.string().email('Email inválido').max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  telefono: z.string().regex(/^[1-9]\d{9}$/, 'El teléfono debe ser válido de 10 dígitos (ej: 5512345678)').optional().or(z.literal('')),
  color_calendario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').optional(),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  activo: z.boolean().optional(),

  // === Datos Personales (Dic 2025) ===
  codigo: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  genero: z.enum(['masculino', 'femenino', 'otro', 'no_especificado']).optional(),
  estado_civil: z.enum(['soltero', 'casado', 'divorciado', 'viudo', 'union_libre']).optional(),
  direccion: z.string().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  contacto_emergencia_nombre: z.string().max(100).optional().or(z.literal('')),
  contacto_emergencia_telefono: z.string().regex(/^[1-9]\d{9}$/, 'Teléfono inválido').optional().or(z.literal('')),

  // === Clasificación Laboral (Dic 2025) ===
  tipo: z.enum(['operativo', 'administrativo', 'gerencial', 'ventas']).optional(),
  estado: z.enum(['activo', 'vacaciones', 'incapacidad', 'suspendido', 'baja']).optional(),
  tipo_contratacion: z.enum(['tiempo_completo', 'medio_tiempo', 'temporal', 'contrato', 'freelance']).optional(),
  fecha_contratacion: z.string().optional().or(z.literal('')),

  // === Estructura Organizacional (Dic 2025) ===
  departamento_id: z.number().int().positive().optional().nullable(),
  puesto_id: z.number().int().positive().optional().nullable(),
  supervisor_id: z.number().int().positive().optional().nullable(),
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
  const [confirmarCancelarInvitacion, setConfirmarCancelarInvitacion] = useState(false);
  const uploadMutation = useUploadArchivo();

  // Dic 2025: Secciones colapsables y categorías
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    datosPersonales: false,
    clasificacion: true,
    organizacion: true,
    acceso: true,
  });
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const sincronizarCategoriasMutation = useSincronizarCategorias();

  const isEditMode = mode === 'edit';
  const profesionalId = profesional?.id;

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
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditMode ? profesionalEditSchema : profesionalCreateSchema),
    defaultValues: isEditMode
      ? {}
      : {
          // Datos básicos
          nombre_completo: '',
          email: '',
          telefono: '',
          color_calendario: COLORES_CALENDARIO[0],
          descripcion: '',
          activo: true,
          // Datos personales (Dic 2025)
          codigo: '',
          genero: undefined,
          estado_civil: undefined,
          direccion: '',
          contacto_emergencia_nombre: '',
          contacto_emergencia_telefono: '',
          // Clasificación laboral (Dic 2025)
          tipo: undefined,
          estado: 'activo',
          tipo_contratacion: undefined,
          fecha_contratacion: '',
          // Estructura organizacional (Dic 2025)
          departamento_id: undefined,
          puesto_id: undefined,
          supervisor_id: undefined,
        },
  });

  // Watch para departamento (filtrar puestos)
  const departamentoSeleccionado = watch('departamento_id');

  // Reset formulario cuando cambia el modo (create/edit)
  useEffect(() => {
    if (isOpen) {
      if (!isEditMode) {
        // Modo creación: resetear a valores vacíos
        reset({
          nombre_completo: '',
          email: '',
          telefono: '',
          color_calendario: COLORES_CALENDARIO[0],
          descripcion: '',
          activo: true,
          // Nuevos campos Dic 2025
          codigo: '',
          genero: undefined,
          estado_civil: undefined,
          direccion: '',
          contacto_emergencia_nombre: '',
          contacto_emergencia_telefono: '',
          tipo: undefined,
          estado: 'activo',
          tipo_contratacion: undefined,
          fecha_contratacion: '',
          departamento_id: undefined,
          puesto_id: undefined,
          supervisor_id: undefined,
        });
        setSelectedColor(COLORES_CALENDARIO[0]);
        setCategoriasSeleccionadas([]);
      }
    }
  }, [isOpen, isEditMode, profesionalId, reset]);

  // Pre-cargar datos del profesional en modo edición
  useEffect(() => {
    if (isEditMode && profesionalData && isOpen) {
      reset({
        // Datos básicos
        nombre_completo: profesionalData.nombre_completo || '',
        email: profesionalData.email || '',
        telefono: profesionalData.telefono || '',
        color_calendario: profesionalData.color_calendario || COLORES_CALENDARIO[0],
        descripcion: profesionalData.biografia || '',
        activo: profesionalData.activo !== undefined ? profesionalData.activo : true,
        // Datos personales (Dic 2025)
        codigo: profesionalData.codigo || '',
        genero: profesionalData.genero || undefined,
        estado_civil: profesionalData.estado_civil || undefined,
        direccion: profesionalData.direccion || '',
        contacto_emergencia_nombre: profesionalData.contacto_emergencia_nombre || '',
        contacto_emergencia_telefono: profesionalData.contacto_emergencia_telefono || '',
        // Clasificación laboral (Dic 2025)
        tipo: profesionalData.tipo || undefined,
        estado: profesionalData.estado || 'activo',
        tipo_contratacion: profesionalData.tipo_contratacion || undefined,
        fecha_contratacion: profesionalData.fecha_contratacion?.split('T')[0] || '',
        // Estructura organizacional (Dic 2025)
        departamento_id: profesionalData.departamento_id || undefined,
        puesto_id: profesionalData.puesto_id || undefined,
        supervisor_id: profesionalData.supervisor_id || undefined,
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

      // Dic 2025: Cargar categorías
      if (profesionalData.categorias && Array.isArray(profesionalData.categorias)) {
        setCategoriasSeleccionadas(profesionalData.categorias.map(c => c.id));
      } else {
        setCategoriasSeleccionadas([]);
      }
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
      // Dic 2025: Limpiar foto y categorías
      setFotoFile(null);
      setFotoPreview(null);
      setFotoUrl(null);
      setCategoriasSeleccionadas([]);
      setSeccionesAbiertas({
        datosPersonales: false,
        clasificacion: true,
        organizacion: true,
        acceso: true,
      });
    }
  }, [isOpen, reset]);

  // Toggle para secciones colapsables
  const toggleSeccion = (seccion) => {
    setSeccionesAbiertas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }));
  };

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

    try {
      await invitacionesApi.cancelar(invitacionActual.id);
      setInvitacionActual(null);
      setConfirmarCancelarInvitacion(false);
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
        // Datos básicos
        nombre_completo: data.nombre_completo?.trim(),
        email: data.email?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        color_calendario: data.color_calendario,
        biografia: data.descripcion?.trim() || undefined,
        activo: data.activo,
        // Datos personales (Dic 2025)
        codigo: data.codigo?.trim() || undefined,
        genero: data.genero || undefined,
        estado_civil: data.estado_civil || undefined,
        direccion: data.direccion?.trim() || undefined,
        contacto_emergencia_nombre: data.contacto_emergencia_nombre?.trim() || undefined,
        contacto_emergencia_telefono: data.contacto_emergencia_telefono?.trim() || undefined,
        // Clasificación laboral (Dic 2025)
        tipo: data.tipo || undefined,
        estado: data.estado || 'activo',
        tipo_contratacion: data.tipo_contratacion || undefined,
        fecha_contratacion: data.fecha_contratacion || undefined,
        // Estructura organizacional (Dic 2025)
        departamento_id: data.departamento_id || null,
        puesto_id: data.puesto_id || null,
        supervisor_id: data.supervisor_id || null,
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

        // Dic 2025: Sincronizar categorías si cambiaron
        const categoriasOriginales = (profesionalData.categorias || []).map(c => c.id).sort();
        const categoriasNuevas = [...categoriasSeleccionadas].sort();
        const categoriasCambiaron = JSON.stringify(categoriasOriginales) !== JSON.stringify(categoriasNuevas);

        if (categoriasCambiaron) {
          await sincronizarCategoriasMutation.mutateAsync({
            profesionalId,
            categoriaIds: categoriasSeleccionadas
          });
        }

        toast.success('Profesional actualizado exitosamente');
      } else {
        // Modo creación: crear profesional y enviar invitación automáticamente
        const resultado = await crearMutation.mutateAsync(sanitized);
        const nuevoProfesionalId = resultado.data?.id || resultado.id;

        // Sincronizar categorías si hay alguna seleccionada
        if (nuevoProfesionalId && categoriasSeleccionadas.length > 0) {
          try {
            await sincronizarCategoriasMutation.mutateAsync({
              profesionalId: nuevoProfesionalId,
              categoriaIds: categoriasSeleccionadas
            });
          } catch (catErr) {
            console.error('Error sincronizando categorías:', catErr);
          }
        }

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
      // Dic 2025: Limpiar foto y categorías
      setFotoFile(null);
      setFotoPreview(null);
      setFotoUrl(null);
      setCategoriasSeleccionadas([]);
    } catch (error) {
      toast.error(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} profesional`);
    }
  };

  // Loading state durante fetch de datos
  const isLoadingData = isEditMode && loadingProfesional;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Profesional' : 'Nuevo Profesional'}
      subtitle={isEditMode ? 'Modifica los datos del profesional' : 'Completa la información del profesional'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Foto de perfil */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
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
            <label className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full p-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm">
              <Camera className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="sr-only"
                disabled={uploadMutation.isPending}
              />
            </label>
            {uploadMutation.isPending && (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-full flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-primary-600 dark:text-primary-400 animate-spin" />
              </div>
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Foto de perfil (opcional)
          </div>
        </div>

        {/* Loading state durante fetch de datos en modo edición */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando datos del profesional...</p>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color para Calendario
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center justify-center"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <Palette className="w-5 h-5 text-white" />
                  </button>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Color seleccionado: <span className="font-mono font-medium">{selectedColor}</span>
                    </p>
                  </div>
                </div>

                {/* Paleta de colores */}
                {showColorPicker && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="grid grid-cols-6 gap-2">
                      {COLORES_CALENDARIO.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorSelect(color)}
                          className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                            selectedColor === color
                              ? 'border-gray-900 dark:border-white ring-2 ring-gray-900 dark:ring-white ring-offset-2 dark:ring-offset-gray-800'
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
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.color_calendario.message}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label="Descripción (Opcional)"
                    placeholder="Información adicional sobre el profesional..."
                    rows={3}
                    error={errors.descripcion?.message}
                  />
                )}
              />

              {/* ========== SECCIÓN: Clasificación Laboral (Dic 2025) ========== */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => toggleSeccion('clasificacion')}
                  className="w-full flex items-center justify-between gap-2 mb-4"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Clasificación Laboral</h4>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${seccionesAbiertas.clasificacion ? 'rotate-180' : ''}`} />
                </button>

                {seccionesAbiertas.clasificacion && (
                  <div className="space-y-4 pl-7">
                    {/* Código de empleado */}
                    <FormField
                      name="codigo"
                      control={control}
                      label="Código de Empleado"
                      placeholder="EMP-001"
                      helperText="Identificador único interno (opcional)"
                    />

                    {/* Tipo de empleado y Estado laboral */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name="tipo"
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Select
                            {...field}
                            label="Tipo de Empleado"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value || undefined)}
                            options={Object.entries(TIPOS_EMPLEADO).map(([key, val]) => ({
                              value: key,
                              label: val.label,
                            }))}
                            placeholder="Selecciona tipo"
                            error={errors.tipo?.message}
                          />
                        )}
                      />

                      <Controller
                        name="estado"
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Select
                            {...field}
                            label="Estado Laboral"
                            value={value || 'activo'}
                            onChange={(e) => onChange(e.target.value || 'activo')}
                            options={Object.entries(ESTADOS_LABORALES).map(([key, val]) => ({
                              value: key,
                              label: val.label,
                            }))}
                            error={errors.estado?.message}
                          />
                        )}
                      />
                    </div>

                    {/* Tipo de contratación y Fecha */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name="tipo_contratacion"
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Select
                            {...field}
                            label="Tipo de Contratación"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value || undefined)}
                            options={Object.entries(TIPOS_CONTRATACION).map(([key, val]) => ({
                              value: key,
                              label: val.label,
                            }))}
                            placeholder="Selecciona tipo"
                            error={errors.tipo_contratacion?.message}
                          />
                        )}
                      />

                      <FormField
                        name="fecha_contratacion"
                        control={control}
                        type="date"
                        label="Fecha de Contratación"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ========== SECCIÓN: Estructura Organizacional (Dic 2025) ========== */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => toggleSeccion('organizacion')}
                  className="w-full flex items-center justify-between gap-2 mb-4"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Estructura Organizacional</h4>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${seccionesAbiertas.organizacion ? 'rotate-180' : ''}`} />
                </button>

                {seccionesAbiertas.organizacion && (
                  <div className="space-y-4 pl-7">
                    {/* Departamento y Puesto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name="departamento_id"
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <DepartamentoSelect
                            {...field}
                            value={value?.toString() || ''}
                            onChange={(e) => {
                              const newVal = e.target.value ? parseInt(e.target.value, 10) : undefined;
                              onChange(newVal);
                              // Limpiar puesto si cambia departamento
                              if (newVal !== value) {
                                setValue('puesto_id', undefined);
                              }
                            }}
                            error={errors.departamento_id?.message}
                          />
                        )}
                      />

                      <Controller
                        name="puesto_id"
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <PuestoSelect
                            {...field}
                            value={value?.toString() || ''}
                            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            departamentoId={departamentoSeleccionado}
                            error={errors.puesto_id?.message}
                          />
                        )}
                      />
                    </div>

                    {/* Supervisor */}
                    <Controller
                      name="supervisor_id"
                      control={control}
                      render={({ field: { value, onChange, ...field } }) => (
                        <SupervisorSelect
                          {...field}
                          value={value?.toString() || ''}
                          onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                          excludeId={profesionalId}
                          departamentoId={departamentoSeleccionado}
                          error={errors.supervisor_id?.message}
                        />
                      )}
                    />

                    {/* Categorías */}
                    <CategoriasSelect
                      label="Categorías"
                      value={categoriasSeleccionadas}
                      onChange={setCategoriasSeleccionadas}
                      helper="Asigna especialidades, niveles, áreas o certificaciones"
                    />
                  </div>
                )}
              </div>

              {/* ========== SECCIÓN: Datos Personales (Dic 2025) - Colapsada ========== */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosPersonales')}
                  className="w-full flex items-center justify-between gap-2 mb-4"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Datos Personales</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">(Opcional)</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${seccionesAbiertas.datosPersonales ? 'rotate-180' : ''}`} />
                </button>

                {seccionesAbiertas.datosPersonales && (
                  <div className="space-y-4 pl-7">
                    {/* Género y Estado Civil */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name="genero"
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Select
                            {...field}
                            label="Género"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value || undefined)}
                            options={Object.entries(GENEROS).map(([key, val]) => ({
                              value: key,
                              label: val.label,
                            }))}
                            placeholder="Selecciona género"
                          />
                        )}
                      />

                      <Controller
                        name="estado_civil"
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Select
                            {...field}
                            label="Estado Civil"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value || undefined)}
                            options={Object.entries(ESTADOS_CIVILES).map(([key, val]) => ({
                              value: key,
                              label: val.label,
                            }))}
                            placeholder="Selecciona estado civil"
                          />
                        )}
                      />
                    </div>

                    {/* Dirección */}
                    <FormField
                      name="direccion"
                      control={control}
                      label="Dirección"
                      placeholder="Calle, número, colonia, ciudad..."
                    />

                    {/* Contacto de Emergencia */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Contacto de Emergencia</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          name="contacto_emergencia_nombre"
                          control={control}
                          label="Nombre"
                          placeholder="Nombre del contacto"
                        />
                        <FormField
                          name="contacto_emergencia_telefono"
                          control={control}
                          type="tel"
                          label="Teléfono"
                          placeholder="5512345678"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Nov 2025: Sección Acceso al Sistema y Módulos */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Acceso al Sistema</h4>
                </div>

                {/* Estado actual: Usuario vinculado, invitación pendiente, o info */}
                {profesionalData?.usuario_id ? (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Usuario vinculado</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {profesionalData.usuario_nombre || profesionalData.usuario_email}
                    </p>
                  </div>
                ) : isEditMode ? (
                  /* Sección de Invitación (solo en modo edición) */
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Estado de invitación
                      </span>
                    </label>

                    {/* Mostrar invitación actual si existe */}
                    {invitacionActual && invitacionActual.estado === 'pendiente' ? (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <Clock className="h-5 w-5" />
                            <span className="font-medium">Invitación pendiente</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleReenviarInvitacion}
                              disabled={enviandoInvitacion}
                              className="p-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                              title="Reenviar"
                            >
                              <RefreshCw className={`h-4 w-4 ${enviandoInvitacion ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmarCancelarInvitacion(true)}
                              className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              title="Cancelar"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                          Enviada a: {invitacionActual.email}
                        </p>
                        <p className="text-xs text-amber-500 dark:text-amber-500 mt-1">
                          Expira: {new Date(invitacionActual.expira_en).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    ) : invitacionActual && invitacionActual.estado === 'aceptada' ? (
                      <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Invitación aceptada</span>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          {invitacionActual.email}
                        </p>
                      </div>
                    ) : (
                      /* Formulario para nueva invitación (si no hay invitación previa) */
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="email"
                            value={emailInvitacion}
                            onChange={(e) => setEmailInvitacion(e.target.value)}
                            placeholder="correo@empleado.com"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleEnviarInvitacion}
                          disabled={enviandoInvitacion || !emailInvitacion}
                          isLoading={enviandoInvitacion}
                        >
                          {!enviandoInvitacion && <Send className="h-4 w-4 mr-1" />}
                          Enviar
                        </Button>
                      </div>
                    )}

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      El empleado recibirá un email con un enlace para completar su registro.
                    </p>
                  </div>
                ) : (
                  /* Modo creación: mensaje informativo */
                  <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg">
                    <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400">
                      <Mail className="h-5 w-5" />
                      <span className="font-medium">Invitación automática</span>
                    </div>
                    <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                      Al guardar, se enviará automáticamente un email de invitación al correo ingresado.
                    </p>
                  </div>
                )}

                {/* Módulos Habilitados */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Módulos habilitados
                  </label>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <Checkbox
                      label="Agendamiento"
                      description="Puede atender citas de clientes"
                      checked={modulosAcceso.agendamiento}
                      onChange={(e) => setModulosAcceso({
                        ...modulosAcceso,
                        agendamiento: e.target.checked
                      })}
                    />

                    <Checkbox
                      label="Punto de Venta"
                      description="Puede registrar ventas como vendedor"
                      checked={modulosAcceso.pos}
                      onChange={(e) => setModulosAcceso({
                        ...modulosAcceso,
                        pos: e.target.checked
                      })}
                    />

                    <Checkbox
                      label="Inventario"
                      description="Puede gestionar productos y stock"
                      checked={modulosAcceso.inventario}
                      onChange={(e) => setModulosAcceso({
                        ...modulosAcceso,
                        inventario: e.target.checked
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Estado Activo */}
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="Profesional activo"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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

      {/* Modal de confirmación para cancelar invitación */}
      <ConfirmDialog
        isOpen={confirmarCancelarInvitacion}
        onClose={() => setConfirmarCancelarInvitacion(false)}
        onConfirm={handleCancelarInvitacion}
        title="Cancelar invitación"
        message="¿Estás seguro de cancelar esta invitación? El usuario no podrá registrarse con este enlace."
        confirmText="Cancelar invitación"
        cancelText="Volver"
        variant="warning"
      />
    </Drawer>
  );
}

export default ProfesionalFormModal;
