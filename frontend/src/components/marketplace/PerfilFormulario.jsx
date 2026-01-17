import { useState, useEffect } from 'react';
import { useActualizarPerfil } from '@/hooks/otros';
import { useUploadArchivo } from '@/hooks/utils';
import { useUbicacionSelector } from '@/hooks/otros';
import { Button, Input } from '@/components/ui';
import GaleriaEditor from './GaleriaEditor';
import { useToast } from '@/hooks/utils';
import { Save, Edit2, X, Camera, Loader2, Image, ImagePlus } from 'lucide-react';

/**
 * Formulario CRUD para editar perfil de marketplace
 * Permite actualizar información básica, ubicación, contacto y redes sociales
 */
function PerfilFormulario({ perfil, onSuccess }) {
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estados para ubicación (IDs)
  const [estadoId, setEstadoId] = useState(null);
  const [ciudadId, setCiudadId] = useState(null);

  // Hook de ubicación para selectores en cascada
  const {
    estados,
    ciudades,
    loadingEstados,
    loadingCiudades,
  } = useUbicacionSelector({ estadoId, ciudadId });

  const [formData, setFormData] = useState({
    descripcion_corta: '',
    descripcion_larga: '',
    meta_titulo: '',
    meta_descripcion: '',
    codigo_postal: '',
    direccion_completa: '',
    telefono_publico: '',
    email_publico: '',
    sitio_web: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    logo_url: '',
    portada_url: '',
    galeria_urls: [],
  });

  // Estados para preview de imágenes
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [portadaPreview, setPortadaPreview] = useState(null);
  const [portadaFile, setPortadaFile] = useState(null);

  const actualizarMutation = useActualizarPerfil();
  const uploadMutation = useUploadArchivo();
  const toast = useToast();
  const { success, error, info } = toast;

  // Inicializar formulario con datos del perfil
  useEffect(() => {
    if (perfil) {
      // Cargar IDs de ubicación
      setEstadoId(perfil.estado_id || null);
      setCiudadId(perfil.ciudad_id || null);

      setFormData({
        descripcion_corta: perfil.descripcion_corta || '',
        descripcion_larga: perfil.descripcion_larga || '',
        meta_titulo: perfil.meta_titulo || '',
        meta_descripcion: perfil.meta_descripcion || '',
        codigo_postal: perfil.codigo_postal || '',
        direccion_completa: perfil.direccion_completa || '',
        telefono_publico: perfil.telefono_publico || '',
        email_publico: perfil.email_publico || '',
        sitio_web: perfil.sitio_web || '',
        instagram: perfil.instagram || '',
        facebook: perfil.facebook || '',
        tiktok: perfil.tiktok || '',
        logo_url: perfil.logo_url || '',
        portada_url: perfil.portada_url || '',
        galeria_urls: perfil.galeria_urls || [],
      });
      setLogoPreview(perfil.logo_url || null);
      setPortadaPreview(perfil.portada_url || null);
    }
  }, [perfil]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler para logo
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

  // Handler para portada
  const handlePortadaChange = (e) => {
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
      setPortadaFile(file);
      setPortadaPreview(URL.createObjectURL(file));
    }
  };

  // Handler para galería
  const handleGaleriaChange = (nuevasImagenes) => {
    setFormData((prev) => ({ ...prev, galeria_urls: nuevasImagenes }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Subir logo si hay archivo nuevo
      let logoUrlFinal = formData.logo_url;
      if (logoFile) {
        const resultado = await uploadMutation.mutateAsync({
          file: logoFile,
          folder: 'marketplace/logos',
          isPublic: true,
        });
        logoUrlFinal = resultado?.url || resultado;
      }

      // Subir portada si hay archivo nuevo
      let portadaUrlFinal = formData.portada_url;
      if (portadaFile) {
        const resultado = await uploadMutation.mutateAsync({
          file: portadaFile,
          folder: 'marketplace/portadas',
          isPublic: true,
        });
        portadaUrlFinal = resultado?.url || resultado;
      }

      await actualizarMutation.mutateAsync({
        id: perfil.id,
        data: {
          ...formData,
          ciudad_id: ciudadId,
          estado_id: estadoId || null,
          logo_url: logoUrlFinal || undefined,
          portada_url: portadaUrlFinal || undefined,
        },
      });

      // Limpiar archivos
      setLogoFile(null);
      setPortadaFile(null);

      success('Perfil actualizado exitosamente');
      setModoEdicion(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      error(err.message || 'Error al actualizar el perfil');
    }
  };

  const handleCancelar = () => {
    if (perfil) {
      // Restaurar ubicación
      setEstadoId(perfil.estado_id || null);
      setCiudadId(perfil.ciudad_id || null);

      setFormData({
        descripcion_corta: perfil.descripcion_corta || '',
        descripcion_larga: perfil.descripcion_larga || '',
        meta_titulo: perfil.meta_titulo || '',
        meta_descripcion: perfil.meta_descripcion || '',
        codigo_postal: perfil.codigo_postal || '',
        direccion_completa: perfil.direccion_completa || '',
        telefono_publico: perfil.telefono_publico || '',
        email_publico: perfil.email_publico || '',
        sitio_web: perfil.sitio_web || '',
        instagram: perfil.instagram || '',
        facebook: perfil.facebook || '',
        tiktok: perfil.tiktok || '',
        logo_url: perfil.logo_url || '',
        portada_url: perfil.portada_url || '',
        galeria_urls: perfil.galeria_urls || [],
      });
      // Restaurar previews
      setLogoPreview(perfil.logo_url || null);
      setPortadaPreview(perfil.portada_url || null);
      setLogoFile(null);
      setPortadaFile(null);
      setModoEdicion(false);
      info('Cambios descartados');
    }
  };

  // Modo Vista: Mostrar solo lectura
  if (!modoEdicion) {
    return (
      <div className="space-y-8">
        {/* Botón Editar */}
        <div className="flex justify-end">
          <Button onClick={() => setModoEdicion(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar Perfil
          </Button>
        </div>

        {/* Imágenes del Perfil */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Imágenes del Perfil</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Logo */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo</p>
              {perfil.logo_url ? (
                <img
                  src={perfil.logo_url}
                  alt="Logo"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Image className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>

            {/* Portada */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Portada</p>
              {perfil.portada_url ? (
                <img
                  src={perfil.portada_url}
                  alt="Portada"
                  className="w-full h-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-full h-32 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Image className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>
          </div>

          {/* Galería */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Galería ({perfil.galeria_urls?.length || 0} imágenes)
            </p>
            {perfil.galeria_urls && perfil.galeria_urls.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {perfil.galeria_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Galería ${index + 1}`}
                    className="aspect-square rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Sin imágenes en la galería</p>
            )}
          </div>
        </div>

        {/* Información Básica */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información Básica</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción Corta</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.descripcion_corta || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción Larga</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-wrap">
                {perfil.descripcion_larga || 'No especificado'}
              </p>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">SEO</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Título SEO</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.meta_titulo || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción SEO</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.meta_descripcion || 'No especificado'}</p>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ubicación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">País</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.pais || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado/Provincia</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.estado || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ciudad</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.ciudad || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Código Postal</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.codigo_postal || 'No especificado'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dirección Completa</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.direccion_completa || 'No especificado'}</p>
            </div>
          </div>
        </div>

        {/* Contacto Público */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contacto Público</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono Público</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.telefono_publico || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Público</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.email_publico || 'No especificado'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sitio Web</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.sitio_web || 'No especificado'}</p>
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Redes Sociales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Instagram</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.instagram || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.facebook || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">TikTok</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{perfil.tiktok || 'No especificado'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modo Edición: Mostrar formulario
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Imágenes del Perfil */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Imágenes del Perfil</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Logo */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo</p>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-700 overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-full h-full object-cover"
                      onError={() => setLogoPreview(null)}
                    />
                  ) : (
                    <Image className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 bg-primary-600 dark:bg-primary-500 text-white rounded-full p-2 cursor-pointer hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-lg">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="sr-only"
                    disabled={uploadMutation.isPending}
                  />
                </label>
                {uploadMutation.isPending && logoFile && (
                  <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-primary-600 dark:text-primary-400 animate-spin" />
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>Recomendado: 200x200px</p>
                <p>PNG, JPG. Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Portada */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen de Portada</p>
            <div className="relative">
              <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-700 overflow-hidden">
                {portadaPreview ? (
                  <img
                    src={portadaPreview}
                    alt="Portada"
                    className="w-full h-full object-cover"
                    onError={() => setPortadaPreview(null)}
                  />
                ) : (
                  <div className="text-center">
                    <ImagePlus className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">1200x400px recomendado</p>
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 right-2 bg-primary-600 dark:bg-primary-500 text-white rounded-full p-2 cursor-pointer hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-lg">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePortadaChange}
                  className="sr-only"
                  disabled={uploadMutation.isPending}
                />
              </label>
              {uploadMutation.isPending && portadaFile && (
                <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-lg flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-primary-600 dark:text-primary-400 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Galería */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Galería de Imágenes</p>
          <GaleriaEditor
            imagenes={formData.galeria_urls}
            onChange={handleGaleriaChange}
            maxImagenes={10}
          />
        </div>
      </div>

      {/* Información Básica */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información Básica</h3>
        <div className="space-y-4">
          <Input
            label="Descripción Corta"
            name="descripcion_corta"
            value={formData.descripcion_corta}
            onChange={handleChange}
            placeholder="Breve descripción de tu negocio (máx. 200 caracteres)"
            maxLength={200}
            helpText={`${formData.descripcion_corta.length}/200 caracteres`}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción Larga
            </label>
            <textarea
              name="descripcion_larga"
              value={formData.descripcion_larga}
              onChange={handleChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe tu negocio en detalle. Esta información aparecerá en tu perfil público."
            />
          </div>
        </div>
      </div>

      {/* SEO (Opcional) */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">SEO (Opcional)</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Optimiza cómo aparece tu negocio en los resultados de búsqueda de Google
        </p>
        <div className="space-y-4">
          <Input
            label="Título SEO"
            name="meta_titulo"
            value={formData.meta_titulo}
            onChange={handleChange}
            placeholder="Título optimizado para buscadores (máx. 70 caracteres)"
            maxLength={70}
            helpText={`${formData.meta_titulo.length}/70 caracteres`}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción SEO
            </label>
            <textarea
              name="meta_descripcion"
              value={formData.meta_descripcion}
              onChange={handleChange}
              rows={3}
              maxLength={160}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descripción que aparecerá en Google (máx. 160 caracteres)"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.meta_descripcion.length}/160 caracteres
            </p>
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ubicación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector de Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado *
            </label>
            <div className="relative">
              <select
                value={estadoId || ''}
                onChange={(e) => {
                  setEstadoId(e.target.value ? Number(e.target.value) : null);
                  setCiudadId(null); // Reset ciudad al cambiar estado
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={loadingEstados}
              >
                <option value="">Selecciona un estado</option>
                {estados.map((estado) => (
                  <option key={estado.id} value={estado.id}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
              {loadingEstados && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Selector de Ciudad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ciudad *
            </label>
            <div className="relative">
              <select
                value={ciudadId || ''}
                onChange={(e) => setCiudadId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-500"
                disabled={!estadoId || loadingCiudades}
              >
                <option value="">
                  {!estadoId ? 'Primero selecciona un estado' : 'Selecciona una ciudad'}
                </option>
                {ciudades.map((ciudad) => (
                  <option key={ciudad.id} value={ciudad.id}>
                    {ciudad.nombre}
                  </option>
                ))}
              </select>
              {loadingCiudades && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>
          </div>

          <Input
            label="Código Postal"
            name="codigo_postal"
            value={formData.codigo_postal}
            onChange={handleChange}
            placeholder="Ej: 03100"
          />

          <div className="md:col-span-2">
            <Input
              label="Dirección Completa"
              name="direccion_completa"
              value={formData.direccion_completa}
              onChange={handleChange}
              placeholder="Ej: Avenida Insurgentes Sur 1234, Colonia del Valle"
            />
          </div>
        </div>
      </div>

      {/* Contacto Público */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Contacto Público</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Esta información será visible en tu perfil público
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Teléfono Público"
            name="telefono_publico"
            value={formData.telefono_publico}
            onChange={handleChange}
            placeholder="+52 55 1234 5678"
            type="tel"
          />

          <Input
            label="Email Público"
            name="email_publico"
            value={formData.email_publico}
            onChange={handleChange}
            placeholder="contacto@tunegocio.com"
            type="email"
          />

          <div className="md:col-span-2">
            <Input
              label="Sitio Web"
              name="sitio_web"
              value={formData.sitio_web}
              onChange={handleChange}
              placeholder="https://tunegocio.com"
              type="url"
            />
          </div>
        </div>
      </div>

      {/* Redes Sociales */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Redes Sociales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Instagram"
            name="instagram"
            value={formData.instagram}
            onChange={handleChange}
            placeholder="@tunegocio"
          />

          <Input
            label="Facebook"
            name="facebook"
            value={formData.facebook}
            onChange={handleChange}
            placeholder="https://facebook.com/tunegocio"
            type="url"
          />

          <Input
            label="TikTok"
            name="tiktok"
            value={formData.tiktok}
            onChange={handleChange}
            placeholder="@tunegocio"
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancelar}
          disabled={actualizarMutation.isLoading}
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>

        <Button type="submit" disabled={actualizarMutation.isLoading}>
          {actualizarMutation.isLoading ? (
            <>Guardando...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default PerfilFormulario;
