import { useState } from 'react';
import {
  Heart,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import InfoCard from '@/components/profesionales/cards/InfoCard';
import EditableField from '@/components/profesionales/cards/EditableField';
import QuickEditDrawer from '@/components/profesionales/cards/QuickEditDrawer';
import { GENEROS, ESTADOS_CIVILES } from '@/hooks/personas';

/**
 * Tab Personal del profesional
 * Muestra datos personales, identificación, dirección y contacto de emergencia
 */
function PersonalTab({ profesional }) {
  const [editModal, setEditModal] = useState(null);

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Calcular edad
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(fechaNacimiento);
    const ahora = new Date();
    let edad = ahora.getFullYear() - nacimiento.getFullYear();
    const m = ahora.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && ahora.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Datos Personales */}
        <InfoCard
          title="Datos Personales"
          icon={User}
          onEdit={() => setEditModal('personales')}
        >
          <EditableField
            label="Fecha de nacimiento"
            value={profesional.fecha_nacimiento}
            renderValue={(val) => {
              if (!val) return null;
              const fecha = formatDate(val);
              const edad = calcularEdad(val);
              return `${fecha} (${edad})`;
            }}
            onEdit={() => setEditModal('personales')}
          />
          <EditableField
            label="Género"
            value={profesional.genero}
            renderValue={(val) => GENEROS[val]?.label || val}
            onEdit={() => setEditModal('personales')}
          />
          <EditableField
            label="Estado civil"
            value={profesional.estado_civil}
            renderValue={(val) => ESTADOS_CIVILES[val]?.label || val}
            onEdit={() => setEditModal('personales')}
          />
          <EditableField
            label="Nacionalidad"
            value={profesional.nacionalidad}
            onEdit={() => setEditModal('personales')}
          />
          <EditableField
            label="Lugar de nacimiento"
            value={profesional.lugar_nacimiento_ciudad || profesional.lugar_nacimiento_pais}
            renderValue={() => {
              const ciudad = profesional.lugar_nacimiento_ciudad;
              const pais = profesional.lugar_nacimiento_pais;
              if (!ciudad && !pais) return null;
              return [ciudad, pais].filter(Boolean).join(', ');
            }}
            onEdit={() => setEditModal('personales')}
          />
          <EditableField
            label="Hijos dependientes"
            value={profesional.hijos_dependientes}
            renderValue={(val) => val !== null && val !== undefined ? `${val}` : null}
            onEdit={() => setEditModal('personales')}
          />
        </InfoCard>

        {/* Card: Identificación */}
        <InfoCard
          title="Identificación"
          icon={CreditCard}
          onEdit={() => setEditModal('identificacion')}
        >
          <EditableField
            label="Documento de identidad (INE/IFE)"
            value={profesional.documento_identidad}
            onEdit={() => setEditModal('identificacion')}
          />
          <EditableField
            label="Número de pasaporte"
            value={profesional.numero_pasaporte}
            onEdit={() => setEditModal('identificacion')}
          />
          <EditableField
            label="Número de seguro social (IMSS)"
            value={profesional.numero_seguro_social}
            onEdit={() => setEditModal('identificacion')}
          />
        </InfoCard>

        {/* Card: Dirección y Contacto Privado */}
        <InfoCard
          title="Dirección y Contacto Privado"
          icon={MapPin}
          onEdit={() => setEditModal('direccion')}
        >
          <EditableField
            label="Dirección"
            value={profesional.direccion}
            onEdit={() => setEditModal('direccion')}
          />
          <EditableField
            label="Distancia casa-trabajo"
            value={profesional.distancia_casa_trabajo_km}
            renderValue={(val) => val ? `${val} km` : null}
            onEdit={() => setEditModal('direccion')}
          />
          <EditableField
            label="Email privado"
            value={profesional.email_privado}
            onEdit={() => setEditModal('direccion')}
          />
          <EditableField
            label="Teléfono privado"
            value={profesional.telefono_privado}
            onEdit={() => setEditModal('direccion')}
          />
        </InfoCard>

        {/* Card: Contacto de Emergencia */}
        <InfoCard
          title="Contacto de Emergencia"
          icon={AlertTriangle}
          onEdit={() => setEditModal('emergencia')}
        >
          <EditableField
            label="Nombre del contacto"
            value={profesional.contacto_emergencia_nombre}
            onEdit={() => setEditModal('emergencia')}
          />
          <EditableField
            label="Teléfono del contacto"
            value={profesional.contacto_emergencia_telefono}
            onEdit={() => setEditModal('emergencia')}
          />
          {(!profesional.contacto_emergencia_nombre && !profesional.contacto_emergencia_telefono) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Sin contacto de emergencia registrado</span>
              </div>
            </div>
          )}
        </InfoCard>
      </div>

      {/* Modales de edición */}
      <QuickEditDrawer
        isOpen={editModal === 'personales'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Datos Personales"
        fields={[
          { name: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date' },
          {
            name: 'genero',
            label: 'Género',
            type: 'select',
            options: Object.entries(GENEROS).map(([value, { label }]) => ({
              value,
              label,
            })),
          },
          {
            name: 'estado_civil',
            label: 'Estado civil',
            type: 'select',
            options: Object.entries(ESTADOS_CIVILES).map(([value, { label }]) => ({
              value,
              label,
            })),
          },
          { name: 'nacionalidad', label: 'Nacionalidad', type: 'text' },
          { name: 'hijos_dependientes', label: 'Hijos dependientes', type: 'number', min: 0, max: 50 },
        ]}
        initialValues={{
          fecha_nacimiento: profesional.fecha_nacimiento || '',
          genero: profesional.genero || '',
          estado_civil: profesional.estado_civil || '',
          nacionalidad: profesional.nacionalidad || '',
          hijos_dependientes: profesional.hijos_dependientes || '',
        }}
      />

      <QuickEditDrawer
        isOpen={editModal === 'identificacion'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Identificación"
        fields={[
          { name: 'documento_identidad', label: 'Documento de identidad', type: 'text' },
          { name: 'numero_pasaporte', label: 'Número de pasaporte', type: 'text' },
          { name: 'numero_seguro_social', label: 'Número de seguro social', type: 'text' },
        ]}
        initialValues={{
          documento_identidad: profesional.documento_identidad || '',
          numero_pasaporte: profesional.numero_pasaporte || '',
          numero_seguro_social: profesional.numero_seguro_social || '',
        }}
      />

      <QuickEditDrawer
        isOpen={editModal === 'direccion'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Dirección y Contacto"
        fields={[
          { name: 'direccion', label: 'Dirección', type: 'textarea' },
          { name: 'distancia_casa_trabajo_km', label: 'Distancia casa-trabajo (km)', type: 'number', min: 0 },
          { name: 'email_privado', label: 'Email privado', type: 'email' },
          { name: 'telefono_privado', label: 'Teléfono privado', type: 'tel' },
        ]}
        initialValues={{
          direccion: profesional.direccion || '',
          distancia_casa_trabajo_km: profesional.distancia_casa_trabajo_km || '',
          email_privado: profesional.email_privado || '',
          telefono_privado: profesional.telefono_privado || '',
        }}
      />

      <QuickEditDrawer
        isOpen={editModal === 'emergencia'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Contacto de Emergencia"
        fields={[
          { name: 'contacto_emergencia_nombre', label: 'Nombre del contacto', type: 'text' },
          { name: 'contacto_emergencia_telefono', label: 'Teléfono del contacto', type: 'tel' },
        ]}
        initialValues={{
          contacto_emergencia_nombre: profesional.contacto_emergencia_nombre || '',
          contacto_emergencia_telefono: profesional.contacto_emergencia_telefono || '',
        }}
      />
    </div>
  );
}

export default PersonalTab;
