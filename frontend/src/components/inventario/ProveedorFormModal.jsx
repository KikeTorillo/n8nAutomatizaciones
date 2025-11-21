import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Phone, Mail, Globe, MapPin } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FieldWrapper from '@/components/forms/FieldWrapper';
import { useCrearProveedor, useActualizarProveedor } from '@/hooks/useProveedores';
import { useToast } from '@/hooks/useToast';

/**
 * Schema de validación Zod para proveedores
 */
const proveedorSchema = z.object({
  // Información Básica
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  razon_social: z.string().max(200, 'Máximo 200 caracteres').optional(),
  rfc: z
    .string()
    .regex(/^[A-Z0-9]+$/i, 'RFC solo puede contener letras y números')
    .max(13, 'Máximo 13 caracteres')
    .optional()
    .or(z.literal('')),

  // Contacto
  telefono: z.string().max(20, 'Máximo 20 caracteres').optional(),
  email: z.string().email('Email inválido').max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  sitio_web: z.string().url('URL inválida').max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),

  // Dirección
  direccion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  ciudad: z.string().max(100, 'Máximo 100 caracteres').optional(),
  estado: z.string().max(100, 'Máximo 100 caracteres').optional(),
  codigo_postal: z.string().max(10, 'Máximo 10 caracteres').optional(),
  pais: z.string().max(100, 'Máximo 100 caracteres').default('México'),

  // Términos Comerciales
  dias_credito: z.coerce.number().min(0, 'No puede ser negativo').default(0),
  dias_entrega_estimados: z.preprocess(
    (val) => (val === 0 || val === '0' || val === '') ? undefined : val,
    z.coerce.number().min(1, 'Mínimo 1 día').optional()
  ),
  monto_minimo_compra: z.preprocess(
    (val) => (val === 0 || val === '0' || val === '') ? undefined : val,
    z.coerce.number().min(0, 'No puede ser negativo').optional()
  ),

  // Notas
  notas: z.string().max(500, 'Máximo 500 caracteres').optional(),
  activo: z.boolean().default(true),
});

/**
 * Modal para crear/editar proveedores
 */
