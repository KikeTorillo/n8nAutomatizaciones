import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

import {
  Button,
  Checkbox,
  Drawer,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import SelectorUbicacion from '@/components/forms/SelectorUbicacion';
import { useCrearSucursal, useActualizarSucursal } from '@/hooks/useSucursales';

// ==================== SCHEMA DE VALIDACIÓN ====================
const sucursalSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede exceder 150 caracteres'),
  codigo: z.string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  direccion: z.string()
    .max(500, 'La dirección no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  estado_id: z.string().optional().or(z.literal('')),
  ciudad_id: z.string().optional().or(z.literal('')),
  codigo_postal: z.string()
    .max(10, 'El código postal no puede exceder 10 caracteres')
    .optional()
    .or(z.literal('')),
  telefono: z.string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .email('Email inválido')
    .max(150, 'El email no puede exceder 150 caracteres')
    .optional()
    .or(z.literal('')),
  whatsapp: z.string()
    .max(20, 'El WhatsApp no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  zona_horaria: z.string().default('America/Mexico_City'),
  horario_apertura: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)')
    .default('09:00'),
  horario_cierre: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)')
    .default('20:00'),
  dias_laborales: z.array(z.string()).optional(),
  inventario_compartido: z.boolean().default(true),
  servicios_heredados: z.boolean().default(true),
  activo: z.boolean().default(true),
});

// ==================== CONSTANTES ====================
const DIAS_SEMANA = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

const ZONAS_HORARIAS = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'America/Hermosillo', label: 'Hermosillo (GMT-7)' },
  { value: 'America/Mazatlan', label: 'Mazatlán (GMT-7)' },
  { value: 'America/Cancun', label: 'Cancún (GMT-5)' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Lima', label: 'Lima (GMT-5)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-3)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
];

// ==================== COMPONENTE ====================
/**
 * Modal/Drawer para crear o editar una sucursal
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.sucursal - Datos de la sucursal (para edición)
 * @param {string} props.mode - 'create' o 'edit'
 */
