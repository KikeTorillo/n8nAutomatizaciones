import { useState } from 'react';
import { User, Mail, Phone } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

/**
 * Componente para ingresar datos del cliente (Paso 3)
 */
function FormularioDatosCliente({
  datosCliente,
  onGuardar,
  onSiguiente,
  onAnterior,
}) {
  const [datos, setDatos] = useState(datosCliente);
  const [errores, setErrores] = useState({});

  const handleChange = (field, value) => {
    setDatos((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al modificar
    if (errores[field]) {
      setErrores((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!datos.nombre?.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido';
    }

    if (!datos.email?.trim()) {
      nuevosErrores.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      nuevosErrores.email = 'Email inválido';
    }

    if (!datos.telefono?.trim()) {
      nuevosErrores.telefono = 'El teléfono es requerido';
    } else if (!/^\+?[0-9]{10,15}$/.test(datos.telefono.replace(/\s/g, ''))) {
      nuevosErrores.telefono = 'Teléfono inválido (10-15 dígitos)';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleContinuar = () => {
    if (validar()) {
      onGuardar(datos);
      onSiguiente();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Tus datos
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Necesitamos tu información para confirmar la cita
        </p>
      </div>

      {/* Formulario */}
      <div className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Nombre *
          </label>
          <Input
            value={datos.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Juan"
            required
          />
          {errores.nombre && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errores.nombre}</p>
          )}
        </div>

        {/* Apellidos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Apellidos
          </label>
          <Input
            value={datos.apellidos}
            onChange={(e) => handleChange('apellidos', e.target.value)}
            placeholder="Pérez González"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email *
          </label>
          <Input
            type="email"
            value={datos.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="juan@ejemplo.com"
            required
          />
          {errores.email && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errores.email}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Teléfono *
          </label>
          <Input
            type="tel"
            value={datos.telefono}
            onChange={(e) => handleChange('telefono', e.target.value)}
            placeholder="+52 55 1234 5678"
            required
          />
          {errores.telefono && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errores.telefono}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Incluye código de país (ej: +52)
          </p>
        </div>
      </div>

      {/* Nota de privacidad */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Privacidad:</strong> Tus datos solo serán utilizados para confirmar y gestionar tu cita.
        </p>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={onAnterior}
        >
          Anterior
        </Button>
        <Button onClick={handleContinuar}>
          Continuar
        </Button>
      </div>
    </div>
  );
}

export default FormularioDatosCliente;
