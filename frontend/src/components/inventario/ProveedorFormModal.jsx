import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Phone, MapPin, ChevronDown } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FieldWrapper from '@/components/forms/FieldWrapper';
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            {/* Fila 1: País, Estado, Ciudad, CP */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* PAÍS */}
              <FieldWrapper label="País">
                <div className="relative">
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                    value={paisIdSeleccionado || ''}
                    onChange={(e) => {
                      const paisId = e.target.value ? Number(e.target.value) : null;
                      setPaisIdSeleccionado(paisId);
                      setEstadoIdSeleccionado(null);
                      setCiudadIdSeleccionado(null);
                    }}
                    disabled={loadingPaises}
                  >
                    <option value="">Seleccionar país</option>
                    {paises.map((pais) => (
                      <option key={pais.id} value={pais.id}>
                        {pais.nombre}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </FieldWrapper>

              {/* ESTADO */}
              <FieldWrapper label="Estado">
                <div className="relative">
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </FieldWrapper>

              {/* CIUDAD */}
              <FieldWrapper label="Ciudad">
                <div className="relative">
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </FieldWrapper>

              {/* CP */}
              <FieldWrapper label="CP" error={errors.codigo_postal?.message}>
                <input
                  type="text"
                  {...register('codigo_postal')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="44100"
                  maxLength={10}
                />
              </FieldWrapper>
            </div>

            {/* Fila 2: Dirección completa */}
            <FieldWrapper label="Dirección" error={errors.direccion?.message}>
              <textarea
                {...register('direccion')}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Calle, número, colonia"
              />
            </FieldWrapper>
          </div>
        </div>

        {/* TÉRMINOS COMERCIALES */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Términos Comerciales</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
