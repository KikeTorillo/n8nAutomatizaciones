/**
 * ====================================================================
 * CLIENTE FORM - Formulario con React Hook Form + Zod
 * ====================================================================
 *
 * Formulario reutilizable para crear/editar clientes.
 * Migrado a React Hook Form + Zod (Enero 2026).
 */
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  Save,
  Camera,
  X,
  Loader2,
  User,
  Tag,
  Building2,
  UserCircle,
  MapPin,
  Tags,
  MessageCircle,
  Send,
} from 'lucide-react';
import {
  Button,
  Checkbox,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import { useServiciosDashboard } from '@/hooks/useEstadisticas';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useUploadArchivo } from '@/hooks/useStorage';
import { useToast } from '@/hooks/useToast';
import { useEstadosMexico, usePaises } from '@/hooks/useUbicaciones';
import { listasPreciosApi } from '@/services/api/endpoints';
import EtiquetasSelector from './EtiquetasSelector';
import {
  clienteSchema,
  clienteDefaults,
  clienteToFormData,
  formDataToApi,
} from '@/schemas/cliente.schema';

/**
 * Formulario reutilizable para crear/editar clientes
 * @param {Object} props
 * @param {Object} props.cliente - Cliente a editar (null para crear)
 * @param {Function} props.onSubmit - Callback con datos y etiquetaIds
 * @param {boolean} props.isLoading - Estado de carga del submit
 */
