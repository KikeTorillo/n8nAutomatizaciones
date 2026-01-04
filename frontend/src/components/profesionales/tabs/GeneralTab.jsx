import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  FileText,
  Palette,
  Tag,
  Briefcase,
  Globe,
} from 'lucide-react';
import InfoCard from '@/components/profesionales/cards/InfoCard';
import EditableField from '@/components/profesionales/cards/EditableField';
import QuickEditDrawer from '@/components/profesionales/cards/QuickEditDrawer';
import { IDIOMAS_DISPONIBLES } from '@/hooks/useProfesionales';

/**
 * Tab General del profesional
 * Muestra información básica, contacto, descripción y categorías
 */
function GeneralTab({ profesional }) {
  // Estado para modales de edición
  const [editModal, setEditModal] = useState(null);

  // Formatear idiomas
  const formatIdiomas = (idiomas) => {
    if (!idiomas || idiomas.length === 0) return null;
    return idiomas
      .map((codigo) => {
        const idioma = IDIOMAS_DISPONIBLES.find((i) => i.value === codigo);
        return idioma?.label || codigo;
      })
      .join(', ');
  };

  // Formatear categorías
  const formatCategorias = (categorias) => {
    if (!categorias || categorias.length === 0) return null;
    return categorias.map((c) => c.nombre).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Grid de cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Información Básica */}
        <InfoCard
          title="Información Básica"
          icon={User}
          onEdit={() => setEditModal('basicos')}
        >
          <EditableField
            label="Nombre completo"
            value={profesional.nombre_completo}
            onEdit={() => setEditModal('basicos')}
          />
          <EditableField
            label="Código"
            value={profesional.codigo}
            emptyText="Sin código asignado"
            onEdit={() => setEditModal('basicos')}
          />
          <EditableField
            label="Color calendario"
            value={profesional.color_calendario}
            renderValue={(color) => (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: color || '#753572' }}
                />
                <span className="text-sm text-gray-500">{color || '#753572'}</span>
              </div>
            )}
            onEdit={() => setEditModal('basicos')}
          />
        </InfoCard>

        {/* Card: Contacto */}
        <InfoCard
          title="Contacto"
          icon={Mail}
          onEdit={() => setEditModal('contacto')}
        >
          <EditableField
            label="Email de trabajo"
            value={profesional.email}
            onEdit={() => setEditModal('contacto')}
          />
          <EditableField
            label="Teléfono de trabajo"
            value={profesional.telefono}
            onEdit={() => setEditModal('contacto')}
          />
        </InfoCard>

        {/* Card: Descripción */}
        <InfoCard
          title="Descripción"
          icon={FileText}
          onEdit={() => setEditModal('descripcion')}
          className="lg:col-span-2"
        >
          <EditableField
            label="Biografía / Descripción"
            value={profesional.descripcion}
            emptyText="Sin descripción"
            onEdit={() => setEditModal('descripcion')}
          />
        </InfoCard>

        {/* Card: Categorías */}
        <InfoCard
          title="Categorías"
          icon={Tag}
        >
          <EditableField
            label="Categorías asignadas"
            value={profesional.categorias}
            renderValue={formatCategorias}
            emptyText="Sin categorías"
          />
        </InfoCard>

        {/* Card: Información Profesional */}
        <InfoCard
          title="Información Profesional"
          icon={Briefcase}
          onEdit={() => setEditModal('profesional')}
        >
          <EditableField
            label="Años de experiencia"
            value={profesional.anos_experiencia}
            renderValue={(val) => val ? `${val} años` : null}
            onEdit={() => setEditModal('profesional')}
          />
          <EditableField
            label="Idiomas"
            value={profesional.idiomas}
            renderValue={formatIdiomas}
            onEdit={() => setEditModal('profesional')}
          />
          <EditableField
            label="Disponible online"
            value={profesional.disponible_online}
            renderValue={(val) => val ? 'Sí' : 'No'}
            onEdit={() => setEditModal('profesional')}
          />
          <EditableField
            label="Licencias profesionales"
            value={profesional.licencias_profesionales}
            renderValue={(val) => typeof val === 'object' ? JSON.stringify(val) : val}
            emptyText="Sin licencias"
            onEdit={() => setEditModal('profesional')}
          />
        </InfoCard>
      </div>

      {/* Modales de edición */}
      <QuickEditDrawer
        isOpen={editModal === 'basicos'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Información Básica"
        fields={[
          { name: 'nombre_completo', label: 'Nombre completo', type: 'text', required: true },
          { name: 'codigo', label: 'Código', type: 'text', placeholder: 'Ej: EMP-001' },
          { name: 'color_calendario', label: 'Color calendario', type: 'text', placeholder: '#753572' },
        ]}
        initialValues={{
          nombre_completo: profesional.nombre_completo || '',
          codigo: profesional.codigo || '',
          color_calendario: profesional.color_calendario || '',
        }}
      />

      <QuickEditDrawer
        isOpen={editModal === 'contacto'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Contacto"
        fields={[
          { name: 'email', label: 'Email de trabajo', type: 'email' },
          { name: 'telefono', label: 'Teléfono de trabajo', type: 'tel', placeholder: '5512345678' },
        ]}
        initialValues={{
          email: profesional.email || '',
          telefono: profesional.telefono || '',
        }}
      />

      <QuickEditDrawer
        isOpen={editModal === 'descripcion'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Descripción"
        fields={[
          { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Describe al profesional...' },
        ]}
        initialValues={{
          descripcion: profesional.descripcion || '',
        }}
      />

      <QuickEditDrawer
        isOpen={editModal === 'profesional'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Información Profesional"
        fields={[
          { name: 'anos_experiencia', label: 'Años de experiencia', type: 'number', min: 0, max: 70 },
          {
            name: 'disponible_online',
            label: 'Disponible online',
            type: 'select',
            options: [
              { value: 'true', label: 'Sí' },
              { value: 'false', label: 'No' },
            ],
          },
          { name: 'licencias_profesionales', label: 'Licencias profesionales', type: 'textarea' },
        ]}
        initialValues={{
          anos_experiencia: profesional.anos_experiencia || '',
          disponible_online: profesional.disponible_online ? 'true' : 'false',
          licencias_profesionales: typeof profesional.licencias_profesionales === 'object'
            ? JSON.stringify(profesional.licencias_profesionales)
            : profesional.licencias_profesionales || '',
        }}
      />
    </div>
  );
}

export default GeneralTab;
