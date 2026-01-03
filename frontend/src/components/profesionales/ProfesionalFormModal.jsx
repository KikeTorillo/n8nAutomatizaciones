import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Palette, Mail, Settings, Send, Clock, CheckCircle, XCircle, RefreshCw,
  Camera, X, Loader2, Building2, Briefcase, UserCheck, Tag, Calendar, MapPin, Phone, ChevronDown, Link2,
  Wallet, Award, Globe
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
  useSincronizarCategorias,
  ESTADOS_LABORALES,
  TIPOS_CONTRATACION,
  GENEROS,
  ESTADOS_CIVILES,
  FORMAS_PAGO,
  IDIOMAS_DISPONIBLES
} from '@/hooks/useProfesionales';
import useAuthStore from '@/store/authStore';
import { useCurrency } from '@/hooks/useCurrency';
import MultiSelect from '@/components/ui/MultiSelect';
import { useCambiarRolUsuario, useUsuariosSinProfesional, ROLES_USUARIO } from '@/hooks/useUsuarios';
import { useToast } from '@/hooks/useToast';
import { invitacionesApi } from '@/services/api/endpoints';
import { useUploadArchivo } from '@/hooks/useStorage';
import { DepartamentoSelect, PuestoSelect, SupervisorSelect, CategoriasSelect } from '@/components/organizacion';
import DocumentosEmpleadoSection from './DocumentosEmpleadoSection';
import CuentasBancariasSection from './CuentasBancariasSection';
import ExperienciaLaboralSection from './ExperienciaLaboralSection';
import EducacionFormalSection from './EducacionFormalSection';
import HabilidadesSection from './HabilidadesSection';
import OnboardingProgresoSection from './OnboardingProgresoSection';

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
 * Roles disponibles para asignar en invitación
 * Dic 2025: Selector de rol en formulario de profesional
 */
const ROLES_INVITACION = [
  { value: 'empleado', label: 'Empleado', description: 'Acceso limitado según permisos asignados' },
  { value: 'propietario', label: 'Propietario', description: 'Acceso operativo completo' },
  { value: 'admin', label: 'Administrador', description: 'Acceso total a la organización' },
];

/**
 * Schema de validación Zod para CREAR profesional
 * Dic 2025: Ampliado con campos de gestión de empleados
 */
const profesionalCreateSchema = z.object({
  // === Datos Básicos ===
  nombre_completo: z.string().min(3, 'Mínimo 3 caracteres').max(150, 'Máximo 150 caracteres'),
  // Email: opcional si se vincula a usuario existente (Dic 2025)
  email: z.string().email('Email inválido').max(150, 'Máximo 150 caracteres').optional().or(z.literal('')),
  telefono: z.string().regex(/^[1-9]\d{9}$/, 'El teléfono debe ser válido de 10 dígitos (ej: 5512345678)').optional().or(z.literal('')),
  color_calendario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').default('#753572'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  activo: z.boolean().default(true),

  // === Datos Personales (Dic 2025) ===
  codigo: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  genero: z.enum(['masculino', 'femenino', 'otro', 'no_especificado']).optional(),
  estado_civil: z.enum(['soltero', 'casado', 'divorciado', 'viudo', 'union_libre']).optional(),
  direccion: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  contacto_emergencia_nombre: z.string().max(100).optional().or(z.literal('')),
  contacto_emergencia_telefono: z.string().regex(/^[1-9]\d{9}$/, 'Teléfono inválido').optional().or(z.literal('')),
  // Nuevos campos Ene 2026
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  documento_identidad: z.string().max(30, 'Máximo 30 caracteres').optional().or(z.literal('')),

  // === Información Personal Adicional (Fase 1 - Enero 2026) ===
  numero_pasaporte: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  numero_seguro_social: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  nacionalidad: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  lugar_nacimiento_ciudad: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  lugar_nacimiento_pais: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  email_privado: z.string().email('Email inválido').max(150, 'Máximo 150 caracteres').optional().or(z.literal('')),
  telefono_privado: z.string().regex(/^[1-9]\d{9}$/, 'Teléfono inválido').optional().or(z.literal('')),
  distancia_casa_trabajo_km: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().min(0).max(9999).optional()
  ),
  hijos_dependientes: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().int().min(0).max(50).optional()
  ),

  // === Configuración del Sistema (Fase 1 - Enero 2026) ===
  zona_horaria: z.string().max(50).optional().default('America/Mexico_City'),
  codigo_nip: z.string().max(10).regex(/^[0-9]*$/, 'Solo números').optional().or(z.literal('')),
  id_credencial: z.string().max(50).optional().or(z.literal('')),

  // === Clasificación Laboral (Dic 2025) ===
  estado: z.enum(['activo', 'vacaciones', 'incapacidad', 'suspendido', 'baja']).default('activo'),
  tipo_contratacion: z.enum(['tiempo_completo', 'medio_tiempo', 'temporal', 'contrato', 'freelance']).optional(),
  fecha_contratacion: z.string().optional().or(z.literal('')),

  // === Estructura Organizacional (Dic 2025) ===
  departamento_id: z.number().int().positive().optional().nullable(),
  puesto_id: z.number().int().positive().optional().nullable(),
  supervisor_id: z.number().int().positive().optional().nullable(),

  // === Información Profesional (Ene 2026) ===
  años_experiencia: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().int().min(0).max(70).optional()
  ),
  idiomas: z.array(z.string()).optional().default([]),
  disponible_online: z.boolean().optional().default(false),
  licencias_profesionales: z.string().optional().or(z.literal('')),

  // === Compensación (Ene 2026) - Solo admin/propietario ===
  salario_base: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().min(0).optional()
  ),
  // comision_porcentaje eliminado - se configura en Módulo Comisiones por servicio/producto
  forma_pago: z.enum(['comision', 'salario', 'mixto']).optional(),

  // === Acceso al Sistema (Dic 2025) ===
  rol_invitacion: z.enum(['empleado', 'propietario', 'admin']).default('empleado'),
});

