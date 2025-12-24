import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, Camera, X, Loader2, User, Tag } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import { useServiciosDashboard } from '@/hooks/useEstadisticas';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useUploadArchivo } from '@/hooks/useStorage';
import { useToast } from '@/hooks/useToast';
import { listasPreciosApi } from '@/services/api/endpoints';

/**
 * Formulario reutilizable para crear/editar clientes
 */
function ClienteForm({ cliente = null, onSubmit, isLoading = false }) {
  const toast = useToast();
  const uploadMutation = useUploadArchivo();

  const [formData, setFormData] = useState({
    nombre_completo: '',
    telefono: '',
    email: '',
    fecha_nacimiento: '',
    direccion: '',
    notas_medicas: '',
    marketing_permitido: true,
    activo: true,
    lista_precios_id: '',
    preferencias: {
      profesional_preferido: '',
      servicios_favoritos: [],
    },
    foto_url: '',
  });

  const [errors, setErrors] = useState({});
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  // Cargar datos de profesionales y servicios para preferencias
  const { data: profesionales = [] } = useProfesionales();
  const { data: servicios = [] } = useServiciosDashboard();

  // Cargar listas de precios disponibles
  const { data: listasPreciosData } = useQuery({
    queryKey: ['listas-precios', { soloActivas: true }],
    queryFn: () => listasPreciosApi.listar({ soloActivas: true }),
    staleTime: 1000 * 60 * 5, // 5 min
  });
  const listasPrecios = listasPreciosData?.data?.data || [];

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
        direccion: cliente.direccion || '',
        notas_medicas: cliente.alergias || '', // Backend devuelve "alergias"
        marketing_permitido: cliente.marketing_permitido ?? true,
        activo: cliente.activo ?? true,
        lista_precios_id: cliente.lista_precios_id?.toString() || '',
        preferencias: {
          profesional_preferido: cliente.profesional_preferido_id || '', // Backend devuelve "profesional_preferido_id"
          servicios_favoritos: [], // Este campo NO existe en backend
        },
        foto_url: cliente.foto_url || '',
      });
      setFotoPreview(cliente.foto_url || null);
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
        direccion: formData.direccion?.trim() || undefined,
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
      };

      setFotoFile(null); // Limpiar archivo después de subir
      onSubmit(dataToSubmit);
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

      {/* Información Básica */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Información Básica
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre Completo *
            </label>
            <Input
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              placeholder="Juan Pérez García"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirección
            </label>
            <Input
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Calle 123 #45-67"
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
