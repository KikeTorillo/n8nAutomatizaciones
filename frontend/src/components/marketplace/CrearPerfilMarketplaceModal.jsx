import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrearPerfil } from '@/hooks/useMarketplace';
import { useUbicacionSelector, usePaisDefault } from '@/hooks/useUbicaciones';
import { useToast } from '@/hooks/useToast';
import { Button, Input, Select } from '@/components/ui';
import { X, ChevronRight, ChevronLeft, Check, Store, Loader2 } from 'lucide-react';

/**
 * Modal wizard de 3 pasos para crear perfil de marketplace
 * Paso 1: Información Básica + Ubicación (Estado y Ciudad)
 * Paso 2: Dirección y Contacto
 * Paso 3: Redes Sociales (opcional)
 */
function CrearPerfilMarketplaceModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const { success, error } = useToast();

  // Estado para ubicación (IDs)
  const [estadoId, setEstadoId] = useState(null);
  const [ciudadId, setCiudadId] = useState(null);

  // Hook de ubicación para selectores en cascada
  const { data: paisDefault } = usePaisDefault();
  const {
    estados,
    ciudades,
    loadingEstados,
    loadingCiudades,
    getEstadoNombre,
    getCiudadNombre,
  } = useUbicacionSelector({ estadoId, ciudadId });

  const [formData, setFormData] = useState({
    // Paso 1: Información Básica
    descripcion_corta: '',
    descripcion_larga: '',

    // Paso 2: Dirección y Contacto
    codigo_postal: '',
    direccion_completa: '',
    telefono_publico: '',
    email_publico: '',
    sitio_web: '',

    // Paso 3: Redes Sociales
    instagram: '',
    facebook: '',
    tiktok: '',
  });

  const crearPerfilMutation = useCrearPerfil();

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    // Validar paso 1
    if (paso === 1) {
      if (!formData.descripcion_corta.trim()) {
        error('Debes escribir una descripción corta');
        return;
      }
      if (!ciudadId) {
        error('Debes seleccionar tu ciudad');
        return;
      }
    }

    setPaso(paso + 1);
  };

  const handleBack = () => {
    setPaso(paso - 1);
  };

  const handleSubmit = (e) => {
    // Prevenir submit del form (todos los botones son type="button")
    e.preventDefault();
  };

  const handleCrearPerfil = async () => {
    try {
      // Construir datos con IDs de ubicación
      const datosCrear = {
        ...formData,
        ciudad_id: ciudadId,
        estado_id: estadoId || null,
        pais_id: paisDefault?.id || null,
      };

      await crearPerfilMutation.mutateAsync(datosCrear);
      success('¡Perfil de marketplace creado exitosamente!');
      onClose();
      navigate('/mi-marketplace');
    } catch (err) {
      error(err.message || 'Error al crear el perfil');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-700 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Activar Perfil de Marketplace
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Paso {paso} de 3</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Indicador de Progreso */}
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      paso > num
                        ? 'bg-green-500 text-white'
                        : paso === num
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {paso > num ? <Check className="w-4 h-4" /> : num}
                  </div>
                  {num < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded ${
                        paso > num ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contenido del Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Paso 1: Información Básica + Ubicación */}
            {paso === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Información Básica
                </h3>

                <Input
                  label="Descripción Corta *"
                  name="descripcion_corta"
                  value={formData.descripcion_corta}
                  onChange={handleChange}
                  placeholder="Ej: Barbería profesional con más de 10 años de experiencia"
                  maxLength={200}
                  helpText={`${formData.descripcion_corta.length}/200 caracteres`}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción Larga
                  </label>
                  <textarea
                    name="descripcion_larga"
                    value={formData.descripcion_larga}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe tu negocio en detalle..."
                  />
                </div>

                {/* Selectores de ubicación en cascada */}
                <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ciudad *
                    </label>
                    <div className="relative">
                      <select
                        value={ciudadId || ''}
                        onChange={(e) => setCiudadId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
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
                </div>
              </div>
            )}

            {/* Paso 2: Dirección y Contacto */}
            {paso === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Dirección y Contacto
                </h3>

                {/* Mostrar ubicación seleccionada */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Ubicación:</span>{' '}
                    {getCiudadNombre(ciudadId)}, {getEstadoNombre(estadoId)}, México
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Código Postal"
                    name="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={handleChange}
                    placeholder="Ej: 03100"
                  />

                  <Input
                    label="Teléfono Público"
                    name="telefono_publico"
                    value={formData.telefono_publico}
                    onChange={handleChange}
                    placeholder="+52 55 1234 5678"
                    type="tel"
                  />
                </div>

                <Input
                  label="Dirección Completa"
                  name="direccion_completa"
                  value={formData.direccion_completa}
                  onChange={handleChange}
                  placeholder="Ej: Avenida Insurgentes Sur 1234, Colonia del Valle"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email Público"
                    name="email_publico"
                    value={formData.email_publico}
                    onChange={handleChange}
                    placeholder="contacto@tunegocio.com"
                    type="email"
                  />

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
            )}

            {/* Paso 3: Redes Sociales */}
            {paso === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Redes Sociales (Opcional)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Agrega tus redes sociales para que tus clientes puedan encontrarte más fácilmente.
                </p>

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
            )}

            {/* Botones de Navegación */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                {paso > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Atrás
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>

                {paso < 3 ? (
                  <Button type="button" onClick={handleNext}>
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleCrearPerfil}
                    disabled={crearPerfilMutation.isLoading}
                  >
                    {crearPerfilMutation.isLoading ? 'Creando...' : 'Crear Perfil'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CrearPerfilMarketplaceModal;
