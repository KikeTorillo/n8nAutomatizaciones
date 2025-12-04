import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
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
} from 'lucide-react';

import useAuthStore from '@/store/authStore';
import { organizacionesApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/useToast';
import { useUploadArchivo } from '@/hooks/useStorage';
import Button from '@/components/ui/Button';
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
    },
  });

  const logoUrl = watch('logo_url');

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

      // Limpiar campos vacíos a null
      const cleanData = {};
      Object.entries(formData).forEach(([key, value]) => {
        cleanData[key] = value?.trim() || null;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error al cargar los datos</p>
          <Button onClick={() => navigate('/configuracion')}>Volver</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/configuracion')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Mi Negocio
                </h1>
                <p className="text-sm text-gray-500">
                  Información de tu organización
                </p>
              </div>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* Logo Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-gray-500" />
              Logo
            </h2>

            <div className="flex items-start gap-6">
              {/* Preview con botón de subir */}
              <div className="flex-shrink-0 relative">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
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
                <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
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
                  <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                  </div>
                )}
              </div>

              {/* Opciones */}
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-3">
                  Haz clic en el ícono de cámara para subir tu logo, o ingresa una URL directamente.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del logo (opcional)
                </label>
                <input
                  type="url"
                  {...register('logo_url')}
                  placeholder="https://ejemplo.com/mi-logo.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={!!logoFile}
                />
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG o WEBP. Máximo 5MB. Tamaño recomendado: 200x200px
                </p>
              </div>
            </div>
          </div>

          {/* Información General */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-500" />
              Información General
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre comercial <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('nombre_comercial', { required: true })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.nombre_comercial ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Mi Negocio S.A."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón social
                </label>
                <input
                  type="text"
                  {...register('razon_social')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Mi Negocio S.A. de C.V."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RFC / NIF
                </label>
                <input
                  type="text"
                  {...register('rfc_nif')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                  placeholder="XAXX010101000"
                  maxLength={13}
                />
              </div>
            </div>
          </div>

          {/* Datos de Contacto */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-500" />
              Datos de Contacto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email de contacto
                </label>
                <input
                  type="email"
                  {...register('email_admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="contacto@minegocio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  {...register('telefono')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="55 1234 5678"
                  maxLength={15}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Sitio web
                </label>
                <input
                  type="url"
                  {...register('sitio_web')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://www.minegocio.com"
                />
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
            <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 rounded-lg">
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
