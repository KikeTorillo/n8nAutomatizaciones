import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, Camera, X, Loader2, User, Tag, Building2, UserCircle, MapPin, Tags, MessageCircle, Send } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import { useServiciosDashboard } from '@/hooks/useEstadisticas';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useUploadArchivo } from '@/hooks/useStorage';
import { useToast } from '@/hooks/useToast';
import { useEstadosMexico, usePaises } from '@/hooks/useUbicaciones';
import { listasPreciosApi } from '@/services/api/endpoints';
import EtiquetasSelector from './EtiquetasSelector';
import { useAsignarEtiquetasCliente } from '@/hooks/useEtiquetasClientes';

/**
 * Formulario reutilizable para crear/editar clientes
 */
function ClienteForm({ cliente = null, onSubmit, isLoading = false }) {
  const toast = useToast();
  const uploadMutation = useUploadArchivo();
  const asignarEtiquetas = useAsignarEtiquetasCliente();

  // Estado para etiquetas (separado del formData porque se guarda aparte)
  const [etiquetaIds, setEtiquetaIds] = useState([]);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    telefono: '',
    email: '',
    fecha_nacimiento: '',
    notas_medicas: '',
    marketing_permitido: true,
    activo: true,
    lista_precios_id: '',
    preferencias: {
      profesional_preferido: '',
      servicios_favoritos: [],
    },
    foto_url: '',
    // Nuevos campos (Ene 2026)
    tipo: 'persona',  // 'persona' o 'empresa'
    rfc: '',
    razon_social: '',
    // Dirección estructurada
    calle: '',
    colonia: '',
    ciudad: '',
    estado_id: '',
    codigo_postal: '',
    pais_id: '1',  // México por defecto
    // Canales digitales (Ene 2026 - Fase 3)
    telegram_chat_id: '',
    whatsapp_phone: '',
  });

  const [errors, setErrors] = useState({});
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  // Cargar datos de profesionales y servicios para preferencias
  const { data: profesionalesData } = useProfesionales();
  const profesionales = profesionalesData?.profesionales || [];
  const { data: serviciosData } = useServiciosDashboard();
  const servicios = serviciosData?.servicios || [];

  // Cargar listas de precios disponibles
  const { data: listasPreciosData } = useQuery({
    queryKey: ['listas-precios', { soloActivas: true }],
    queryFn: () => listasPreciosApi.listar({ soloActivas: true }),
    staleTime: 1000 * 60 * 5, // 5 min
  });
  const listasPrecios = listasPreciosData?.data?.data || [];

  // Cargar estados de México y países (Ene 2026)
  const { data: estados = [] } = useEstadosMexico();
  const { data: paises = [] } = usePaises();

  // Si hay un cliente, cargar sus datos
  // ⚠️ IMPORTANTE: Mapear campos del backend a frontend
  // Backend devuelve: nombre, alergias, profesional_preferido_id
  // Frontend usa: nombre_completo, notas_medicas, preferencias.profesional_preferido
  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre_completo: cliente.nombre || '', // Backend devuelve "nombre"
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        fecha_nacimiento: cliente.fecha_nacimiento
          ? cliente.fecha_nacimiento.split('T')[0]
          : '',
        notas_medicas: cliente.alergias || '', // Backend devuelve "alergias"
        marketing_permitido: cliente.marketing_permitido ?? true,
        activo: cliente.activo ?? true,
        lista_precios_id: cliente.lista_precios_id?.toString() || '',
        preferencias: {
          profesional_preferido: cliente.profesional_preferido_id || '', // Backend devuelve "profesional_preferido_id"
          servicios_favoritos: [], // Este campo NO existe en backend
        },
        foto_url: cliente.foto_url || '',
        // Nuevos campos (Ene 2026)
        tipo: cliente.tipo || 'persona',
        rfc: cliente.rfc || '',
        razon_social: cliente.razon_social || '',
        // Dirección estructurada
        calle: cliente.calle || '',
        colonia: cliente.colonia || '',
        ciudad: cliente.ciudad || '',
        estado_id: cliente.estado_id?.toString() || '',
        codigo_postal: cliente.codigo_postal || '',
        pais_id: cliente.pais_id?.toString() || '1',
        // Canales digitales (Ene 2026 - Fase 3)
        telegram_chat_id: cliente.telegram_chat_id || '',
        whatsapp_phone: cliente.whatsapp_phone || '',
      });
      setFotoPreview(cliente.foto_url || null);

      // Cargar etiquetas del cliente
      if (cliente.etiquetas && Array.isArray(cliente.etiquetas)) {
        setEtiquetaIds(cliente.etiquetas.map((e) => e.id));
      }
    }
  }, [cliente]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePreferenciasChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      preferencias: {
        ...prev.preferencias,
        [field]: value,
      },
    }));
  };

  const handleServiciosFavoritosChange = (servicioId) => {
    const servicios = formData.preferencias.servicios_favoritos || [];
    const yaExiste = servicios.includes(servicioId);

    const nuevosServicios = yaExiste
      ? servicios.filter((id) => id !== servicioId)
      : [...servicios, servicioId];

    handlePreferenciasChange('servicios_favoritos', nuevosServicios);
  };

  // Handler para seleccionar archivo de foto
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

  // Handler para eliminar foto
  const handleEliminarFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    setFormData((prev) => ({ ...prev, foto_url: '' }));
  };

  const validate = () => {
    const newErrors = {};

    // Campos requeridos
    if (!formData.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre es requerido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (formData.telefono.length !== 10) {
      newErrors.telefono = 'El teléfono debe tener exactamente 10 dígitos';
    }

    // Email (opcional, pero si se proporciona debe ser válido)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    // RFC (solo para empresas, opcional pero si se proporciona debe ser válido)
    if (formData.tipo === 'empresa' && formData.rfc) {
      const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
      if (!rfcPattern.test(formData.rfc)) {
        newErrors.rfc = 'El RFC no es válido (formato: XXXX000000XXX)';
      }
    }

    // Código postal (opcional, pero si se proporciona debe ser de 5 dígitos)
    if (formData.codigo_postal && !/^[0-9]{5}$/.test(formData.codigo_postal)) {
      newErrors.codigo_postal = 'El código postal debe ser de 5 dígitos';
    }

    // WhatsApp (opcional, pero si se proporciona debe tener formato internacional)
    if (formData.whatsapp_phone && !/^\+\d{10,15}$/.test(formData.whatsapp_phone)) {
      newErrors.whatsapp_phone = 'Formato internacional: +521XXXXXXXXXX';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      // Subir foto si hay un archivo nuevo
      let fotoUrlFinal = formData.foto_url;
      if (fotoFile) {
        const resultado = await uploadMutation.mutateAsync({
          file: fotoFile,
          folder: 'clientes',
          isPublic: true,
        });
        fotoUrlFinal = resultado?.url || resultado;
      }

      // Preparar datos para enviar
      // ⚠️ CRÍTICO: Mapear campos del frontend a los nombres que espera el backend
      // Backend espera: nombre, alergias, profesional_preferido_id
      // Frontend usa: nombre_completo, notas_medicas, preferencias.profesional_preferido
      const dataToSubmit = {
        nombre: formData.nombre_completo, // Backend espera "nombre" no "nombre_completo"
        telefono: formData.telefono,
        email: formData.email?.trim() || undefined,
        fecha_nacimiento: formData.fecha_nacimiento?.trim() || undefined,
        alergias: formData.notas_medicas?.trim() || undefined, // Backend espera "alergias"
        marketing_permitido: formData.marketing_permitido,
        activo: formData.activo,
        lista_precios_id: formData.lista_precios_id
          ? parseInt(formData.lista_precios_id)
          : null, // null para quitar asignación
        profesional_preferido_id: formData.preferencias.profesional_preferido
          ? parseInt(formData.preferencias.profesional_preferido)
          : undefined,
        foto_url: fotoUrlFinal || undefined,
        // Nota: servicios_favoritos NO existe en backend, se omite

        // Nuevos campos (Ene 2026)
        tipo: formData.tipo,
        // RFC y razón social solo para empresas
        rfc: formData.tipo === 'empresa' ? (formData.rfc?.trim().toUpperCase() || undefined) : undefined,
        razon_social: formData.tipo === 'empresa' ? (formData.razon_social?.trim() || undefined) : undefined,
        // Dirección estructurada
        calle: formData.calle?.trim() || undefined,
        colonia: formData.colonia?.trim() || undefined,
        ciudad: formData.ciudad?.trim() || undefined,
        estado_id: formData.estado_id ? parseInt(formData.estado_id) : undefined,
        codigo_postal: formData.codigo_postal?.trim() || undefined,
        pais_id: formData.pais_id ? parseInt(formData.pais_id) : 1,
        // Canales digitales (Ene 2026 - Fase 3)
        telegram_chat_id: formData.telegram_chat_id?.trim() || undefined,
        whatsapp_phone: formData.whatsapp_phone?.trim() || undefined,
      };

      setFotoFile(null); // Limpiar archivo después de subir

      // Pasar etiquetaIds junto con los datos del cliente
      // El componente padre manejará la asignación de etiquetas después de crear/actualizar
      onSubmit(dataToSubmit, etiquetaIds);
    } catch (error) {
      toast.error('No se pudo subir la foto');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Foto del Cliente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Foto del Cliente
        </h3>

        <div className="flex items-center gap-6">
          {/* Preview con botón de subir */}
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
            {/* Botón de cámara para subir */}
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
            {/* Botón de eliminar */}
            {fotoPreview && (
              <button
                type="button"
                onClick={handleEliminarFoto}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {/* Loading de subida */}
            {uploadMutation.isPending && (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary-600 dark:text-primary-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Instrucciones */}
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Haz clic en el ícono de cámara para subir una foto del cliente.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PNG, JPG o WEBP. Máximo 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Tipo de Cliente (Ene 2026) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Tipo de Cliente
        </h3>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Persona */}
          <label
            className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              formData.tipo === 'persona'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <input
              type="radio"
              name="tipo"
              value="persona"
              checked={formData.tipo === 'persona'}
              onChange={handleChange}
              className="sr-only"
            />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              formData.tipo === 'persona'
                ? 'bg-primary-100 dark:bg-primary-800'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <UserCircle className={`w-5 h-5 ${
                formData.tipo === 'persona'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
            </div>
            <div>
              <p className={`font-medium ${
                formData.tipo === 'persona'
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                Persona Física
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cliente individual
              </p>
            </div>
          </label>

          {/* Empresa */}
          <label
            className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              formData.tipo === 'empresa'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <input
              type="radio"
              name="tipo"
              value="empresa"
              checked={formData.tipo === 'empresa'}
              onChange={handleChange}
              className="sr-only"
            />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              formData.tipo === 'empresa'
                ? 'bg-primary-100 dark:bg-primary-800'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <Building2 className={`w-5 h-5 ${
                formData.tipo === 'empresa'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
            </div>
            <div>
              <p className={`font-medium ${
                formData.tipo === 'empresa'
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                Empresa
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cliente B2B con facturación
              </p>
            </div>
          </label>
        </div>

        {/* Campos condicionales para empresa */}
        {formData.tipo === 'empresa' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                RFC
              </label>
              <Input
                name="rfc"
                value={formData.rfc}
                onChange={handleChange}
                placeholder="XAXX010101000"
                maxLength={13}
                error={errors.rfc}
                className="uppercase"
              />
              {errors.rfc && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rfc}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                RFC mexicano para facturación
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Razón Social
              </label>
              <Input
                name="razon_social"
                value={formData.razon_social}
                onChange={handleChange}
                placeholder="Empresa S.A. de C.V."
              />
            </div>
          </div>
        )}
      </div>

      {/* Información Básica */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Información Básica
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {formData.tipo === 'empresa' ? 'Nombre Comercial *' : 'Nombre Completo *'}
            </label>
            <Input
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              placeholder={formData.tipo === 'empresa' ? 'Mi Empresa' : 'Juan Pérez García'}
              error={errors.nombre_completo}
            />
            {errors.nombre_completo && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre_completo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teléfono *
            </label>
            <Input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="5512345678"
              maxLength={10}
              error={errors.telefono}
            />
            {errors.telefono && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.telefono}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="cliente@ejemplo.com"
              error={errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Fecha de nacimiento solo para personas físicas */}
          {formData.tipo === 'persona' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Nacimiento
              </label>
              <Input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dirección Estructurada (Ene 2026) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          Dirección
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Calle y Número
            </label>
            <Input
              name="calle"
              value={formData.calle}
              onChange={handleChange}
              placeholder="Av. Insurgentes Sur 1234, Int. 5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Colonia
            </label>
            <Input
              name="colonia"
              value={formData.colonia}
              onChange={handleChange}
              placeholder="Del Valle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ciudad
            </label>
            <Input
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              placeholder="Ciudad de México"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <Select
              name="estado_id"
              value={formData.estado_id}
              onChange={handleChange}
              placeholder="Selecciona un estado"
              options={estados.map((estado) => ({
                value: estado.id.toString(),
                label: estado.nombre || estado.nombre_corto,
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código Postal
            </label>
            <Input
              name="codigo_postal"
              value={formData.codigo_postal}
              onChange={handleChange}
              placeholder="03100"
              maxLength={5}
              error={errors.codigo_postal}
            />
            {errors.codigo_postal && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.codigo_postal}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              País
            </label>
            <Select
              name="pais_id"
              value={formData.pais_id}
              onChange={handleChange}
              options={paises.map((pais) => ({
                value: pais.id.toString(),
                label: pais.nombre,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Notas Médicas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Información Adicional
        </h3>

        <Textarea
          name="notas_medicas"
          label="Notas Médicas"
          value={formData.notas_medicas}
          onChange={handleChange}
          rows={3}
          placeholder="Alergias, condiciones médicas relevantes, etc."
        />
      </div>

      {/* Canales de Contacto Digital (Ene 2026 - Fase 3) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-500" />
          Canales de Contacto Digital
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Configura canales adicionales para comunicación automática con el cliente
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-500" />
              Telegram Chat ID
            </label>
            <Input
              name="telegram_chat_id"
              value={formData.telegram_chat_id}
              onChange={handleChange}
              placeholder="123456789"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              ID numérico del chat de Telegram para notificaciones
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              WhatsApp
            </label>
            <Input
              name="whatsapp_phone"
              value={formData.whatsapp_phone}
              onChange={handleChange}
              placeholder="+521XXXXXXXXXX"
              error={errors.whatsapp_phone}
            />
            {errors.whatsapp_phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.whatsapp_phone}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Número con código de país para mensajes de WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* Preferencias y Precios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Preferencias
        </h3>

        <div className="space-y-4">
          <Select
            label="Profesional Preferido"
            value={formData.preferencias.profesional_preferido}
            onChange={(e) =>
              handlePreferenciasChange('profesional_preferido', e.target.value)
            }
            placeholder="Sin preferencia"
            options={profesionales.map((prof) => ({
              value: prof.id.toString(),
              label: prof.nombre_completo,
            }))}
          />

          {/* Lista de Precios */}
          {listasPrecios.length > 0 && (
            <div>
              <Select
                label={
                  <span className="flex items-center gap-1">
                    <Tag className="h-4 w-4 text-primary-500" />
                    Lista de Precios
                  </span>
                }
                name="lista_precios_id"
                value={formData.lista_precios_id}
                onChange={handleChange}
                placeholder="Sin lista asignada (precios estándar)"
                options={listasPrecios.map((lista) => ({
                  value: lista.id.toString(),
                  label: `${lista.codigo} - ${lista.nombre}${lista.descuento_global_pct > 0 ? ` (${lista.descuento_global_pct}% dto.)` : ''}`,
                }))}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Asigna una lista de precios para aplicar descuentos automáticos en el POS
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Servicios Favoritos
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {servicios.map((servicio) => (
                <div
                  key={servicio.id}
                  className="p-2 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleServiciosFavoritosChange(servicio.id)}
                >
                  <Checkbox
                    label={servicio.nombre}
                    checked={(formData.preferencias.servicios_favoritos || []).includes(
                      servicio.id
                    )}
                    onChange={() => handleServiciosFavoritosChange(servicio.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Etiquetas (Ene 2026 - Fase 2) */}
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

      {/* Configuración */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Configuración
        </h3>

        <div className="space-y-3">
          <Checkbox
            label="Permitir envío de mensajes de marketing"
            description="El cliente recibirá promociones y novedades"
            checked={formData.marketing_permitido}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                marketing_permitido: e.target.checked,
              }))
            }
          />

          <Checkbox
            label="Cliente activo"
            checked={formData.activo}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                activo: e.target.checked,
              }))
            }
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          isLoading={isLoading || uploadMutation.isPending}
          disabled={isLoading || uploadMutation.isPending}
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
