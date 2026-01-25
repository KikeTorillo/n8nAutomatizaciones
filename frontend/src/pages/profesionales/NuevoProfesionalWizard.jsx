import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, Key } from 'lucide-react';
import { Input, Select, BaseFormLayout } from '@/components/ui';
import { useCrearProfesional, TIPOS_CONTRATACION } from '@/hooks/personas';
import { useDepartamentos } from '@/hooks/personas';
import { usePuestos } from '@/hooks/personas';
import { useToast } from '@/hooks/utils';

// Configuración de pasos del wizard
const WIZARD_STEPS = [
  { id: 'basica', label: 'Información Básica', description: 'Datos personales', icon: User },
  { id: 'clasificacion', label: 'Clasificación', description: 'Rol y categoría', icon: Building2 },
  { id: 'acceso', label: 'Acceso al Sistema', description: 'Usuario y permisos', icon: Key },
];

/**
 * Paso 1: Información Básica
 */
function InfoBasicaStep({ formData, updateField }) {
  return (
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
  );
}

/**
 * Paso 2: Clasificación
 */
function ClasificacionStep({ formData, updateField, departamentos, puestos }) {
  return (
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
  );
}

/**
 * Paso 3: Acceso al Sistema
 */
function AccesoStep({ formData, updateField, departamentos, puestos }) {
  return (
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
  );
}

/**
 * Wizard de 3 pasos para crear un nuevo profesional
 * Ruta: /profesionales/nuevo
 *
 * Refactorizado para usar BaseFormLayout (Ene 2026)
 */
function NuevoProfesionalWizard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
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
    switch (activeStep) {
      case 0:
        if (!formData.nombre_completo.trim()) {
          toast.error('El nombre es requerido');
          return false;
        }
        if (formData.modoAcceso === 'invitacion' && !formData.email.trim()) {
          toast.error('El email es requerido para enviar la invitación');
          return false;
        }
        return true;
      case 1:
      case 2:
        return true;
      default:
        return true;
    }
  };

  // Siguiente paso
  const handleNext = () => {
    if (validarPaso()) {
      setCompletedSteps(prev => new Set([...prev, WIZARD_STEPS[activeStep].id]));
      setActiveStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  };

  // Paso anterior
  const handlePrevious = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
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

  const isLastStep = activeStep === WIZARD_STEPS.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BaseFormLayout
        title="Nuevo Profesional"
        subtitle="Completa los datos para registrar un nuevo profesional"
        backTo="/profesionales"
        backLabel="Volver a Profesionales"
        maxWidth="max-w-2xl"
        // Wizard
        steps={WIZARD_STEPS}
        activeStep={activeStep}
        completedSteps={completedSteps}
        // Footer
        showPreviousButton={activeStep > 0}
        onPrevious={handlePrevious}
        showNextButton={!isLastStep}
        onNext={handleNext}
        submitLabel="Crear Profesional"
        onSubmit={isLastStep ? handleCrear : handleNext}
        isSubmitting={crearMutation.isPending}
        hideFooter={false}
      >
        {activeStep === 0 && (
          <InfoBasicaStep
            formData={formData}
            updateField={updateField}
          />
        )}
        {activeStep === 1 && (
          <ClasificacionStep
            formData={formData}
            updateField={updateField}
            departamentos={departamentos}
            puestos={puestos}
          />
        )}
        {activeStep === 2 && (
          <AccesoStep
            formData={formData}
            updateField={updateField}
            departamentos={departamentos}
            puestos={puestos}
          />
        )}
      </BaseFormLayout>
    </div>
  );
}

export default NuevoProfesionalWizard;