/**
 * Schema de validación Zod para EDITAR profesional
 * Dic 2025: Ampliado con campos de gestión de empleados
 */
const profesionalEditSchema = z.object({
  // === Datos Básicos ===
  nombre_completo: z.string().min(3, 'Mínimo 3 caracteres').max(150, 'Máximo 150 caracteres').optional(),
  email: z.string().email('Email inválido').max(150, 'Máximo 150 caracteres').optional().or(z.literal('')),
  telefono: z.string().regex(/^[1-9]\d{9}$/, 'El teléfono debe ser válido de 10 dígitos (ej: 5512345678)').optional().or(z.literal('')),
  color_calendario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').optional(),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  activo: z.boolean().optional(),

  // === Datos Personales (Dic 2025) ===
  codigo: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  genero: z.enum(['masculino', 'femenino', 'otro', 'no_especificado']).optional(),
  estado_civil: z.enum(['soltero', 'casado', 'divorciado', 'viudo', 'union_libre']).optional(),
  direccion: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  contacto_emergencia_nombre: z.string().max(100).optional().or(z.literal('')),
  contacto_emergencia_telefono: z.string().regex(/^[1-9]\d{9}$/, 'Teléfono inválido').optional().or(z.literal('')),
  // Nuevos campos Ene 2026
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  documento_identidad: z.string().max(30, 'Máximo 30 caracteres').optional().or(z.literal('')),

  // === Información Personal Adicional (Fase 1 - Enero 2026) ===
  numero_pasaporte: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  numero_seguro_social: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  nacionalidad: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  lugar_nacimiento_ciudad: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  lugar_nacimiento_pais: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  email_privado: z.string().email('Email inválido').max(150, 'Máximo 150 caracteres').optional().or(z.literal('')),
  telefono_privado: z.string().regex(/^[1-9]\d{9}$/, 'Teléfono inválido').optional().or(z.literal('')),
  distancia_casa_trabajo_km: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().min(0).max(9999).optional()
  ),
  hijos_dependientes: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().int().min(0).max(50).optional()
  ),

  // === Configuración del Sistema (Fase 1 - Enero 2026) ===
  zona_horaria: z.string().max(50).optional(),
  codigo_nip: z.string().max(10).regex(/^[0-9]*$/, 'Solo números').optional().or(z.literal('')),
  id_credencial: z.string().max(50).optional().or(z.literal('')),

  // === Clasificación Laboral (Dic 2025) ===
  estado: z.enum(['activo', 'vacaciones', 'incapacidad', 'suspendido', 'baja']).optional(),
  tipo_contratacion: z.enum(['tiempo_completo', 'medio_tiempo', 'temporal', 'contrato', 'freelance']).optional(),
  fecha_contratacion: z.string().optional().or(z.literal('')),

  // === Estructura Organizacional (Dic 2025) ===
  departamento_id: z.number().int().positive().optional().nullable(),
  puesto_id: z.number().int().positive().optional().nullable(),
  supervisor_id: z.number().int().positive().optional().nullable(),

  // === Información Profesional (Ene 2026) ===
  años_experiencia: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().int().min(0).max(70).optional()
  ),
  idiomas: z.array(z.string()).optional().default([]),
  disponible_online: z.boolean().optional().default(false),
  licencias_profesionales: z.string().optional().or(z.literal('')),

  // === Compensación (Ene 2026) - Solo admin/propietario ===
  salario_base: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().min(0).optional()
  ),
  // comision_porcentaje eliminado - se configura en Módulo Comisiones por servicio/producto
  forma_pago: z.enum(['comision', 'salario', 'mixto']).optional(),
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

  // Estado para invitación
  const [emailInvitacion, setEmailInvitacion] = useState('');
  const [invitacionActual, setInvitacionActual] = useState(null);
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false);

  // Dic 2025: Modo de acceso al crear (invitacion vs vincular usuario existente)
  const [modoAcceso, setModoAcceso] = useState('invitacion'); // 'invitacion' | 'vincular_usuario'
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  // Dic 2025: Estado para foto de perfil
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [confirmarCancelarInvitacion, setConfirmarCancelarInvitacion] = useState(false);
  const uploadMutation = useUploadArchivo();

  // Dic 2025: Secciones colapsables y categorías
  // Ene 2026: Agregadas secciones infoProfesional y compensacion
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    datosPersonales: false,
    clasificacion: true,
    organizacion: true,
    infoProfesional: false,  // Nueva: Años experiencia, idiomas, disponible online
    compensacion: false,     // Nueva: Salario, comisión, forma de pago (solo admin)
    acceso: true,
  });

  // Ene 2026: Verificar rol para mostrar sección compensación
  const { user } = useAuthStore();
  const puedeVerCompensacion = ['admin', 'propietario', 'super_admin'].includes(user?.rol);
  const { symbol } = useCurrency();
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const sincronizarCategoriasMutation = useSincronizarCategorias();

  const isEditMode = mode === 'edit';
  const profesionalId = profesional?.id;

  // Fetch datos del profesional en modo edición
  const { data: profesionalData, isLoading: loadingProfesional } = useProfesional(profesionalId);

  // Hooks de mutación
  const crearMutation = useCrearProfesional();
  const actualizarMutation = useActualizarProfesional();
  const cambiarRolMutation = useCambiarRolUsuario();

  // Dic 2025: Usuarios sin profesional (para vincular)
  const { data: usuariosSinProfesional = [], isLoading: loadingUsuarios } = useUsuariosSinProfesional();

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
          // Nuevos campos Ene 2026
          fecha_nacimiento: '',
          documento_identidad: '',
          // Clasificación laboral (Dic 2025)
          estado: 'activo',
          tipo_contratacion: undefined,
          fecha_contratacion: '',
          // Estructura organizacional (Dic 2025)
          departamento_id: undefined,
          puesto_id: undefined,
          supervisor_id: undefined,
          // Información Profesional (Ene 2026)
          años_experiencia: undefined,
          idiomas: [],
          disponible_online: false,
          licencias_profesionales: '',
          // Compensación (Ene 2026)
          salario_base: undefined,
            forma_pago: undefined,
          // Acceso al sistema (Dic 2025)
          rol_invitacion: 'empleado',
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
          // Nuevos campos Ene 2026
          fecha_nacimiento: '',
          documento_identidad: '',
          estado: 'activo',
          tipo_contratacion: undefined,
          fecha_contratacion: '',
          departamento_id: undefined,
          puesto_id: undefined,
          supervisor_id: undefined,
          // Información Profesional (Ene 2026)
          años_experiencia: undefined,
          idiomas: [],
          disponible_online: false,
          licencias_profesionales: '',
          // Compensación (Ene 2026)
          salario_base: undefined,
            forma_pago: undefined,
          // Acceso al sistema (Dic 2025)
          rol_invitacion: 'empleado',
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
        // Nuevos campos Ene 2026
        fecha_nacimiento: profesionalData.fecha_nacimiento?.split('T')[0] || '',
        documento_identidad: profesionalData.documento_identidad || '',
        // Clasificación laboral (Dic 2025)
        estado: profesionalData.estado || 'activo',
        tipo_contratacion: profesionalData.tipo_contratacion || undefined,
        fecha_contratacion: profesionalData.fecha_contratacion?.split('T')[0] || '',
        // Estructura organizacional (Dic 2025)
        departamento_id: profesionalData.departamento_id || undefined,
        puesto_id: profesionalData.puesto_id || undefined,
        supervisor_id: profesionalData.supervisor_id || undefined,
        // Información Profesional (Ene 2026)
        años_experiencia: profesionalData.años_experiencia || undefined,
        idiomas: profesionalData.idiomas || [],
        disponible_online: profesionalData.disponible_online || false,
        licencias_profesionales: (() => {
          const val = profesionalData.licencias_profesionales;
          if (!val) return '';
          if (typeof val === 'string') return val;
          // Si es objeto vacío, retornar string vacía
          if (typeof val === 'object' && Object.keys(val).length === 0) return '';
          // Si tiene campo "texto", retornar ese campo directamente
          if (val.texto) return val.texto;
          // Sino, formatear como JSON
          return JSON.stringify(val, null, 2);
        })(),
        // Compensación (Ene 2026)
        salario_base: profesionalData.salario_base || undefined,
        forma_pago: profesionalData.forma_pago || undefined,
      });
      setSelectedColor(profesionalData.color_calendario || COLORES_CALENDARIO[0]);

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
      // Dic 2025: Limpiar foto, categorías y modo acceso
      setFotoFile(null);
      setFotoPreview(null);
      setFotoUrl(null);
      setCategoriasSeleccionadas([]);
      setModoAcceso('invitacion');
      setUsuarioSeleccionado(null);
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
    // Dic 2025: Validar según modo de acceso
    if (!isEditMode) {
      if (modoAcceso === 'invitacion' && !data.email?.trim()) {
        toast.error('El email es obligatorio para enviar la invitación');
        return;
      }
      if (modoAcceso === 'vincular_usuario' && !usuarioSeleccionado) {
        toast.error('Selecciona un usuario para vincular');
        return;
      }
    }

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
        estado: data.estado || 'activo',
        tipo_contratacion: data.tipo_contratacion || undefined,
        fecha_ingreso: data.fecha_contratacion || undefined,
        // Estructura organizacional (Dic 2025)
        departamento_id: data.departamento_id || null,
        puesto_id: data.puesto_id || null,
        supervisor_id: data.supervisor_id || null,
        // Dic 2025: Incluir foto
        foto_url: urlFotoFinal || undefined,
        // NOTA: modulos_acceso eliminado - permisos se gestionan via Configuración > Permisos
        // Nuevos campos Ene 2026
        fecha_nacimiento: data.fecha_nacimiento || undefined,
        documento_identidad: data.documento_identidad?.trim() || undefined,
        // Fase 1 Enero 2026 - Información Personal Adicional
        numero_pasaporte: data.numero_pasaporte?.trim() || undefined,
        numero_seguro_social: data.numero_seguro_social?.trim() || undefined,
        nacionalidad: data.nacionalidad?.trim() || undefined,
        lugar_nacimiento_ciudad: data.lugar_nacimiento_ciudad?.trim() || undefined,
        lugar_nacimiento_pais: data.lugar_nacimiento_pais?.trim() || undefined,
        email_privado: data.email_privado?.trim() || undefined,
        telefono_privado: data.telefono_privado?.trim() || undefined,
        distancia_casa_trabajo_km: data.distancia_casa_trabajo_km ?? undefined,
        hijos_dependientes: data.hijos_dependientes ?? undefined,
        // Fase 1 Enero 2026 - Configuración del Sistema
        zona_horaria: data.zona_horaria || undefined,
        codigo_nip: data.codigo_nip?.trim() || undefined,
        id_credencial: data.id_credencial?.trim() || undefined,
        // Información Profesional (Ene 2026)
        años_experiencia: data.años_experiencia ?? undefined,
        idiomas: data.idiomas?.length > 0 ? data.idiomas : undefined,
        disponible_online: data.disponible_online ?? false,
        licencias_profesionales: (() => {
          const val = data.licencias_profesionales?.trim();
          if (!val || val === '{}') return undefined;
          try {
            return JSON.parse(val);
          } catch {
            // Si no es JSON válido, guardarlo como objeto con campo "texto"
            return { texto: val };
          }
        })(),
        // Compensación (Ene 2026) - Solo si el usuario tiene permisos
        // Nota: comision_porcentaje se configura en Módulo Comisiones por servicio/producto
        ...(puedeVerCompensacion && {
          salario_base: data.salario_base ?? undefined,
          forma_pago: data.forma_pago || undefined,
        }),
      };

      // Si se eliminó la foto existente
      if (fotoUrl === null && profesionalData?.foto_url) {
        sanitized.foto_url = null;
      }

      if (isEditMode) {
        // Modo edición: actualizar datos básicos
        await actualizarMutation.mutateAsync({ id: profesionalId, data: sanitized });

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
        // Modo creación: crear profesional
        // Dic 2025: Si se vincula a usuario existente, pasar usuario_id
        if (modoAcceso === 'vincular_usuario' && usuarioSeleccionado) {
          sanitized.usuario_id = usuarioSeleccionado;
        }

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

        // Dic 2025: Solo enviar invitación si el modo es 'invitacion'
        if (modoAcceso === 'invitacion' && nuevoProfesionalId && data.email?.trim()) {
          try {
            await invitacionesApi.crear({
              profesional_id: nuevoProfesionalId,
              email: data.email.trim(),
              nombre_sugerido: data.nombre_completo?.trim(),
              rol: data.rol_invitacion || 'empleado'
            });
            toast.success('Profesional creado e invitación enviada');
          } catch (invErr) {
            console.error('Error enviando invitación:', invErr);
            toast.warning('Profesional creado, pero hubo un error al enviar la invitación. Puedes reenviarla desde la edición.');
          }
        } else if (modoAcceso === 'vincular_usuario' && usuarioSeleccionado) {
          toast.success('Profesional creado y vinculado al usuario');
        } else {
          toast.success('Profesional creado exitosamente');
        }
      }

      onClose();
      reset();
      setSelectedColor(COLORES_CALENDARIO[0]);
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

                    {/* Estado laboral */}
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
                    {/* Fecha Nacimiento y Documento (Ene 2026) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name="fecha_nacimiento"
                        control={control}
                        type="date"
                        label="Fecha de Nacimiento"
                      />
                      <FormField
                        name="documento_identidad"
                        control={control}
                        label="Documento de Identidad"
                        placeholder="INE, CURP, Pasaporte..."
                        maxLength={30}
                      />
                    </div>

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

              {/* ========== SECCIÓN: Información Profesional (Ene 2026) ========== */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => toggleSeccion('infoProfesional')}
                  className="w-full flex items-center justify-between gap-2 mb-4"
                >
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Información Profesional</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">(Opcional)</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${seccionesAbiertas.infoProfesional ? 'rotate-180' : ''}`} />
                </button>

                {seccionesAbiertas.infoProfesional && (
                  <div className="space-y-4 pl-7">
                    {/* Años de experiencia */}
                    <FormField
                      name="años_experiencia"
                      control={control}
                      type="number"
                      label="Años de Experiencia"
                      placeholder="0"
                      min={0}
                      max={70}
                    />

                    {/* Idiomas - MultiSelect */}
                    <Controller
                      name="idiomas"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <MultiSelect
                          label="Idiomas"
                          placeholder="Selecciona idiomas"
                          value={value || []}
                          onChange={onChange}
                          options={IDIOMAS_DISPONIBLES}
                          max={10}
                          helper="Idiomas que domina el profesional"
                        />
                      )}
                    />

                    {/* Disponible Online */}
                    <Controller
                      name="disponible_online"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Checkbox
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              Disponible para citas online
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Aparecerá en el booking público del marketplace
                            </p>
                          </div>
                        </div>
                      )}
                    />

                    {/* Licencias Profesionales */}
                    <Controller
                      name="licencias_profesionales"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          label="Licencias y Certificaciones"
                          placeholder="Ej: Cédula profesional, certificaciones..."
                          rows={3}
                          helper="Licencias, cédulas o certificaciones del profesional"
                        />
                      )}
                    />
                  </div>
                )}
              </div>

              {/* ========== SECCIÓN: Compensación (Ene 2026) - Solo admin/propietario ========== */}
              {puedeVerCompensacion && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => toggleSeccion('compensacion')}
                    className="w-full flex items-center justify-between gap-2 mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Compensación</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">(Confidencial)</span>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${seccionesAbiertas.compensacion ? 'rotate-180' : ''}`} />
                  </button>

                  {seccionesAbiertas.compensacion && (
                    <div className="space-y-4 pl-7">
                      {/* Info privada */}
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Esta información es confidencial y solo visible para administradores.
                        </p>
                      </div>

                      {/* Forma de pago */}
                      <Controller
                        name="forma_pago"
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Select
                            {...field}
                            label="Forma de Pago"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value || undefined)}
                            options={Object.entries(FORMAS_PAGO).map(([key, val]) => ({
                              value: key,
                              label: val.label,
                            }))}
                            placeholder="Selecciona forma de pago"
                          />
                        )}
                      />

                      {/* Salario base y Comisión */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          name="salario_base"
                          control={control}
                          type="number"
                          label={`Salario Base (${symbol})`}
                          placeholder="0.00"
                          min={0}
                          step={0.01}
                        />
{/* comision_porcentaje eliminado - se configura en Módulo Comisiones */}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========== SECCIÓN: Documentos del Empleado (Enero 2026) ========== */}
              {isEditMode && profesionalData?.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <DocumentosEmpleadoSection
                    profesionalId={profesionalData.id}
                    isEditing={isEditMode}
                  />
                </div>
              )}

              {/* ========== SECCIÓN: Cuentas Bancarias (Fase 1 - Enero 2026) ========== */}
              {isEditMode && profesionalData?.id && puedeVerCompensacion && (
                <CuentasBancariasSection
                  profesionalId={profesionalData.id}
                  isEditing={isEditMode}
                />
              )}

              {/* ========== SECCIÓN: Experiencia Laboral (Fase 4 - Enero 2026) ========== */}
              {isEditMode && profesionalData?.id && (
                <ExperienciaLaboralSection
                  profesionalId={profesionalData.id}
                  isEditing={isEditMode}
                />
              )}

              {/* ========== SECCIÓN: Educación Formal (Fase 4 - Enero 2026) ========== */}
              {isEditMode && profesionalData?.id && (
                <EducacionFormalSection
                  profesionalId={profesionalData.id}
                  isEditing={isEditMode}
                />
              )}

              {/* ========== SECCIÓN: Habilidades (Fase 4 - Enero 2026) ========== */}
              {isEditMode && profesionalData?.id && (
                <HabilidadesSection
                  profesionalId={profesionalData.id}
                  isEditing={isEditMode}
                  canVerify={puedeVerCompensacion}
                />
              )}

              {/* ========== SECCIÓN: Plan de Integración (Fase 5 - Enero 2026) ========== */}
              {isEditMode && profesionalData?.id && (
                <OnboardingProgresoSection
                  profesionalId={profesionalData.id}
                  isEditing={isEditMode}
                />
              )}

              {/* Nov 2025: Sección Acceso al Sistema y Módulos */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Acceso al Sistema</h4>
                </div>

                {/* Estado actual: Usuario vinculado, invitación pendiente, o info */}
                {profesionalData?.usuario_id ? (
                  <div className="mb-4 space-y-4">
                    {/* Info de usuario vinculado */}
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Usuario vinculado</span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {profesionalData.usuario_nombre || profesionalData.usuario_email}
                      </p>
                    </div>

                    {/* Selector de rol del usuario (Dic 2025) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Rol del usuario
                        </span>
                      </label>
                      <div className="space-y-2">
                        {ROLES_INVITACION.map((rol) => (
                          <label
                            key={rol.value}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              profesionalData.usuario_rol === rol.value
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-600'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              profesionalData.usuario_rol === rol.value
                                ? 'border-primary-600 bg-primary-600'
                                : 'border-gray-300 dark:border-gray-500'
                            }`}>
                              {profesionalData.usuario_rol === rol.value && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <input
                              type="radio"
                              name="rol_usuario_edicion"
                              value={rol.value}
                              checked={profesionalData.usuario_rol === rol.value}
                              onChange={async (e) => {
                                try {
                                  await cambiarRolMutation.mutateAsync({
                                    id: profesionalData.usuario_id,
                                    rol: e.target.value
                                  });
                                  toast.success(`Rol cambiado a ${ROLES_USUARIO[e.target.value]?.label}`);
                                } catch (err) {
                                  toast.error(err.message || 'Error al cambiar rol');
                                }
                              }}
                              disabled={cambiarRolMutation.isPending}
                              className="sr-only"
                            />
                            <div className="flex-1">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {rol.label}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {rol.description}
                              </p>
                            </div>
                            {cambiarRolMutation.isPending && profesionalData.usuario_rol !== rol.value && (
                              <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
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
                  /* Modo creación: opciones de acceso (Dic 2025) */
                  <div className="mb-4 space-y-4">
                    {/* Selector de modo de acceso */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ¿Cómo dar acceso al sistema?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setModoAcceso('invitacion');
                            setUsuarioSeleccionado(null);
                          }}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            modoAcceso === 'invitacion'
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Mail className={`h-5 w-5 ${modoAcceso === 'invitacion' ? 'text-primary-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${modoAcceso === 'invitacion' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              Invitación
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Enviar email de registro</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setModoAcceso('vincular_usuario')}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            modoAcceso === 'vincular_usuario'
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Link2 className={`h-5 w-5 ${modoAcceso === 'vincular_usuario' ? 'text-primary-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${modoAcceso === 'vincular_usuario' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              Vincular
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Usuario ya existente</p>
                        </button>
                      </div>
                    </div>

                    {/* Contenido según modo seleccionado */}
                    {modoAcceso === 'invitacion' ? (
                      <>
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg">
                          <p className="text-sm text-primary-600 dark:text-primary-400">
                            Se enviará un email de invitación al correo ingresado arriba.
                          </p>
                        </div>

                        {/* Selector de Rol */}
                        <Controller
                          name="rol_invitacion"
                          control={control}
                          render={({ field: { value, onChange, ...field } }) => (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <span className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4" />
                                  Rol del usuario
                                </span>
                              </label>
                              <div className="space-y-2">
                                {ROLES_INVITACION.map((rol) => (
                                  <label
                                    key={rol.value}
                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                      value === rol.value
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-600'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                  >
                                    <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                      value === rol.value
                                        ? 'border-primary-600 bg-primary-600'
                                        : 'border-gray-300 dark:border-gray-500'
                                    }`}>
                                      {value === rol.value && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <input
                                      type="radio"
                                      {...field}
                                      value={rol.value}
                                      checked={value === rol.value}
                                      onChange={(e) => onChange(e.target.value)}
                                      className="sr-only"
                                    />
                                    <div className="flex-1">
                                      <span className="font-medium text-gray-900 dark:text-gray-100">
                                        {rol.label}
                                      </span>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {rol.description}
                                      </p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        />
                      </>
                    ) : (
                      /* Modo vincular usuario existente */
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Vincula este profesional a un usuario que ya tiene acceso al sistema.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Seleccionar usuario
                          </label>
                          {loadingUsuarios ? (
                            <div className="flex items-center gap-2 p-3 text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Cargando usuarios...</span>
                            </div>
                          ) : usuariosSinProfesional.length === 0 ? (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-500">
                              No hay usuarios disponibles sin profesional vinculado.
                            </div>
                          ) : (
                            <select
                              value={usuarioSeleccionado || ''}
                              onChange={(e) => setUsuarioSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="">Selecciona un usuario...</option>
                              {usuariosSinProfesional.map((usuario) => (
                                <option key={usuario.id} value={usuario.id}>
                                  {usuario.nombre} {usuario.apellidos} ({usuario.email}) - {ROLES_USUARIO[usuario.rol]?.label || usuario.rol}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Nota sobre permisos - Sistema Normalizado Dic 2025 */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-700 dark:text-gray-300">Permisos y acceso a módulos:</strong>{' '}
                    Una vez creado el profesional, puedes configurar sus permisos específicos desde{' '}
                    <span className="font-medium text-primary-600 dark:text-primary-400">
                      Configuración → Permisos
                    </span>.
                  </p>
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
