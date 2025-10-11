import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useProfesionales, useServicios } from '@/hooks/useDashboard';

/**
 * Formulario reutilizable para crear/editar clientes
 */
function ClienteForm({ cliente = null, onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    telefono: '',
    email: '',
    fecha_nacimiento: '',
    direccion: '',
    notas_medicas: '',
    marketing_permitido: true,
    activo: true,
    preferencias: {
      profesional_preferido: '',
      servicios_favoritos: [],
    },
  });

  const [errors, setErrors] = useState({});

  // Cargar datos de profesionales y servicios para preferencias
  const { data: profesionales = [] } = useProfesionales();
  const { data: servicios = [] } = useServicios();

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
        preferencias: {
          profesional_preferido: cliente.profesional_preferido_id || '', // Backend devuelve "profesional_preferido_id"
          servicios_favoritos: [], // Este campo NO existe en backend
        },
      });
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

  const validate = () => {
    const newErrors = {};

    // Campos requeridos
    if (!formData.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre es requerido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (formData.telefono.length < 10) {
      newErrors.telefono = 'El teléfono debe tener al menos 10 dígitos';
    }

    // Email (opcional, pero si se proporciona debe ser válido)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
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
      profesional_preferido_id: formData.preferencias.profesional_preferido
        ? parseInt(formData.preferencias.profesional_preferido)
        : undefined,
      // Nota: servicios_favoritos NO existe en backend, se omite
    };

    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Básica
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <p className="mt-1 text-sm text-red-600">{errors.nombre_completo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <Input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+573001234567"
              error={errors.telefono}
            />
            {errors.telefono && (
              <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Adicional
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas Médicas
          </label>
          <textarea
            name="notas_medicas"
            value={formData.notas_medicas}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Alergias, condiciones médicas relevantes, etc."
          />
        </div>
      </div>

      {/* Preferencias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Preferencias
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profesional Preferido
            </label>
            <select
              value={formData.preferencias.profesional_preferido}
              onChange={(e) =>
                handlePreferenciasChange('profesional_preferido', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin preferencia</option>
              {profesionales.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servicios Favoritos
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {servicios.map((servicio) => (
                <label
                  key={servicio.id}
                  className="flex items-center gap-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(formData.preferencias.servicios_favoritos || []).includes(
                      servicio.id
                    )}
                    onChange={() => handleServiciosFavoritosChange(servicio.id)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{servicio.nombre}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Configuración */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configuración
        </h3>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="marketing_permitido"
              checked={formData.marketing_permitido}
              onChange={handleChange}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Permitir envío de mensajes de marketing
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Cliente activo</span>
          </label>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          {cliente ? 'Actualizar Cliente' : 'Crear Cliente'}
        </Button>
      </div>
    </form>
  );
}

export default ClienteForm;