function ProveedorFormModal({ isOpen, onClose, proveedor = null, mode = 'create' }) {
  const { showToast } = useToast();
  const esEdicion = mode === 'edit' && proveedor;

  // Mutations
  const crearMutation = useCrearProveedor();
  const actualizarMutation = useActualizarProveedor();
  const mutation = esEdicion ? actualizarMutation : crearMutation;

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      nombre: '',
      razon_social: '',
      rfc: '',
      telefono: '',
      email: '',
      sitio_web: '',
      direccion: '',
      ciudad: '',
      estado: '',
      codigo_postal: '',
      pais: 'México',
      dias_credito: 0,
      dias_entrega_estimados: '',
      monto_minimo_compra: '',
      notas: '',
      activo: true,
    },
  });

  // Cargar datos al editar
  useEffect(() => {
    if (esEdicion && proveedor) {
      reset({
        nombre: proveedor.nombre || '',
        razon_social: proveedor.razon_social || '',
        rfc: proveedor.rfc || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        sitio_web: proveedor.sitio_web || '',
        direccion: proveedor.direccion || '',
        ciudad: proveedor.ciudad || '',
        estado: proveedor.estado || '',
        codigo_postal: proveedor.codigo_postal || '',
        pais: proveedor.pais || 'México',
        dias_credito: proveedor.dias_credito || 0,
        dias_entrega_estimados: proveedor.dias_entrega_estimados || '',
        monto_minimo_compra: proveedor.monto_minimo_compra || '',
        notas: proveedor.notas || '',
        activo: proveedor.activo ?? true,
      });
    } else {
      reset({
        nombre: '',
        razon_social: '',
        rfc: '',
        telefono: '',
        email: '',
        sitio_web: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigo_postal: '',
        pais: 'México',
        dias_credito: 0,
        dias_entrega_estimados: '',
        monto_minimo_compra: '',
        notas: '',
        activo: true,
      });
    }
  }, [esEdicion, proveedor, reset]);

  // Auto-cerrar modal al completar mutation
  useEffect(() => {
    if (mutation.isSuccess) {
      reset();
      onClose();
    }
  }, [mutation.isSuccess, reset, onClose]);

  // Submit handler
  const onSubmit = (data) => {
    // Sanitizar datos opcionales
    const payload = {
      nombre: data.nombre,
      razon_social: data.razon_social || undefined,
      rfc: data.rfc || undefined,
      telefono: data.telefono || undefined,
      email: data.email || undefined,
      sitio_web: data.sitio_web || undefined,
      direccion: data.direccion || undefined,
      ciudad: data.ciudad || undefined,
      estado: data.estado || undefined,
      codigo_postal: data.codigo_postal || undefined,
      pais: data.pais,
      dias_credito: data.dias_credito,
      dias_entrega_estimados: data.dias_entrega_estimados || undefined,
      monto_minimo_compra: data.monto_minimo_compra || undefined,
      notas: data.notas || undefined,
      activo: data.activo,
    };

    if (esEdicion) {
      mutation.mutate(
        { id: proveedor.id, data: payload },
        {
          onSuccess: () => {
            showToast('Proveedor actualizado correctamente', 'success');
          },
          onError: (error) => {
            showToast(
              error.response?.data?.mensaje || 'Error al actualizar proveedor',
              'error'
            );
          },
        }
      );
    } else {
      mutation.mutate(payload, {
        onSuccess: () => {
          showToast('Proveedor creado correctamente', 'success');
        },
        onError: (error) => {
          showToast(
            error.response?.data?.mensaje || 'Error al crear proveedor',
            'error'
          );
        },
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      size="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* INFORMACIÓN BÁSICA */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-gray-600" />
            Información Básica
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper label="Nombre Comercial" error={errors.nombre?.message} required>
              <input
                type="text"
                {...register('nombre')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: Distribuidora ABC"
              />
            </FieldWrapper>

            <FieldWrapper label="Razón Social" error={errors.razon_social?.message}>
              <input
                type="text"
                {...register('razon_social')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: ABC Distribuidora S.A. de C.V."
              />
            </FieldWrapper>

            <FieldWrapper label="RFC" error={errors.rfc?.message}>
              <input
                type="text"
                {...register('rfc')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: XAXX010101000"
                maxLength={13}
              />
            </FieldWrapper>
          </div>
        </div>

        {/* CONTACTO */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-gray-600" />
            Contacto
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <FieldWrapper label="Teléfono" error={errors.telefono?.message}>
              <input
                type="tel"
                {...register('telefono')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: +52 55 1234 5678"
              />
            </FieldWrapper>

            <FieldWrapper label="Email" error={errors.email?.message}>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="contacto@proveedor.com"
              />
            </FieldWrapper>

            <FieldWrapper label="Sitio Web" error={errors.sitio_web?.message}>
              <input
                type="url"
                {...register('sitio_web')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://proveedor.com"
              />
            </FieldWrapper>
          </div>
        </div>

        {/* DIRECCIÓN */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-gray-600" />
            Dirección
          </h3>

          <div className="space-y-4">
            <FieldWrapper label="Dirección" error={errors.direccion?.message}>
              <textarea
                {...register('direccion')}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Calle, número, colonia"
              />
            </FieldWrapper>

            <div className="grid grid-cols-4 gap-4">
              <FieldWrapper label="Ciudad" error={errors.ciudad?.message}>
                <input
                  type="text"
                  {...register('ciudad')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: Guadalajara"
                />
              </FieldWrapper>

              <FieldWrapper label="Estado" error={errors.estado?.message}>
                <input
                  type="text"
                  {...register('estado')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: Jalisco"
                />
              </FieldWrapper>

              <FieldWrapper label="CP" error={errors.codigo_postal?.message}>
                <input
                  type="text"
                  {...register('codigo_postal')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="44100"
                  maxLength={10}
                />
              </FieldWrapper>

              <FieldWrapper label="País" error={errors.pais?.message}>
                <input
                  type="text"
                  {...register('pais')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </FieldWrapper>
            </div>
          </div>
        </div>

        {/* TÉRMINOS COMERCIALES */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Términos Comerciales</h3>

          <div className="grid grid-cols-3 gap-4">
            <FieldWrapper
              label="Días de Crédito"
              error={errors.dias_credito?.message}
              helperText="0 = Pago de contado"
            >
              <input
                type="number"
                min="0"
                {...register('dias_credito')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </FieldWrapper>

            <FieldWrapper
              label="Días de Entrega"
              error={errors.dias_entrega_estimados?.message}
              helperText="Tiempo estimado"
            >
              <input
                type="number"
                min="1"
                {...register('dias_entrega_estimados')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Opcional"
              />
            </FieldWrapper>

            <FieldWrapper
              label="Monto Mínimo de Compra"
              error={errors.monto_minimo_compra?.message}
              helperText="Monto mínimo (MXN)"
            >
              <input
                type="number"
                min="0"
                step="0.01"
                {...register('monto_minimo_compra')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </FieldWrapper>
          </div>
        </div>

        {/* NOTAS */}
        <FieldWrapper label="Notas" error={errors.notas?.message}>
          <textarea
            {...register('notas')}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Notas adicionales sobre el proveedor"
          />
        </FieldWrapper>

        {/* ACTIVO */}
        <FieldWrapper>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('activo')}
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Proveedor activo
            </span>
          </label>
        </FieldWrapper>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
          >
            {esEdicion ? 'Actualizar' : 'Crear'} Proveedor
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProveedorFormModal;
