import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, ImageIcon, Camera, X, Loader2, Globe, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Button,
  Checkbox,
  Drawer,
  FormGroup,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import FormField from '@/components/forms/FormField';
import { profesionalesApi, monedasApi } from '@/services/api/endpoints';
import { useCrearServicio, useActualizarServicio, useServicio } from '@/hooks/agendamiento';
import { useToast } from '@/hooks/utils';
import { useUploadArchivo } from '@/hooks/utils';
import { useCurrency } from '@/hooks/utils';

/**
 * Schema de validación Zod para CREAR servicio
 * Todos los campos son requeridos excepto descripcion
 */
const servicioCreateSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  categoria: z.string().min(1, 'Categoría requerida').max(50, 'Máximo 50 caracteres'),
  duracion_minutos: z.number().int('Debe ser un número entero').min(1, 'Mínimo 1 minuto').max(480, 'Máximo 8 horas'),
  // Buffer Time - Tiempo de preparación y limpieza
  requiere_preparacion_minutos: z.number().int('Debe ser un número entero').min(0, 'Mínimo 0 minutos').max(120, 'Máximo 120 minutos').optional().default(0),
  tiempo_limpieza_minutos: z.number().int('Debe ser un número entero').min(0, 'Mínimo 0 minutos').max(60, 'Máximo 60 minutos').optional().default(5),
  precio: z
    .union([z.number(), z.string()])
    .transform((val) => {
      // Convertir string vacío a 0, y strings numéricos a números
      if (val === '' || val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    })
    .pipe(
      z.number()
        .min(0, 'El precio no puede ser negativo')
        .max(10000000, 'Precio máximo excedido')
    ),
  profesionales_ids: z.array(z.number()).optional().default([]), // Profesionales opcionales - asignar desde Profesional
  activo: z.boolean().default(true),
});

/**
 * Schema de validación Zod para EDITAR servicio
 * Todos los campos son opcionales pero al menos uno debe estar presente
 * NO incluye profesionales_ids (gestión separada en Fase 4)
 */
const servicioEditSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres').optional(),
  descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  categoria: z.string().min(1, 'Categoría requerida').max(50, 'Máximo 50 caracteres').optional(),
  duracion_minutos: z.number().int('Debe ser un número entero').min(1, 'Mínimo 1 minuto').max(480, 'Máximo 8 horas').optional(),
  // Buffer Time - Tiempo de preparación y limpieza
  requiere_preparacion_minutos: z.number().int('Debe ser un número entero').min(0, 'Mínimo 0 minutos').max(120, 'Máximo 120 minutos').optional(),
  tiempo_limpieza_minutos: z.number().int('Debe ser un número entero').min(0, 'Mínimo 0 minutos').max(60, 'Máximo 60 minutos').optional(),
  precio: z
    .union([z.number(), z.string()])
    .transform((val) => {
      // Convertir string vacío a 0, y strings numéricos a números
      if (val === '' || val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    })
    .pipe(
      z.number()
        .min(0, 'El precio no puede ser negativo')
        .max(10000000, 'Precio máximo excedido')
    )
    .optional(),
  activo: z.boolean().optional(),
}).refine((data) => {
  return Object.keys(data).some(key => data[key] !== undefined);
}, {
  message: 'Debes modificar al menos un campo',
});

/**
 * Modal de formulario para crear y editar servicios
 * @param {string} mode - 'create' o 'edit'
 * @param {object|null} servicio - Datos del servicio a editar (solo en modo edit)
 */
