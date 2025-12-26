import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Building2,
  Save,
  Upload,
  Globe,
  Phone,
  Mail,
  FileText,
  Loader2,
  CheckCircle,
  Image,
  Camera,
  X,
  Coins,
  Clock,
  ShoppingCart,
} from 'lucide-react';

import useAuthStore from '@/store/authStore';
import { organizacionesApi, monedasApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/useToast';
import { useUploadArchivo } from '@/hooks/useStorage';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Input from '@/components/ui/Input';

/**
 * Página de configuración del negocio
 * Permite editar datos de la organización: nombre, logo, contacto, datos fiscales
 */
function NegocioPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();
  const organizacionId = user?.organizacion_id;

  // Estado para preview del logo
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const uploadMutation = useUploadArchivo();

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      nombre_comercial: '',
      razon_social: '',
      rfc_nif: '',
      email_admin: '',
      telefono: '',
      sitio_web: '',
      logo_url: '',
      moneda: 'MXN',
      zona_horaria: 'America/Mexico_City',
      pos_requiere_profesional: false,
    },
  });

  const logoUrl = watch('logo_url');

  // Query para obtener monedas disponibles
  const { data: monedasData } = useQuery({
    queryKey: ['monedas'],
    queryFn: () => monedasApi.listar(),
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  const monedas = monedasData?.data?.data || [];

  // Query para obtener datos de la organización
  const { data, isLoading, error } = useQuery({
    queryKey: ['organizacion', organizacionId],
    queryFn: () => organizacionesApi.obtener(organizacionId),
    enabled: !!organizacionId,
  });

  // Cargar datos en el form cuando lleguen
  useEffect(() => {
    const org = data?.data?.data;
    if (org) {
      reset({
        nombre_comercial: org.nombre_comercial || '',
        razon_social: org.razon_social || '',
        rfc_nif: org.rfc_nif || '',
        email_admin: org.email_admin || '',
        telefono: org.telefono || '',
        sitio_web: org.sitio_web || '',
        logo_url: org.logo_url || '',
        moneda: org.moneda || 'MXN',
        zona_horaria: org.zona_horaria || 'America/Mexico_City',
        pos_requiere_profesional: org.pos_requiere_profesional || false,
      });
      setLogoPreview(org.logo_url);
    }
  }, [data, reset]);

  // Actualizar preview cuando cambia la URL del logo
  useEffect(() => {
    if (logoUrl && !logoFile) {
      setLogoPreview(logoUrl);
    }
  }, [logoUrl, logoFile]);

  // Handler para seleccionar archivo de logo
  const handleLogoChange = (e) => {
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
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Handler para eliminar logo
  const handleEliminarLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    // Limpiar el campo del form también
    reset({ ...watch(), logo_url: '' });
  };

  // Mutation para actualizar
  const updateMutation = useMutation({
    mutationFn: (formData) => organizacionesApi.actualizar(organizacionId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizacion', organizacionId]);
      toast.success('La información del negocio se guardó correctamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'No se pudieron guardar los cambios');
    },
  });

  // Submit
  const onSubmit = async (formData) => {
    try {
      // Subir logo si hay un archivo nuevo
      let logoUrlFinal = formData.logo_url;
      if (logoFile) {
        const resultado = await uploadMutation.mutateAsync({
          file: logoFile,
          folder: 'logos',
          isPublic: true,
        });
        logoUrlFinal = resultado?.url || resultado;
      }

      // Limpiar campos vacíos a null (manejar strings y booleans)
      const cleanData = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          cleanData[key] = value;
        } else if (typeof value === 'string') {
          cleanData[key] = value.trim() || null;
        } else {
          cleanData[key] = value ?? null;
        }
      });

      // Actualizar logo_url con la URL subida
      cleanData.logo_url = logoUrlFinal || null;

      // nombre_comercial es requerido
      if (!cleanData.nombre_comercial) {
        toast.warning('El nombre comercial es obligatorio');
        return;
      }

      updateMutation.mutate(cleanData);
      setLogoFile(null); // Limpiar archivo después de guardar
    } catch (error) {
      toast.error('No se pudo subir el logo');
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error al cargar los datos</p>
          <Button onClick={() => navigate('/configuracion')}>Volver</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <BackButton to="/home" label="Volver al Inicio" className="mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Mi Negocio
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Información de tu organización
              </p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
              <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* Logo Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Logo
            </h2>

            <div className="flex items-start gap-6">
              {/* Preview con botón de subir */}
              <div className="flex-shrink-0 relative">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700 overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-full h-full object-contain"
                      onError={() => setLogoPreview(null)}
                    />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                {/* Botón de cámara para subir */}
                <label className="absolute -bottom-2 -right-2 bg-primary-600 text-white rounded-full p-2 cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="sr-only"
                    disabled={uploadMutation.isPending}
                  />
                </label>
                {/* Botón de eliminar */}
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleEliminarLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                {/* Loading de subida */}
                {uploadMutation.isPending && (
                  <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-xl flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-primary-600 dark:text-primary-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Opciones */}
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Haz clic en el ícono de cámara para subir tu logo, o ingresa una URL directamente.
                </p>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL del logo (opcional)
                </label>
                <input
                  type="url"
                  {...register('logo_url')}
                  placeholder="https://ejemplo.com/mi-logo.png"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={!!logoFile}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG o WEBP. Máximo 5MB. Tamaño recomendado: 200x200px
                </p>
              </div>
            </div>
          </div>

          {/* Información General */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Información General
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre comercial <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('nombre_comercial', { required: true })}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.nombre_comercial ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Mi Negocio S.A."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Razón social
                </label>
                <input
                  type="text"
                  {...register('razon_social')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Mi Negocio S.A. de C.V."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RFC / NIF
                </label>
                <input
                  type="text"
                  {...register('rfc_nif')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
                  placeholder="XAXX010101000"
                  maxLength={13}
                />
              </div>
            </div>
          </div>

          {/* Datos de Contacto */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Datos de Contacto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email de contacto
                </label>
                <input
                  type="email"
                  {...register('email_admin')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="contacto@minegocio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  {...register('telefono')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="55 1234 5678"
                  maxLength={15}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Sitio web
                </label>
                <input
                  type="url"
                  {...register('sitio_web')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://www.minegocio.com"
                />
              </div>
            </div>
          </div>

          {/* Configuración Regional */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Configuración Regional
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Coins className="w-4 h-4 inline mr-1" />
                  Moneda
                </label>
                <select
                  {...register('moneda')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {monedas.length > 0 ? (
                    monedas.map((m) => (
                      <option key={m.codigo} value={m.codigo}>
                        {m.simbolo} {m.codigo} - {m.nombre}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="MXN">$ MXN - Peso Mexicano</option>
                      <option value="COP">$ COP - Peso Colombiano</option>
                      <option value="USD">$ USD - Dólar Estadounidense</option>
                    </>
                  )}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Moneda para mostrar precios y totales
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Zona horaria
                </label>
                <select
                  {...register('zona_horaria')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                  <option value="America/Bogota">Bogotá (GMT-5)</option>
                  <option value="America/Lima">Lima (GMT-5)</option>
                  <option value="America/Santiago">Santiago (GMT-3)</option>
                  <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
                  <option value="America/New_York">Nueva York (GMT-5)</option>
                  <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
                  <option value="Europe/Madrid">Madrid (GMT+1)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Afecta horarios de citas y reportes
                </p>
              </div>
            </div>
          </div>

          {/* Configuración POS */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Punto de Venta
            </h2>

            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-1 pr-4">
                  <label className="font-medium text-gray-900 dark:text-gray-100">
                    Requerir profesional para ventas
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Si está activado, solo usuarios con un profesional vinculado podrán realizar ventas en el POS.
                    Útil para negocios que calculan comisiones por vendedor.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    {...register('pos_requiere_profesional')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/configuracion')}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={(!isDirty && !logoFile) || updateMutation.isPending || uploadMutation.isPending}
              className="flex items-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo logo...
                </>
              ) : updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>

          {/* Success message */}
          {updateMutation.isSuccess && (
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 py-3 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span>Cambios guardados correctamente</span>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

export default NegocioPage;
