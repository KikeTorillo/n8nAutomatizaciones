import { useState } from 'react';
import {
  Briefcase,
  Calendar,
  Building2,
  MapPin,
  Home,
  Building,
} from 'lucide-react';
import InfoCard from '@/components/profesionales/cards/InfoCard';
import EditableField from '@/components/profesionales/cards/EditableField';
import QuickEditDrawer from '@/components/profesionales/cards/QuickEditDrawer';
import { ESTADOS_LABORALES, TIPOS_CONTRATACION, FORMAS_PAGO } from '@/hooks/useProfesionales';
import { useMotivosSalida } from '@/hooks/useMotivosSalida';
import { useDepartamentos } from '@/hooks/useDepartamentos';
import { usePuestos } from '@/hooks/usePuestos';

// Días de la semana para ubicaciones
const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lun' },
  { key: 'martes', label: 'Mar' },
  { key: 'miercoles', label: 'Mié' },
  { key: 'jueves', label: 'Jue' },
  { key: 'viernes', label: 'Vie' },
  { key: 'sabado', label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
];

/**
 * Tab de Trabajo del profesional
 * Muestra clasificación laboral, organización y ubicaciones
 */
function TrabajoTab({ profesional }) {
  const [editModal, setEditModal] = useState(null);

  // Datos para selects
  const { data: motivosSalida = [] } = useMotivosSalida();
  const { data: departamentos = [] } = useDepartamentos({ activo: true });
  const { data: puestos = [] } = usePuestos({ activo: true });

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Calcular antigüedad
  const calcularAntiguedad = (fechaIngreso) => {
    if (!fechaIngreso) return null;
    const inicio = new Date(fechaIngreso);
    const ahora = new Date();
    const diff = ahora - inicio;
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const anios = Math.floor(dias / 365);
    const meses = Math.floor((dias % 365) / 30);

    if (anios > 0) {
      return `${anios} año${anios > 1 ? 's' : ''}${meses > 0 ? `, ${meses} mes${meses > 1 ? 'es' : ''}` : ''}`;
    }
    if (meses > 0) {
      return `${meses} mes${meses > 1 ? 'es' : ''}`;
    }
    return `${dias} día${dias > 1 ? 's' : ''}`;
  };

  // Obtener nombre de ubicación
  const getUbicacionNombre = (ubicacionId) => {
    // TODO: Implementar lookup de ubicaciones
    if (!ubicacionId) return null;
    return `Ubicación ${ubicacionId}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Clasificación Laboral */}
        <InfoCard
          title="Clasificación Laboral"
          icon={Briefcase}
          onEdit={() => setEditModal('clasificacion')}
        >
          <EditableField
            label="Estado"
            value={profesional.estado}
            renderValue={(val) => {
              const info = ESTADOS_LABORALES[val];
              if (!info) return val;
              return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${info.color}-100 dark:bg-${info.color}-900/40 text-${info.color}-800 dark:text-${info.color}-300`}>
                  {info.label}
                </span>
              );
            }}
            onEdit={() => setEditModal('clasificacion')}
          />
          <EditableField
            label="Tipo de contratación"
            value={profesional.tipo_contratacion}
            renderValue={(val) => TIPOS_CONTRATACION[val]?.label || val}
            onEdit={() => setEditModal('clasificacion')}
          />
          <EditableField
            label="Forma de pago"
            value={profesional.forma_pago}
            renderValue={(val) => FORMAS_PAGO[val]?.label || val}
            onEdit={() => setEditModal('clasificacion')}
          />
          {profesional.estado === 'baja' && (
            <>
              <EditableField
                label="Motivo de salida"
                value={profesional.motivo_salida_nombre || profesional.motivo_salida_id}
                onEdit={() => setEditModal('clasificacion')}
              />
              <EditableField
                label="Fecha de baja"
                value={profesional.fecha_baja}
                renderValue={formatDate}
                onEdit={() => setEditModal('clasificacion')}
              />
            </>
          )}
        </InfoCard>

        {/* Card: Fechas Importantes */}
        <InfoCard
          title="Fechas Importantes"
          icon={Calendar}
          onEdit={() => setEditModal('fechas')}
        >
          <EditableField
            label="Fecha de contratación"
            value={profesional.fecha_ingreso}
            renderValue={formatDate}
            onEdit={() => setEditModal('fechas')}
          />
          <EditableField
            label="Antigüedad"
            value={profesional.fecha_ingreso}
            renderValue={calcularAntiguedad}
          />
        </InfoCard>

        {/* Card: Estructura Organizacional */}
        <InfoCard
          title="Estructura Organizacional"
          icon={Building2}
          onEdit={() => setEditModal('organizacion')}
        >
          <EditableField
            label="Departamento"
            value={profesional.departamento_nombre || profesional.departamento_id}
            onEdit={() => setEditModal('organizacion')}
          />
          <EditableField
            label="Puesto"
            value={profesional.puesto_nombre || profesional.puesto_id}
            onEdit={() => setEditModal('organizacion')}
          />
          <EditableField
            label="Supervisor"
            value={profesional.supervisor_nombre || profesional.supervisor_id}
            emptyText="Sin supervisor asignado"
            onEdit={() => setEditModal('organizacion')}
          />
          <EditableField
            label="Responsable RRHH"
            value={profesional.responsable_rrhh_nombre || profesional.responsable_rrhh_id}
            emptyText="Sin responsable asignado"
            onEdit={() => setEditModal('organizacion')}
          />
        </InfoCard>

        {/* Card: Ubicación de Trabajo (Trabajo Híbrido) */}
        <InfoCard
          title="Ubicación de Trabajo"
          icon={MapPin}
          onEdit={() => setEditModal('ubicaciones')}
        >
          <div className="grid grid-cols-7 gap-2 text-center">
            {DIAS_SEMANA.map(({ key, label }) => {
              const ubicacionId = profesional[`ubicacion_${key}_id`];
              const tieneUbicacion = !!ubicacionId;

              return (
                <div key={key} className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {label}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tieneUbicacion
                        ? 'bg-primary-100 dark:bg-primary-900/40'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                    title={tieneUbicacion ? getUbicacionNombre(ubicacionId) : 'Sin asignar'}
                  >
                    {tieneUbicacion ? (
                      <Building className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            Configuración de trabajo híbrido por día
          </p>
        </InfoCard>
      </div>

      {/* Modales de edición */}
      <QuickEditDrawer
        isOpen={editModal === 'clasificacion'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Clasificación Laboral"
        fields={[
          {
            name: 'estado',
            label: 'Estado',
            type: 'select',
            options: Object.entries(ESTADOS_LABORALES).map(([value, { label }]) => ({
              value,
              label,
            })),
          },
          {
            name: 'tipo_contratacion',
            label: 'Tipo de contratación',
            type: 'select',
            options: Object.entries(TIPOS_CONTRATACION).map(([value, { label }]) => ({
              value,
              label,
            })),
          },
          {
            name: 'forma_pago',
            label: 'Forma de pago',
            type: 'select',
            options: Object.entries(FORMAS_PAGO).map(([value, { label }]) => ({
              value,
              label,
            })),
          },
        ]}
        initialValues={{
          estado: profesional.estado || '',
          tipo_contratacion: profesional.tipo_contratacion || '',
          forma_pago: profesional.forma_pago || '',
        }}
      />

      <QuickEditDrawer
        isOpen={editModal === 'fechas'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Fechas"
        fields={[
          { name: 'fecha_ingreso', label: 'Fecha de contratación', type: 'date' },
        ]}
        initialValues={{
          fecha_ingreso: profesional.fecha_ingreso || '',
        }}
      />

      <QuickEditDrawer
        isOpen={editModal === 'organizacion'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Estructura Organizacional"
        fields={[
          {
            name: 'departamento_id',
            label: 'Departamento',
            type: 'select',
            options: departamentos.map((d) => ({ value: d.id, label: d.nombre })),
          },
          {
            name: 'puesto_id',
            label: 'Puesto',
            type: 'select',
            options: puestos.map((p) => ({ value: p.id, label: p.nombre })),
          },
        ]}
        initialValues={{
          departamento_id: profesional.departamento_id || '',
          puesto_id: profesional.puesto_id || '',
        }}
      />
    </div>
  );
}

export default TrabajoTab;
