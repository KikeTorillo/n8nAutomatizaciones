import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Building2, Key, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useCrearProfesional, TIPOS_CONTRATACION } from '@/hooks/useProfesionales';
import { useDepartamentos } from '@/hooks/useDepartamentos';
import { usePuestos } from '@/hooks/usePuestos';
import { useToast } from '@/hooks/useToast';

// Pasos del wizard
const PASOS = [
  { id: 1, label: 'Información Básica', icon: User },
  { id: 2, label: 'Clasificación', icon: Building2 },
  { id: 3, label: 'Acceso al Sistema', icon: Key },
];

/**
 * Wizard de 3 pasos para crear un nuevo profesional
 * Ruta: /profesionales/nuevo
 */
function NuevoProfesionalWizard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [paso, setPaso] = useState(1);
  const [formData, setFormData] = useState({
    // Paso 1: Información Básica
    nombre_completo: '',
    email: '',
    telefono: '',
    // Paso 2: Clasificación
    departamento_id: '',
    puesto_id: '',
    supervisor_id: '',
    tipo_contratacion: 'tiempo_completo',
    // Paso 3: Acceso
    modoAcceso: 'invitacion',
    rol_invitacion: 'empleado',
  });

  // Datos para selects
  const { data: departamentos = [] } = useDepartamentos({ activo: true });
  const { data: puestos = [] } = usePuestos({ activo: true });

  // Mutation para crear
  const crearMutation = useCrearProfesional();

  // Actualizar campo
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validar paso actual
  const validarPaso = () => {
    switch (paso) {
      case 1:
        if (!formData.nombre_completo.trim()) {
          toast.error('El nombre es requerido');
          return false;
        }
        if (formData.modoAcceso === 'invitacion' && !formData.email.trim()) {
          toast.error('El email es requerido para enviar la invitación');
          return false;
        }
        return true;
      case 2:
        return true; // Todos los campos son opcionales
      case 3:
        return true;
      default:
        return true;
    }
  };

  // Siguiente paso
  const handleSiguiente = () => {
    if (validarPaso()) {
      setPaso((prev) => Math.min(prev + 1, 3));
    }
  };

  // Paso anterior
  const handleAnterior = () => {
    setPaso((prev) => Math.max(prev - 1, 1));
  };

  // Crear profesional
  const handleCrear = async () => {
    if (!validarPaso()) return;

    try {
      const data = {
        nombre_completo: formData.nombre_completo.trim(),
        email: formData.email.trim() || undefined,
        telefono: formData.telefono.trim() || undefined,
        departamento_id: formData.departamento_id ? parseInt(formData.departamento_id, 10) : undefined,
        puesto_id: formData.puesto_id ? parseInt(formData.puesto_id, 10) : undefined,
        supervisor_id: formData.supervisor_id ? parseInt(formData.supervisor_id, 10) : undefined,
        tipo_contratacion: formData.tipo_contratacion || undefined,
      };

      const result = await crearMutation.mutateAsync(data);

      toast.success('Profesional creado correctamente');
      navigate(`/profesionales/${result.id}`);
    } catch (error) {
      toast.error(error.message || 'Error al crear el profesional');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profesionales')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Profesionales
          </Button>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Nuevo Profesional
          </h1>

          {/* Indicador de pasos */}
          <div className="flex items-center justify-between mt-6">
            {PASOS.map((p, index) => {
              const Icon = p.icon;
              const isActive = paso === p.id;
              const isCompleted = paso > p.id;

              return (
                <div key={p.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : isCompleted
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 ${
                        isActive
                          ? 'text-primary-600 dark:text-primary-400 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {p.label}
                    </span>
                  </div>
                  {index < PASOS.length - 1 && (
                    <div
                      className={`w-16 sm:w-24 h-0.5 mx-2 ${
                        paso > p.id
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Paso 1: Información Básica */}
          {paso === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Información Básica
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Ingresa los datos básicos del nuevo profesional.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.nombre_completo}
                  onChange={(e) => updateField('nombre_completo', e.target.value)}
                  placeholder="Ej: María García López"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email del empleado
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="maria@empresa.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se enviará una invitación a este correo para acceder al sistema.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono (opcional)
                </label>
                <Input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  placeholder="5512345678"
                />
              </div>
            </div>
          )}

          {/* Paso 2: Clasificación */}
          {paso === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Clasificación
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Asigna el departamento, puesto y tipo de contratación.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departamento
                </label>
                <Select
                  value={formData.departamento_id}
                  onChange={(e) => updateField('departamento_id', e.target.value)}
                >
                  <option value="">Seleccionar departamento...</option>
                  {departamentos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Puesto
                </label>
                <Select
                  value={formData.puesto_id}
                  onChange={(e) => updateField('puesto_id', e.target.value)}
                >
                  <option value="">Seleccionar puesto...</option>
                  {puestos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de contratación
                </label>
                <Select
                  value={formData.tipo_contratacion}
                  onChange={(e) => updateField('tipo_contratacion', e.target.value)}
                >
                  {Object.entries(TIPOS_CONTRATACION).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {/* Paso 3: Acceso al Sistema */}
          {paso === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Acceso al Sistema
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Configura el acceso del profesional al sistema.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Rol en el sistema
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'empleado', label: 'Empleado', desc: 'Acceso limitado según permisos asignados' },
                    { value: 'propietario', label: 'Propietario', desc: 'Acceso operativo completo' },
                    { value: 'admin', label: 'Administrador', desc: 'Acceso total a la organización' },
                  ].map((rol) => (
                    <label
                      key={rol.value}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.rol_invitacion === rol.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rol"
                        value={rol.value}
                        checked={formData.rol_invitacion === rol.value}
                        onChange={(e) => updateField('rol_invitacion', e.target.value)}
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {rol.label}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {rol.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Resumen
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• {formData.nombre_completo || 'Sin nombre'}</li>
                  <li>• {formData.email || 'Sin email'}</li>
                  <li>
                    • {departamentos.find((d) => d.id === parseInt(formData.departamento_id, 10))?.nombre || 'Sin departamento'}
                    {' > '}
                    {puestos.find((p) => p.id === parseInt(formData.puesto_id, 10))?.nombre || 'Sin puesto'}
                  </li>
                  <li>• Rol: {formData.rol_invitacion}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            {paso > 1 ? (
              <Button variant="outline" onClick={handleAnterior}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            ) : (
              <div />
            )}

            {paso < 3 ? (
              <Button onClick={handleSiguiente}>
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCrear}
                isLoading={crearMutation.isPending}
              >
                Crear Profesional
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NuevoProfesionalWizard;