function ServicioFormDrawer({ isOpen, onClose, mode = 'create', servicio = null }) {
  const toast = useToast();
  const [selectedProfessionals, setSelectedProfessionals] = useState([]);
  const { code: monedaOrg } = useCurrency();

  // Dic 2025: Estado para imagen del servicio
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenUrl, setImagenUrl] = useState(null);
  const uploadMutation = useUploadArchivo();

  // Estado para precios multi-moneda
  const [preciosMoneda, setPreciosMoneda] = useState([]);
  const [mostrarPreciosMoneda, setMostrarPreciosMoneda] = useState(false);

  const isEditMode = mode === 'edit';
  const servicioId = servicio?.id;

  // Query para obtener monedas disponibles
  const { data: monedasResponse } = useQuery({
    queryKey: ['monedas'],
    queryFn: () => monedasApi.listar(),
    staleTime: 1000 * 60 * 10, // 10 min
  });
  const todasLasMonedas = monedasResponse?.data?.data || [];
  const monedasDisponibles = todasLasMonedas.filter(m => m.codigo !== monedaOrg);

  // Fetch datos del servicio en modo edición
  const { data: servicioData, isLoading: loadingServicio } = useServicio(servicioId, {
    enabled: isOpen && isEditMode && !!servicioId,
  });

  // Fetch profesionales para el multi-select (solo en modo create)
  const { data: profesionales, isLoading: loadingProfesionales } = useQuery({
    queryKey: ['profesionales'],
    queryFn: async () => {
      const response = await profesionalesApi.listar();
      return response.data.data.profesionales || [];
    },
    enabled: isOpen && !isEditMode, // Solo fetch en modo create cuando modal está abierto
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Hooks de mutación
  const crearMutation = useCrearServicio();
  const actualizarMutation = useActualizarServicio();

  // React Hook Form con validación Zod
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditMode ? servicioEditSchema : servicioCreateSchema),
    defaultValues: isEditMode
      ? {} // En modo edit, los valores se cargan dinámicamente
      : {
          nombre: '',
          descripcion: '',
          categoria: '',
          duracion_minutos: 30,
          requiere_preparacion_minutos: 0,
          tiempo_limpieza_minutos: 5,
          precio: '',
          profesionales_ids: [],
          activo: true,
        },
  });

  // Pre-cargar datos del servicio en modo edición
  useEffect(() => {
    if (isEditMode && servicioData && isOpen) {
      reset({
        nombre: servicioData.nombre || '',
        descripcion: servicioData.descripcion || '',
        categoria: servicioData.categoria || '',
        duracion_minutos: servicioData.duracion_minutos || 30,
        requiere_preparacion_minutos: servicioData.requiere_preparacion_minutos || 0,
        tiempo_limpieza_minutos: servicioData.tiempo_limpieza_minutos ?? 5,
        precio: parseFloat(servicioData.precio) || 0,
        activo: servicioData.activo !== undefined ? servicioData.activo : true,
      });
      // Dic 2025: Cargar imagen existente
      if (servicioData.imagen_url) {
        setImagenUrl(servicioData.imagen_url);
        setImagenPreview(servicioData.imagen_url);
      } else {
        setImagenUrl(null);
        setImagenPreview(null);
      }
      setImagenFile(null);

      // Cargar precios multi-moneda si existen
      if (servicioData.precios_moneda && servicioData.precios_moneda.length > 0) {
        setPreciosMoneda(servicioData.precios_moneda.map(p => ({
          moneda: p.moneda,
          precio: p.precio || '',
          precio_minimo: p.precio_minimo || '',
          precio_maximo: p.precio_maximo || ''
        })));
        setMostrarPreciosMoneda(true);
      } else {
        setPreciosMoneda([]);
        setMostrarPreciosMoneda(false);
      }
    }
  }, [isEditMode, servicioData, isOpen, reset]);

  // Reset form cuando cierra el modal
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedProfessionals([]);
      // Dic 2025: Limpiar imagen
      setImagenFile(null);
      setImagenPreview(null);
      setImagenUrl(null);
      // Limpiar precios multi-moneda
      setPreciosMoneda([]);
      setMostrarPreciosMoneda(false);
    }
  }, [isOpen, reset]);

  // Dic 2025: Handler para seleccionar imagen
  const handleImagenChange = (e) => {
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
      setImagenFile(file);
      setImagenPreview(URL.createObjectURL(file));
    }
  };

  // Dic 2025: Handler para eliminar imagen
  const handleEliminarImagen = () => {
    setImagenFile(null);
    setImagenPreview(null);
    setImagenUrl(null);
  };

  // Handler para toggle de profesionales
  const toggleProfessional = (profId) => {
    const newSelected = selectedProfessionals.includes(profId)
      ? selectedProfessionals.filter((id) => id !== profId)
      : [...selectedProfessionals, profId];

    setSelectedProfessionals(newSelected);
    setValue('profesionales_ids', newSelected);
  };

  // Handlers para precios multi-moneda
  const agregarPrecioMoneda = () => {
    const monedasUsadas = preciosMoneda.map(p => p.moneda);
    const monedaDisponible = monedasDisponibles.find(m => !monedasUsadas.includes(m.codigo));

    if (monedaDisponible) {
      setPreciosMoneda([...preciosMoneda, {
        moneda: monedaDisponible.codigo,
        precio: '',
        precio_minimo: '',
        precio_maximo: ''
      }]);
    }
  };

  const eliminarPrecioMoneda = (index) => {
    setPreciosMoneda(preciosMoneda.filter((_, i) => i !== index));
  };

  const actualizarPrecioMoneda = (index, campo, valor) => {
    const nuevosPrecios = [...preciosMoneda];
    nuevosPrecios[index][campo] = valor;
    setPreciosMoneda(nuevosPrecios);
  };

  // Handler de submit
  const onSubmit = async (data) => {
    try {
      // Dic 2025: Subir imagen si hay una nueva
      let urlImagenFinal = imagenUrl;
      if (imagenFile) {
        const resultado = await uploadMutation.mutateAsync({
          file: imagenFile,
          folder: 'servicios',
          isPublic: true,
        });
        urlImagenFinal = resultado?.url || resultado;
      }

      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        // Dic 2025: Incluir imagen
        imagen_url: urlImagenFinal || undefined,
      };

      // Si se eliminó la imagen existente
      if (imagenUrl === null && servicioData?.imagen_url) {
        sanitized.imagen_url = null;
      }

      // Agregar precios multi-moneda si existen
      if (preciosMoneda.length > 0) {
        const preciosValidos = preciosMoneda
          .filter(p => p.moneda && p.precio)
          .map(p => ({
            moneda: p.moneda,
            precio: parseFloat(p.precio),
            precio_minimo: p.precio_minimo ? parseFloat(p.precio_minimo) : null,
            precio_maximo: p.precio_maximo ? parseFloat(p.precio_maximo) : null
          }));

        if (preciosValidos.length > 0) {
          sanitized.precios_moneda = preciosValidos;
        }
      }

      if (isEditMode) {
        // Modo edición
        await actualizarMutation.mutateAsync({ id: servicioId, data: sanitized });
        toast.success('Servicio actualizado exitosamente');
      } else {
        // Modo creación
        await crearMutation.mutateAsync(sanitized);
        toast.success('Servicio creado exitosamente');
      }

      onClose();
      reset();
      setSelectedProfessionals([]);
      // Dic 2025: Limpiar imagen
      setImagenFile(null);
      setImagenPreview(null);
      setImagenUrl(null);
      // Limpiar precios multi-moneda
      setPreciosMoneda([]);
      setMostrarPreciosMoneda(false);
    } catch (error) {
      toast.error(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} servicio`);
    }
  };

  // Loading state durante fetch de datos
  const isLoadingData = isEditMode && loadingServicio;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Servicio' : 'Nuevo Servicio'}
      subtitle={isEditMode
        ? 'Modifica los datos del servicio'
        : 'Completa la información del servicio'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header con imagen del servicio */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          {/* Imagen del servicio editable */}
          <div className="relative">
            {imagenPreview ? (
              <div className="relative">
                <img
                  src={imagenPreview}
                  alt="Imagen del servicio"
                  className="w-16 h-16 rounded-lg object-cover border-2 border-primary-200 dark:border-primary-700"
                />
                <button
                  type="button"
                  onClick={handleEliminarImagen}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            )}
            {/* Botón para cambiar imagen */}
            <label className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full p-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm">
              <Camera className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImagenChange}
                className="sr-only"
                disabled={uploadMutation.isPending}
              />
            </label>
            {uploadMutation.isPending && (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-lg flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-primary-600 dark:text-primary-400 animate-spin" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Toca la imagen para cambiarla
            </p>
          </div>
        </div>

        {/* Loading state durante fetch de datos en modo edición */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando datos del servicio...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Campos del formulario */}
            <div className="space-y-4">
              {/* Nombre */}
              <FormField
                name="nombre"
                control={control}
                label="Nombre del Servicio"
                placeholder="Ej: Corte de Cabello"
                required={!isEditMode}
              />

              {/* Descripción */}
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <FormGroup label="Descripción (Opcional)" error={errors.descripcion?.message}>
                    <Textarea
                      {...field}
                      placeholder="Breve descripción del servicio..."
                      rows={3}
                      hasError={!!errors.descripcion}
                    />
                  </FormGroup>
                )}
              />

              {/* Categoría */}
              <FormField
                name="categoria"
                control={control}
                label="Categoría"
                placeholder="Ej: Cortes, Tratamientos, etc."
                required={!isEditMode}
              />

              {/* Duración - Horas y Minutos con Presets */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duración {!isEditMode && <span className="text-red-500">*</span>}
                </label>

                {/* Botones preset */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { label: '15 min', minutos: 15 },
                    { label: '30 min', minutos: 30 },
                    { label: '45 min', minutos: 45 },
                    { label: '1 hora', minutos: 60 },
                    { label: '1h 30m', minutos: 90 },
                    { label: '2 horas', minutos: 120 },
                  ].map((preset) => (
                    <Controller
                      key={preset.minutos}
                      name="duracion_minutos"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(preset.minutos)}
                          className={`
                            px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all
                            ${field.value === preset.minutos
                              ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-500'
                            }
                          `}
                        >
                          {preset.label}
                        </button>
                      )}
                    />
                  ))}
                </div>

                {/* Inputs personalizados - Horas y Minutos */}
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="duracion_minutos"
                    control={control}
                    render={({ field }) => {
                      const totalMinutos = field.value || 0;
                      const horas = Math.floor(totalMinutos / 60);
                      const minutos = totalMinutos % 60;

                      return (
                        <FormGroup label="Horas">
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="8"
                            value={horas === 0 ? '' : horas}
                            onKeyDown={(e) => {
                              if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const value = e.target.value;
                              const newHoras = value === '' ? 0 : Math.min(Math.max(parseInt(value), 0), 8);
                              field.onChange(newHoras * 60 + minutos);
                            }}
                          />
                        </FormGroup>
                      );
                    }}
                  />

                  <Controller
                    name="duracion_minutos"
                    control={control}
                    render={({ field }) => {
                      const totalMinutos = field.value || 0;
                      const horas = Math.floor(totalMinutos / 60);
                      const minutos = totalMinutos % 60;

                      return (
                        <FormGroup label="Minutos" error={errors.duracion_minutos?.message}>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="59"
                            value={minutos === 0 ? '' : minutos}
                            hasError={!!errors.duracion_minutos}
                            onKeyDown={(e) => {
                              if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const value = e.target.value;
                              const newMinutos = value === '' ? 0 : Math.min(Math.max(parseInt(value), 0), 59);
                              field.onChange(horas * 60 + newMinutos);
                            }}
                          />
                        </FormGroup>
                      );
                    }}
                  />
                </div>

                {/* Mostrar total */}
                <Controller
                  name="duracion_minutos"
                  control={control}
                  render={({ field }) => (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{field.value} minutos</span>
                    </p>
                  )}
                />
              </div>

              {/* Buffer Time - Tiempo de preparación y limpieza */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tiempo Buffer
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                    (preparación y limpieza)
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                  Tiempo adicional antes y después del servicio para preparación del espacio
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Tiempo de preparación */}
                  <Controller
                    name="requiere_preparacion_minutos"
                    control={control}
                    render={({ field }) => {
                      const currentValue = field.value ?? 0;
                      return (
                        <FormGroup label="Preparación (min)" error={errors.requiere_preparacion_minutos?.message}>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="120"
                            value={currentValue === 0 ? '' : currentValue}
                            hasError={!!errors.requiere_preparacion_minutos}
                            onKeyDown={(e) => {
                              if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const value = e.target.value;
                              const newValue = value === '' ? 0 : Math.min(Math.max(parseInt(value) || 0, 0), 120);
                              field.onChange(newValue);
                            }}
                          />
                        </FormGroup>
                      );
                    }}
                  />

                  {/* Tiempo de limpieza */}
                  <Controller
                    name="tiempo_limpieza_minutos"
                    control={control}
                    render={({ field }) => {
                      const currentValue = field.value ?? 0;
                      return (
                        <FormGroup label="Limpieza (min)" error={errors.tiempo_limpieza_minutos?.message}>
                          <Input
                            type="number"
                            placeholder="5"
                            min="0"
                            max="60"
                            value={currentValue === 0 ? '' : currentValue}
                            hasError={!!errors.tiempo_limpieza_minutos}
                            onKeyDown={(e) => {
                              if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const value = e.target.value;
                              const newValue = value === '' ? 0 : Math.min(Math.max(parseInt(value) || 0, 0), 60);
                              field.onChange(newValue);
                            }}
                          />
                        </FormGroup>
                      );
                    }}
                  />
                </div>

                {/* Mostrar tiempo total con buffers */}
                <Controller
                  name="duracion_minutos"
                  control={control}
                  render={({ field: duracionField }) => (
                    <Controller
                      name="requiere_preparacion_minutos"
                      control={control}
                      render={({ field: prepField }) => (
                        <Controller
                          name="tiempo_limpieza_minutos"
                          control={control}
                          render={({ field: limpiezaField }) => {
                            const tiempoTotal = (prepField.value || 0) + duracionField.value + (limpiezaField.value || 0);
                            return (
                              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                <p className="text-sm text-primary-700 dark:text-primary-300">
                                  <span className="font-medium">Tiempo total por cita:</span>{' '}
                                  <span className="font-bold">{tiempoTotal} minutos</span>
                                  {(prepField.value > 0 || limpiezaField.value > 0) && (
                                    <span className="text-xs text-primary-600 dark:text-primary-400 ml-2">
                                      ({prepField.value || 0} prep + {duracionField.value} servicio + {limpiezaField.value || 0} limpieza)
                                    </span>
                                  )}
                                </p>
                              </div>
                            );
                          }}
                        />
                      )}
                    />
                  )}
                />
              </div>

              {/* Precio */}
              <Controller
                name="precio"
                control={control}
                render={({ field }) => (
                  <FormGroup label="Precio" error={errors.precio?.message} required={!isEditMode}>
                    <Input
                      {...field}
                      type="number"
                      placeholder="Ej: 50000"
                      min="0"
                      step="1"
                      hasError={!!errors.precio}
                      onKeyDown={(e) => {
                        // Prevenir entrada de caracteres no permitidos en números positivos
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Si está vacío, mantener vacío para que se vea el placeholder
                        // Si tiene valor, convertir a número entero y asegurar que sea positivo
                        if (value === '') {
                          field.onChange('');
                        } else {
                          const num = parseInt(value) || 0;
                          field.onChange(Math.abs(num)); // Math.abs asegura valor positivo
                        }
                      }}
                    />
                  </FormGroup>
                )}
              />

              {/* Precios en otras monedas - Colapsable */}
              {monedasDisponibles.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMostrarPreciosMoneda(!mostrarPreciosMoneda)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                  >
                    <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Globe className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                      Precios en otras monedas
                      {preciosMoneda.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
                          {preciosMoneda.length}
                        </span>
                      )}
                    </span>
                    {mostrarPreciosMoneda ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {mostrarPreciosMoneda && (
                    <div className="p-4 space-y-4">
                      {preciosMoneda.map((precio, index) => {
                        const monedaInfo = monedasDisponibles.find(m => m.codigo === precio.moneda);
                        const monedasUsadas = preciosMoneda.map(p => p.moneda);
                        const opcionesMoneda = monedasDisponibles.filter(
                          m => m.codigo === precio.moneda || !monedasUsadas.includes(m.codigo)
                        );

                        return (
                          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <Select
                                value={precio.moneda}
                                onChange={(e) => actualizarPrecioMoneda(index, 'moneda', e.target.value)}
                                options={opcionesMoneda.map(m => ({
                                  value: m.codigo,
                                  label: `${m.codigo} - ${m.nombre}`
                                }))}
                                className="w-48"
                              />
                              <button
                                type="button"
                                onClick={() => eliminarPrecioMoneda(index)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <FormGroup label="Precio" required>
                                <Input
                                  type="number"
                                  value={precio.precio}
                                  onChange={(e) => actualizarPrecioMoneda(index, 'precio', e.target.value)}
                                  step="0.01"
                                  placeholder="0.00"
                                  prefix={monedaInfo?.simbolo || '$'}
                                />
                              </FormGroup>
                              <FormGroup label="P. Mínimo">
                                <Input
                                  type="number"
                                  value={precio.precio_minimo}
                                  onChange={(e) => actualizarPrecioMoneda(index, 'precio_minimo', e.target.value)}
                                  step="0.01"
                                  placeholder="0.00"
                                  prefix={monedaInfo?.simbolo || '$'}
                                />
                              </FormGroup>
                              <FormGroup label="P. Máximo">
                                <Input
                                  type="number"
                                  value={precio.precio_maximo}
                                  onChange={(e) => actualizarPrecioMoneda(index, 'precio_maximo', e.target.value)}
                                  step="0.01"
                                  placeholder="0.00"
                                  prefix={monedaInfo?.simbolo || '$'}
                                />
                              </FormGroup>
                            </div>
                          </div>
                        );
                      })}

                      {preciosMoneda.length < monedasDisponibles.length && (
                        <button
                          type="button"
                          onClick={agregarPrecioMoneda}
                          className="flex items-center justify-center w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-dashed border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar precio en otra moneda
                        </button>
                      )}

                      {preciosMoneda.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                          No hay precios en otras monedas configurados.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Multi-select de Profesionales - Solo en modo create */}
              {!isEditMode && (
                <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profesionales que ofrecen este servicio{' '}
              <span className="text-gray-500 dark:text-gray-400">(Opcional)</span>
            </label>

            {loadingProfesionales ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
              </div>
            ) : profesionales && profesionales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                {profesionales.map((prof) => (
                  <div
                    key={prof.id}
                    onClick={() => toggleProfessional(prof.id)}
                    className={`
                      flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                      ${
                        selectedProfessionals.includes(prof.id)
                          ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500'
                      }
                    `}
                  >
                    <Checkbox
                      checked={selectedProfessionals.includes(prof.id)}
                      onChange={() => toggleProfessional(prof.id)}
                    />
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: prof.color_calendario || '#3B82F6' }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {prof.nombre_completo}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                💡 No hay profesionales disponibles. Puedes crear el servicio ahora y asignar profesionales después desde la página de <strong>Profesionales → Servicios</strong>.
              </div>
            )}

            {errors.profesionales_ids && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.profesionales_ids.message}
              </p>
            )}

                  {selectedProfessionals.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {selectedProfessionals.length} profesional(es) seleccionado(s)
                    </p>
                  )}
                </div>
              )}

              {/* Estado Activo */}
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="Servicio activo"
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
                disabled={
                  crearMutation.isPending ||
                  actualizarMutation.isPending ||
                  uploadMutation.isPending
                }
              >
                {uploadMutation.isPending
                  ? 'Subiendo imagen...'
                  : isEditMode
                    ? actualizarMutation.isPending
                      ? 'Actualizando...'
                      : 'Actualizar Servicio'
                    : crearMutation.isPending
                      ? 'Creando...'
                      : 'Crear Servicio'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Drawer>
  );
}

export default ServicioFormDrawer;
