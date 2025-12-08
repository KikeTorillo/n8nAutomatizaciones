import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Phone, MapPin } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import { useCrearProveedor, useActualizarProveedor } from '@/hooks/useProveedores';
import { useToast } from '@/hooks/useToast';
import { usePaises, useEstadosPorPais, useCiudadesPorEstado } from '@/hooks/useUbicaciones';

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

  // Dirección (IDs normalizados)
  direccion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  codigo_postal: z.string().max(10, 'Máximo 10 caracteres').optional(),

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
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && proveedor;

  // Estados para cascada de ubicaciones (IDs)
  const [paisIdSeleccionado, setPaisIdSeleccionado] = useState(null);
  const [estadoIdSeleccionado, setEstadoIdSeleccionado] = useState(null);
  const [ciudadIdSeleccionado, setCiudadIdSeleccionado] = useState(null);

  // Queries de ubicaciones
  const { data: paises = [], isLoading: loadingPaises } = usePaises();
  const { data: estados = [], isLoading: loadingEstados } = useEstadosPorPais(paisIdSeleccionado);
  const { data: ciudades = [], isLoading: loadingCiudades } = useCiudadesPorEstado(estadoIdSeleccionado);

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
    setValue,
    watch,
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
      codigo_postal: '',
      dias_credito: 0,
      dias_entrega_estimados: '',
      monto_minimo_compra: '',
      notas: '',
      activo: true,
    },
  });

  // Limpiar formulario al abrir modal en modo creación
  useEffect(() => {
    if (isOpen && !esEdicion) {
      reset({
        nombre: '',
        razon_social: '',
        rfc: '',
        telefono: '',
        email: '',
        sitio_web: '',
        direccion: '',
        codigo_postal: '',
        dias_credito: 0,
        dias_entrega_estimados: '',
        monto_minimo_compra: '',
        notas: '',
        activo: true,
      });
      // Reset cascada de ubicaciones
      setEstadoIdSeleccionado(null);
      setCiudadIdSeleccionado(null);
      // El país default se setea en el siguiente useEffect
      setPaisIdSeleccionado(null);
    }
  }, [isOpen, esEdicion, reset]);

  // Setear país default (México) cuando se cargan los países
  useEffect(() => {
    if (paises.length > 0 && !paisIdSeleccionado && !esEdicion && isOpen) {
      const mexicoDefault = paises.find(p => p.es_default) || paises.find(p => p.codigo === 'MEX') || paises[0];
      if (mexicoDefault) {
        setPaisIdSeleccionado(mexicoDefault.id);
      }
    }
  }, [paises, paisIdSeleccionado, esEdicion, isOpen]);

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
        codigo_postal: proveedor.codigo_postal || '',
        dias_credito: proveedor.dias_credito || 0,
        dias_entrega_estimados: proveedor.dias_entrega_estimados || '',
        monto_minimo_compra: proveedor.monto_minimo_compra || '',
        notas: proveedor.notas || '',
        activo: proveedor.activo ?? true,
      });

      // Cargar IDs de ubicación al editar
      if (proveedor.pais_id) {
        setPaisIdSeleccionado(proveedor.pais_id);
      }
      if (proveedor.estado_id) {
        setEstadoIdSeleccionado(proveedor.estado_id);
      }
      if (proveedor.ciudad_id) {
        setCiudadIdSeleccionado(proveedor.ciudad_id);
      }
    } else if (!esEdicion) {
      reset({
        nombre: '',
        razon_social: '',
        rfc: '',
        telefono: '',
        email: '',
        sitio_web: '',
        direccion: '',
        codigo_postal: '',
        dias_credito: 0,
        dias_entrega_estimados: '',
        monto_minimo_compra: '',
        notas: '',
        activo: true,
      });
      // Reset cascada
      setPaisIdSeleccionado(null);
      setEstadoIdSeleccionado(null);
      setCiudadIdSeleccionado(null);
    }
  }, [esEdicion, proveedor, reset]);

  // Función para cerrar modal y resetear formulario
  const handleCloseModal = () => {
    reset();
    setPaisIdSeleccionado(null);
    setEstadoIdSeleccionado(null);
    setCiudadIdSeleccionado(null);
    onClose();
  };

  // Submit handler
  const onSubmit = (data) => {
    // Sanitizar datos opcionales y enviar IDs de ubicación
    const payload = {
      nombre: data.nombre,
      razon_social: data.razon_social || undefined,
      rfc: data.rfc || undefined,
      telefono: data.telefono || undefined,
      email: data.email || undefined,
      sitio_web: data.sitio_web || undefined,
      direccion: data.direccion || undefined,
      codigo_postal: data.codigo_postal || undefined,
      // IDs de ubicación normalizados
      pais_id: paisIdSeleccionado || undefined,
      estado_id: estadoIdSeleccionado || undefined,
      ciudad_id: ciudadIdSeleccionado || undefined,
      dias_credito: data.dias_credito,
      dias_entrega_estimados: data.dias_entrega_estimados || undefined,
      monto_minimo_compra: data.monto_minimo_compra || undefined,
      notas: data.notas || undefined,
      activo: data.activo,
    };

    if (esEdicion) {
      mutation.mutateAsync({ id: proveedor.id, data: payload })
        .then(() => {
          showSuccess('Proveedor actualizado correctamente');
          handleCloseModal();
        })
        .catch((err) => {
          showError(err.message || 'Error al actualizar proveedor');
        });
    } else {
      mutation.mutateAsync(payload)
        .then(() => {
          showSuccess('Proveedor creado correctamente');
          handleCloseModal();
        })
        .catch((err) => {
          showError(err.message || 'Error al crear proveedor');
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre Comercial"
              {...register('nombre')}
              placeholder="Ej: Distribuidora ABC"
              error={errors.nombre?.message}
              required
            />

            <Input
              label="Razón Social"
              {...register('razon_social')}
              placeholder="Ej: ABC Distribuidora S.A. de C.V."
              error={errors.razon_social?.message}
            />

            <Input
              label="RFC"
              {...register('rfc')}
              placeholder="Ej: XAXX010101000"
              maxLength={13}
              error={errors.rfc?.message}
            />
          </div>
        </div>

        {/* CONTACTO */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-gray-600" />
            Contacto
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              type="tel"
              label="Teléfono"
              {...register('telefono')}
              placeholder="Ej: +52 55 1234 5678"
              error={errors.telefono?.message}
            />

            <Input
              type="email"
              label="Email"
              {...register('email')}
              placeholder="contacto@proveedor.com"
              error={errors.email?.message}
            />

            <Input
              type="url"
              label="Sitio Web"
              {...register('sitio_web')}
              placeholder="https://proveedor.com"
              error={errors.sitio_web?.message}
            />
          </div>
        </div>

        {/* DIRECCIÓN */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-gray-600" />
            Dirección
          </h3>

          <div className="space-y-4">
            {/* Fila 1: País, Estado, Ciudad, CP */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Select
                label="País"
                value={paisIdSeleccionado || ''}
                onChange={(e) => {
                  const paisId = e.target.value ? Number(e.target.value) : null;
                  setPaisIdSeleccionado(paisId);
                  setEstadoIdSeleccionado(null);
                  setCiudadIdSeleccionado(null);
                }}
                disabled={loadingPaises}
                placeholder="Seleccionar país"
              >
                <option value="">Seleccionar país</option>
                {paises.map((pais) => (
                  <option key={pais.id} value={pais.id}>
                    {pais.nombre}
                  </option>
                ))}
              </Select>

              <Select
                label="Estado"
                value={estadoIdSeleccionado || ''}
                onChange={(e) => {
                  const estadoId = e.target.value ? Number(e.target.value) : null;
                  setEstadoIdSeleccionado(estadoId);
                  setCiudadIdSeleccionado(null);
                }}
                disabled={!paisIdSeleccionado || loadingEstados}
              >
                <option value="">
                  {loadingEstados ? 'Cargando...' : 'Seleccionar estado'}
                </option>
                {estados.map((estado) => (
                  <option key={estado.id} value={estado.id}>
                    {estado.nombre_corto || estado.nombre}
                  </option>
                ))}
              </Select>

              <Select
                label="Ciudad"
                value={ciudadIdSeleccionado || ''}
                onChange={(e) => {
                  const ciudadId = e.target.value ? Number(e.target.value) : null;
                  setCiudadIdSeleccionado(ciudadId);
                }}
                disabled={!estadoIdSeleccionado || loadingCiudades}
              >
                <option value="">
                  {loadingCiudades ? 'Cargando...' : 'Seleccionar ciudad'}
                </option>
                {ciudades.map((ciudad) => (
                  <option key={ciudad.id} value={ciudad.id}>
                    {ciudad.nombre}
                  </option>
                ))}
              </Select>

              <Input
                label="CP"
                {...register('codigo_postal')}
                placeholder="44100"
                maxLength={10}
                error={errors.codigo_postal?.message}
              />
            </div>

            {/* Fila 2: Dirección completa */}
            <Textarea
              label="Dirección"
              {...register('direccion')}
              rows={2}
              placeholder="Calle, número, colonia"
              error={errors.direccion?.message}
            />
          </div>
        </div>

        {/* TÉRMINOS COMERCIALES */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Términos Comerciales</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              type="number"
              label="Días de Crédito"
              {...register('dias_credito')}
              min="0"
              error={errors.dias_credito?.message}
              helper="0 = Pago de contado"
            />

            <Input
              type="number"
              label="Días de Entrega"
              {...register('dias_entrega_estimados')}
              min="1"
              placeholder="Opcional"
              error={errors.dias_entrega_estimados?.message}
              helper="Tiempo estimado"
            />

            <Input
              type="number"
              label="Monto Mínimo de Compra"
              {...register('monto_minimo_compra')}
              min="0"
              step="0.01"
              placeholder="0.00"
              prefix="$"
              error={errors.monto_minimo_compra?.message}
              helper="Monto mínimo (MXN)"
            />
          </div>
        </div>

        {/* NOTAS */}
        <Textarea
          label="Notas"
          {...register('notas')}
          rows={3}
          placeholder="Notas adicionales sobre el proveedor"
          error={errors.notas?.message}
        />

        {/* ACTIVO */}
        <Checkbox
          label="Proveedor activo"
          {...register('activo')}
        />

        {/* Botones */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
            className="w-full sm:w-auto"
          >
            {esEdicion ? 'Actualizar' : 'Crear'} Proveedor
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProveedorFormModal;