function SucursalFormDrawer({ isOpen, onClose, sucursal = null, mode = 'create' }) {
  const isEdit = mode === 'edit' && sucursal;

  // Mutations
  const crearMutation = useCrearSucursal();
  const actualizarMutation = useActualizarSucursal();
  const isLoading = crearMutation.isPending || actualizarMutation.isPending;

  // Form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sucursalSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      direccion: '',
      estado_id: '',
      ciudad_id: '',
      codigo_postal: '',
      telefono: '',
      email: '',
      whatsapp: '',
      zona_horaria: 'America/Mexico_City',
      horario_apertura: '09:00',
      horario_cierre: '20:00',
      dias_laborales: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
      inventario_compartido: true,
      servicios_heredados: true,
      activo: true,
    },
  });

  // Cargar datos al editar
  useEffect(() => {
    if (isOpen && isEdit && sucursal) {
      reset({
        nombre: sucursal.nombre || '',
        codigo: sucursal.codigo || '',
        direccion: sucursal.direccion || '',
        estado_id: sucursal.estado_id?.toString() || '',
        ciudad_id: sucursal.ciudad_id?.toString() || '',
        codigo_postal: sucursal.codigo_postal || '',
        telefono: sucursal.telefono || '',
        email: sucursal.email || '',
        whatsapp: sucursal.whatsapp || '',
        zona_horaria: sucursal.zona_horaria || 'America/Mexico_City',
        horario_apertura: sucursal.horario_apertura || '09:00',
        horario_cierre: sucursal.horario_cierre || '20:00',
        dias_laborales: sucursal.dias_laborales || ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
        inventario_compartido: sucursal.inventario_compartido ?? true,
        servicios_heredados: sucursal.servicios_heredados ?? true,
        activo: sucursal.activo ?? true,
      });
    } else if (isOpen && !isEdit) {
      reset({
        nombre: '',
        codigo: '',
        direccion: '',
        estado_id: '',
        ciudad_id: '',
        codigo_postal: '',
        telefono: '',
        email: '',
        whatsapp: '',
        zona_horaria: 'America/Mexico_City',
        horario_apertura: '09:00',
        horario_cierre: '20:00',
        dias_laborales: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
        inventario_compartido: true,
        servicios_heredados: true,
        activo: true,
      });
    }
  }, [isOpen, isEdit, sucursal, reset]);

  // Submit
  const onSubmit = async (data) => {
    // Sanitizar y convertir tipos
    const sanitizedData = {
      nombre: data.nombre,
      codigo: data.codigo?.trim() || undefined,
      direccion: data.direccion?.trim() || undefined,
      estado_id: data.estado_id ? parseInt(data.estado_id) : undefined,
      ciudad_id: data.ciudad_id ? parseInt(data.ciudad_id) : undefined,
      codigo_postal: data.codigo_postal?.trim() || undefined,
      telefono: data.telefono?.trim() || undefined,
      email: data.email?.trim() || undefined,
      whatsapp: data.whatsapp?.trim() || undefined,
      zona_horaria: data.zona_horaria,
      horario_apertura: data.horario_apertura,
      horario_cierre: data.horario_cierre,
      dias_laborales: data.dias_laborales,
      inventario_compartido: data.inventario_compartido,
      servicios_heredados: data.servicios_heredados,
      activo: data.activo,
    };

    try {
      if (isEdit) {
        await actualizarMutation.mutateAsync({
          id: sucursal.id,
          data: sanitizedData,
        });
        toast.success('Sucursal actualizada exitosamente');
      } else {
        await crearMutation.mutateAsync(sanitizedData);
        toast.success('Sucursal creada exitosamente');
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al guardar sucursal');
    }
  };

  // Días laborales seleccionados
  const diasLaborales = watch('dias_laborales') || [];

  const handleDiaToggle = (dia) => {
    const nuevos = diasLaborales.includes(dia)
      ? diasLaborales.filter(d => d !== dia)
      : [...diasLaborales, dia];
    setValue('dias_laborales', nuevos);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary-600" />
          <span>{isEdit ? 'Editar Sucursal' : 'Nueva Sucursal'}</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ===== INFORMACIÓN BÁSICA ===== */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Información Básica
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('nombre')}
              placeholder="Ej: Sucursal Centro"
              error={errors.nombre?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código
            </label>
            <Input
              {...register('codigo')}
              placeholder="Se genera automáticamente si se deja vacío"
              error={errors.codigo?.message}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Código único para identificar la sucursal (ej: SUC-001)
            </p>
          </div>
        </div>

        {/* ===== UBICACIÓN ===== */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Ubicación
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirección
            </label>
            <Textarea
              {...register('direccion')}
              placeholder="Calle, número, colonia..."
              rows={2}
              error={errors.direccion?.message}
            />
          </div>

          <SelectorUbicacion
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            required={false}
            horizontal={true}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código Postal
            </label>
            <Input
              {...register('codigo_postal')}
              placeholder="Ej: 06600"
              error={errors.codigo_postal?.message}
            />
          </div>
        </div>

        {/* ===== CONTACTO ===== */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Contacto
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <Input
                {...register('telefono')}
                placeholder="Ej: 55 1234 5678"
                error={errors.telefono?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                WhatsApp
              </label>
              <Input
                {...register('whatsapp')}
                placeholder="Ej: 521234567890"
                error={errors.whatsapp?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              type="email"
              {...register('email')}
              placeholder="sucursal@ejemplo.com"
              error={errors.email?.message}
            />
          </div>
        </div>

        {/* ===== HORARIOS ===== */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Horarios
          </h3>

          <Controller
            name="zona_horaria"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Zona Horaria"
                options={ZONAS_HORARIAS}
                error={errors.zona_horaria?.message}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora Apertura
              </label>
              <Input
                type="time"
                {...register('horario_apertura')}
                error={errors.horario_apertura?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora Cierre
              </label>
              <Input
                type="time"
                {...register('horario_cierre')}
                error={errors.horario_cierre?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Días Laborales
            </label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia.value}
                  type="button"
                  onClick={() => handleDiaToggle(dia.value)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    diasLaborales.includes(dia.value)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-400'
                  }`}
                >
                  {dia.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== CONFIGURACIÓN ===== */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Configuración
          </h3>

          <Controller
            name="inventario_compartido"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onChange={field.onChange}
                label="Inventario compartido con la organización"
              />
            )}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 -mt-2">
            Si está activo, usa el stock global. Si no, maneja inventario independiente.
          </p>

          <Controller
            name="servicios_heredados"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onChange={field.onChange}
                label="Heredar servicios de la organización"
              />
            )}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 -mt-2">
            Si está activo, ofrece los mismos servicios que la organización.
          </p>

          {isEdit && (
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  label="Sucursal activa"
                />
              )}
            />
          )}
        </div>

        {/* ===== BOTONES ===== */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isLoading}
          >
            {isEdit ? 'Actualizar' : 'Crear Sucursal'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default SucursalFormDrawer;