function ClienteForm({ cliente = null, onSubmit, isLoading = false }) {
  const toast = useToast();
  const uploadMutation = useUploadArchivo();

  // Estado para etiquetas (separado del form porque se guarda aparte)
  const [etiquetaIds, setEtiquetaIds] = useState([]);

  // Estado para foto
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  // React Hook Form con Zod
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: clienteDefaults,
  });

  // Watch del tipo para campos condicionales
  const tipoCliente = watch('tipo');

  // Cargar datos de profesionales para preferencias
  const { data: profesionalesData } = useProfesionales();
  const profesionales = profesionalesData?.profesionales || [];

  // Cargar servicios para favoritos (reservado para uso futuro)
  const { data: _serviciosData } = useServiciosDashboard();
  // const servicios = _serviciosData?.servicios || [];

  // Cargar listas de precios
  const { data: listasPreciosData } = useQuery({
    queryKey: ['listas-precios', { soloActivas: true }],
    queryFn: () => listasPreciosApi.listar({ soloActivas: true }),
    staleTime: 1000 * 60 * 5,
  });
  const listasPrecios = listasPreciosData?.data?.data || [];

  // Cargar estados y paises
  const { data: estados = [] } = useEstadosMexico();
  const { data: paises = [] } = usePaises();

  // Cargar datos del cliente cuando cambia
  useEffect(() => {
    if (cliente) {
      const formData = clienteToFormData(cliente);
      reset(formData);
      setFotoPreview(cliente.foto_url || null);

      // Cargar etiquetas
      if (cliente.etiquetas && Array.isArray(cliente.etiquetas)) {
        setEtiquetaIds(cliente.etiquetas.map((e) => e.id));
      }
    }
  }, [cliente, reset]);

  // Handler para foto
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

  const handleEliminarFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
  };

  // Submit del formulario
  const onFormSubmit = async (formData) => {
    try {
      // Subir foto si hay archivo nuevo
      let fotoUrlFinal = formData.foto_url;
      if (fotoFile) {
        const resultado = await uploadMutation.mutateAsync({
          file: fotoFile,
          folder: 'clientes',
          isPublic: true,
        });
        fotoUrlFinal = resultado?.url || resultado;
      }

      // Transformar datos al formato del backend
      const dataToSubmit = formDataToApi(formData, fotoUrlFinal);

      setFotoFile(null);

      // Pasar datos y etiquetas al padre
      onSubmit(dataToSubmit, etiquetaIds);
    } catch {
      toast.error('No se pudo subir la foto');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Foto del Cliente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Foto del Cliente
        </h3>

        <div className="flex items-center gap-6">
          <div className="flex-shrink-0 relative">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700 overflow-hidden">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Foto del cliente"
                  className="w-full h-full object-cover"
                  onError={() => setFotoPreview(null)}
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-primary-600 text-white rounded-full p-2 cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="sr-only"
                disabled={uploadMutation.isPending}
              />
            </label>
            {fotoPreview && (
              <button
                type="button"
                onClick={handleEliminarFoto}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {uploadMutation.isPending && (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary-600 dark:text-primary-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Haz clic en el icono de camara para subir una foto del cliente.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PNG, JPG o WEBP. Maximo 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Tipo de Cliente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Tipo de Cliente
        </h3>

        <Controller
          name="tipo"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Persona */}
              <label
                className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  field.value === 'persona'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  {...field}
                  value="persona"
                  checked={field.value === 'persona'}
                  onChange={() => field.onChange('persona')}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    field.value === 'persona'
                      ? 'bg-primary-100 dark:bg-primary-800'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <UserCircle
                    className={`w-5 h-5 ${
                      field.value === 'persona'
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      field.value === 'persona'
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Persona Fisica
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cliente individual
                  </p>
                </div>
              </label>

              {/* Empresa */}
              <label
                className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  field.value === 'empresa'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  {...field}
                  value="empresa"
                  checked={field.value === 'empresa'}
                  onChange={() => field.onChange('empresa')}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    field.value === 'empresa'
                      ? 'bg-primary-100 dark:bg-primary-800'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <Building2
                    className={`w-5 h-5 ${
                      field.value === 'empresa'
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      field.value === 'empresa'
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Empresa
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cliente B2B con facturacion
                  </p>
                </div>
              </label>
            </div>
          )}
        />

        {/* Campos condicionales para empresa */}
        {tipoCliente === 'empresa' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="rfc"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    RFC
                  </label>
                  <Input
                    {...field}
                    placeholder="XAXX010101000"
                    maxLength={13}
                    className="uppercase"
                    error={errors.rfc?.message}
                  />
                  {errors.rfc && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.rfc.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    RFC mexicano para facturacion
                  </p>
                </div>
              )}
            />

            <Controller
              name="razon_social"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Razon Social
                  </label>
                  <Input {...field} placeholder="Empresa S.A. de C.V." />
                </div>
              )}
            />
          </div>
        )}
      </div>

      {/* Informacion Basica */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Informacion Basica
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Controller
              name="nombre_completo"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {tipoCliente === 'empresa' ? 'Nombre Comercial *' : 'Nombre Completo *'}
                  </label>
                  <Input
                    {...field}
                    placeholder={tipoCliente === 'empresa' ? 'Mi Empresa' : 'Juan Perez Garcia'}
                    error={errors.nombre_completo?.message}
                  />
                  {errors.nombre_completo && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.nombre_completo.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          <Controller
            name="telefono"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefono *
                </label>
                <Input
                  {...field}
                  type="tel"
                  placeholder="5512345678"
                  maxLength={10}
                  error={errors.telefono?.message}
                />
                {errors.telefono && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.telefono.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <Input
                  {...field}
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  error={errors.email?.message}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>
            )}
          />

          {tipoCliente === 'persona' && (
            <Controller
              name="fecha_nacimiento"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <Input {...field} type="date" />
                </div>
              )}
            />
          )}
        </div>
      </div>

      {/* Direccion */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          Direccion
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Controller
              name="calle"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Calle y Numero
                  </label>
                  <Input {...field} placeholder="Av. Insurgentes Sur 1234, Int. 5" />
                </div>
              )}
            />
          </div>

          <Controller
            name="colonia"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Colonia
                </label>
                <Input {...field} placeholder="Del Valle" />
              </div>
            )}
          />

          <Controller
            name="ciudad"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ciudad
                </label>
                <Input {...field} placeholder="Ciudad de Mexico" />
              </div>
            )}
          />

          <Controller
            name="estado_id"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <Select
                  {...field}
                  placeholder="Selecciona un estado"
                  options={estados.map((estado) => ({
                    value: estado.id.toString(),
                    label: estado.nombre || estado.nombre_corto,
                  }))}
                />
              </div>
            )}
          />

          <Controller
            name="codigo_postal"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Codigo Postal
                </label>
                <Input
                  {...field}
                  placeholder="03100"
                  maxLength={5}
                  error={errors.codigo_postal?.message}
                />
                {errors.codigo_postal && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.codigo_postal.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="pais_id"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pais
                </label>
                <Select
                  {...field}
                  options={paises.map((pais) => ({
                    value: pais.id.toString(),
                    label: pais.nombre,
                  }))}
                />
              </div>
            )}
          />
        </div>
      </div>

      {/* Notas Medicas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Informacion Adicional
        </h3>

        <Controller
          name="notas_medicas"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              label="Notas Medicas"
              rows={3}
              placeholder="Alergias, condiciones medicas relevantes, etc."
            />
          )}
        />
      </div>

      {/* Canales Digitales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-500" />
          Canales de Contacto Digital
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Configura canales adicionales para comunicacion automatica con el cliente
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="telegram_chat_id"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-500" />
                  Telegram Chat ID
                </label>
                <Input {...field} placeholder="123456789" />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ID numerico del chat de Telegram para notificaciones
                </p>
              </div>
            )}
          />

          <Controller
            name="whatsapp_phone"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  WhatsApp
                </label>
                <Input
                  {...field}
                  placeholder="+521XXXXXXXXXX"
                  error={errors.whatsapp_phone?.message}
                />
                {errors.whatsapp_phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.whatsapp_phone.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Numero con codigo de pais para mensajes de WhatsApp
                </p>
              </div>
            )}
          />
        </div>
      </div>

      {/* Preferencias */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Preferencias
        </h3>

        <div className="space-y-4">
          <Controller
            name="profesional_preferido"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Profesional Preferido"
                placeholder="Sin preferencia"
                options={profesionales.map((prof) => ({
                  value: prof.id.toString(),
                  label: prof.nombre_completo,
                }))}
              />
            )}
          />

          {listasPrecios.length > 0 && (
            <Controller
              name="lista_precios_id"
              control={control}
              render={({ field }) => (
                <div>
                  <Select
                    {...field}
                    label={
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4 text-primary-500" />
                        Lista de Precios
                      </span>
                    }
                    placeholder="Sin lista asignada (precios estandar)"
                    options={listasPrecios.map((lista) => ({
                      value: lista.id.toString(),
                      label: `${lista.codigo} - ${lista.nombre}${
                        lista.descuento_global_pct > 0 ? ` (${lista.descuento_global_pct}% dto.)` : ''
                      }`,
                    }))}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Asigna una lista de precios para aplicar descuentos automaticos en el POS
                  </p>
                </div>
              )}
            />
          )}
        </div>
      </div>

      {/* Etiquetas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Tags className="w-5 h-5 text-primary-500" />
          Etiquetas
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Asigna etiquetas para segmentar y organizar este cliente
        </p>

        <EtiquetasSelector
          value={etiquetaIds}
          onChange={setEtiquetaIds}
          placeholder="Buscar o seleccionar etiquetas..."
          maxTags={10}
        />
      </div>

      {/* Configuracion */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Configuracion
        </h3>

        <div className="space-y-3">
          <Controller
            name="marketing_permitido"
            control={control}
            render={({ field }) => (
              <Checkbox
                label="Permitir envio de mensajes de marketing"
                description="El cliente recibira promociones y novedades"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />

          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <Checkbox
                label="Cliente activo"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>
      </div>

      {/* Botones de Accion */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          isLoading={isLoading || uploadMutation.isPending || isSubmitting}
          disabled={isLoading || uploadMutation.isPending || isSubmitting}
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Subiendo foto...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {cliente ? 'Actualizar Cliente' : 'Crear Cliente'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default ClienteForm;
