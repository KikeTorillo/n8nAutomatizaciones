import { useState, useEffect } from 'react';
import { useActualizarPerfil } from '@/hooks/useMarketplace';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Save, Edit2, X } from 'lucide-react';

/**
 * Formulario CRUD para editar perfil de marketplace
 * Permite actualizar información básica, ubicación, contacto y redes sociales
 */
function PerfilFormulario({ perfil, onSuccess }) {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [formData, setFormData] = useState({
    descripcion_corta: '',
    descripcion_larga: '',
    meta_titulo: '',
    meta_descripcion: '',
    pais: 'México',
    estado: '',
    ciudad: '',
    codigo_postal: '',
    direccion_completa: '',
    telefono_publico: '',
    email_publico: '',
    sitio_web: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  });

  const actualizarMutation = useActualizarPerfil();
  const { success, error, info } = useToast();

  // Inicializar formulario con datos del perfil
  useEffect(() => {
    if (perfil) {
      setFormData({
        descripcion_corta: perfil.descripcion_corta || '',
        descripcion_larga: perfil.descripcion_larga || '',
        meta_titulo: perfil.meta_titulo || '',
        meta_descripcion: perfil.meta_descripcion || '',
        pais: perfil.pais || 'México',
        estado: perfil.estado || '',
        ciudad: perfil.ciudad || '',
        codigo_postal: perfil.codigo_postal || '',
        direccion_completa: perfil.direccion_completa || '',
        telefono_publico: perfil.telefono_publico || '',
        email_publico: perfil.email_publico || '',
        sitio_web: perfil.sitio_web || '',
        instagram: perfil.instagram || '',
        facebook: perfil.facebook || '',
        tiktok: perfil.tiktok || '',
      });
    }
  }, [perfil]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await actualizarMutation.mutateAsync({
        id: perfil.id,
        data: formData,
      });

      success('Perfil actualizado exitosamente');
      setModoEdicion(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      error(err.message || 'Error al actualizar el perfil');
    }
  };

  const handleCancelar = () => {
    if (perfil) {
      setFormData({
        descripcion_corta: perfil.descripcion_corta || '',
        descripcion_larga: perfil.descripcion_larga || '',
        meta_titulo: perfil.meta_titulo || '',
        meta_descripcion: perfil.meta_descripcion || '',
        pais: perfil.pais || 'México',
        estado: perfil.estado || '',
        ciudad: perfil.ciudad || '',
        codigo_postal: perfil.codigo_postal || '',
        direccion_completa: perfil.direccion_completa || '',
        telefono_publico: perfil.telefono_publico || '',
        email_publico: perfil.email_publico || '',
        sitio_web: perfil.sitio_web || '',
        instagram: perfil.instagram || '',
        facebook: perfil.facebook || '',
        tiktok: perfil.tiktok || '',
      });
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

        {/* Información Básica */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Descripción Corta</p>
              <p className="text-gray-900 mt-1">{perfil.descripcion_corta || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Descripción Larga</p>
              <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                {perfil.descripcion_larga || 'No especificado'}
              </p>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Título SEO</p>
              <p className="text-gray-900 mt-1">{perfil.meta_titulo || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Descripción SEO</p>
              <p className="text-gray-900 mt-1">{perfil.meta_descripcion || 'No especificado'}</p>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubicación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">País</p>
              <p className="text-gray-900 mt-1">{perfil.pais || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Estado/Provincia</p>
              <p className="text-gray-900 mt-1">{perfil.estado || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Ciudad</p>
              <p className="text-gray-900 mt-1">{perfil.ciudad || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Código Postal</p>
              <p className="text-gray-900 mt-1">{perfil.codigo_postal || 'No especificado'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700">Dirección Completa</p>
              <p className="text-gray-900 mt-1">{perfil.direccion_completa || 'No especificado'}</p>
            </div>
          </div>
        </div>

        {/* Contacto Público */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto Público</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Teléfono Público</p>
              <p className="text-gray-900 mt-1">{perfil.telefono_publico || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Email Público</p>
              <p className="text-gray-900 mt-1">{perfil.email_publico || 'No especificado'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700">Sitio Web</p>
              <p className="text-gray-900 mt-1">{perfil.sitio_web || 'No especificado'}</p>
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Redes Sociales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Instagram</p>
              <p className="text-gray-900 mt-1">{perfil.instagram || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Facebook</p>
              <p className="text-gray-900 mt-1">{perfil.facebook || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">TikTok</p>
              <p className="text-gray-900 mt-1">{perfil.tiktok || 'No especificado'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modo Edición: Mostrar formulario
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Información Básica */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción Larga
            </label>
            <textarea
              name="descripcion_larga"
              value={formData.descripcion_larga}
              onChange={handleChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe tu negocio en detalle. Esta información aparecerá en tu perfil público."
            />
          </div>
        </div>
      </div>

      {/* SEO (Opcional) */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">SEO (Opcional)</h3>
        <p className="text-sm text-gray-600 mb-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción SEO
            </label>
            <textarea
              name="meta_descripcion"
              value={formData.meta_descripcion}
              onChange={handleChange}
              rows={3}
              maxLength={160}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descripción que aparecerá en Google (máx. 160 caracteres)"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.meta_descripcion.length}/160 caracteres
            </p>
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubicación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="País"
            name="pais"
            value={formData.pais}
            onChange={handleChange}
            options={[
              { value: 'México', label: 'México' },
              { value: 'Argentina', label: 'Argentina' },
              { value: 'Colombia', label: 'Colombia' },
              { value: 'Chile', label: 'Chile' },
              { value: 'Perú', label: 'Perú' },
            ]}
          />

          <Input
            label="Estado/Provincia"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            placeholder="Ej: Ciudad de México"
          />

          <Input
            label="Ciudad *"
            name="ciudad"
            value={formData.ciudad}
            onChange={handleChange}
            placeholder="Ej: CDMX"
            required
          />

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
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Contacto Público</h3>
        <p className="text-sm text-gray-600 mb-4">
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
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Redes Sociales</h3>
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
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
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
