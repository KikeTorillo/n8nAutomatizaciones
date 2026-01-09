import { AlertTriangle } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';

/**
 * Alerta que muestra servicios activos sin profesionales asignados
 * Permite hacer scroll al servicio o abrir el modal de asignación
 */
function ServiciosSinProfesionalesAlert({ servicios, onAsignarProfesionales }) {
  // Filtrar servicios activos sin profesionales
  const serviciosSinProfesional = servicios?.filter(
    s => s.total_profesionales_asignados === 0 && s.activo
  ) || [];

  if (serviciosSinProfesional.length === 0) return null;

  const handleScrollToServicio = (servicioId, e) => {
    e.preventDefault();
    document.getElementById(`servicio-${servicioId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  };

  const handleAsignarPrimero = () => {
    const primerServicio = serviciosSinProfesional[0];
    if (primerServicio) {
      onAsignarProfesionales(primerServicio);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 mt-6">
      <Alert
        variant="warning"
        icon={AlertTriangle}
        title={`Atención: ${serviciosSinProfesional.length} servicio${serviciosSinProfesional.length !== 1 ? 's' : ''} sin profesionales asignados`}
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={handleAsignarPrimero}
            className="bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
          >
            Asignar profesionales al primer servicio
          </Button>
        }
      >
        <p>
          Los siguientes servicios activos no tienen profesionales asignados.
          Asigna al menos un profesional a cada servicio para poder crear citas:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          {serviciosSinProfesional.map(servicio => (
            <li key={servicio.id}>
              <a
                href={`#servicio-${servicio.id}`}
                className="font-medium underline hover:text-amber-900 dark:hover:text-amber-200"
                onClick={(e) => handleScrollToServicio(servicio.id, e)}
              >
                {servicio.nombre}
              </a>
            </li>
          ))}
        </ul>
      </Alert>
    </div>
  );
}

export default ServiciosSinProfesionalesAlert;
