/**
 * Página de gestión de plantillas de eventos digitales
 * Accesible para admins de organización con módulo eventos-digitales
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
import {
  BasePageLayout,
  Button,
  ConfirmDialog,
  LoadingSpinner,
} from '@/components/ui';
import { InvitacionDinamica } from '@/components/eventos-digitales';
import { useToast } from '@/hooks/utils';
import { useModalManager } from '@/hooks/utils';
import {
  usePlantillas,
  useCrearPlantilla,
  useEliminarPlantilla,
} from '@/hooks/otros';
import { generarPreviewData } from '@/utils/plantillaDummyData';

const TIPOS_EVENTO = [
  { value: 'boda', label: 'Boda' },
  { value: 'xv_anos', label: 'XV Años' },
  { value: 'bautizo', label: 'Bautizo' },
  { value: 'cumpleanos', label: 'Cumpleaños' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'universal', label: 'Universal' },
  { value: 'otro', label: 'Otro' },
];

const CATEGORIAS = [
  { value: '', label: 'Sin categoría' },
  { value: 'infantil', label: 'Infantil' },
  { value: 'juvenil', label: 'Juvenil' },
  { value: 'adulto', label: 'Adulto' },
  { value: 'elegante', label: 'Elegante' },
  { value: 'moderno', label: 'Moderno' },
  { value: 'rustico', label: 'Rústico' },
  { value: 'tematico', label: 'Temático' },
  { value: 'clasico', label: 'Clásico' },
];

const TEMA_DEFAULT = {
  color_primario: '#ec4899',
  color_secundario: '#fce7f3',
  color_fondo: '#fdf2f8',
  color_texto: '#1f2937',
  color_texto_claro: '#6b7280',
  fuente_titulo: 'Playfair Display',
  fuente_cuerpo: 'Inter',
  patron_fondo: 'none',
  patron_opacidad: 0.1,
  decoracion_esquinas: 'none',
  icono_principal: 'none',
  animacion_entrada: 'fade',
  efecto_titulo: 'none',
  marco_fotos: 'none',
  stickers: [],
};

function PlantillaAdminCard({ plantilla, onEdit, onDelete }) {
  const tema = useMemo(
    () => ({ ...TEMA_DEFAULT, ...(plantilla.tema || {}) }),
    [plantilla.tema]
  );

  const tipoEvento = plantilla.tipo_evento || 'boda';
  const { evento, bloques } = useMemo(
    () => generarPreviewData(tipoEvento, tema),
    [tipoEvento, tema]
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Preview real */}
      <div className="aspect-[4/3] relative overflow-hidden" style={{ backgroundColor: tema.color_fondo }}>
        {plantilla.preview_url ? (
          <img
            src={plantilla.preview_url}
            alt={plantilla.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full pointer-events-none">
            <div className="transform scale-[0.22] origin-top-left" style={{ width: '455%' }}>
              <InvitacionDinamica
                evento={evento}
                invitado={null}
                bloques={bloques}
                tema={tema}
                onConfirmRSVP={() => {}}
                isLoadingRSVP={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{plantilla.nombre}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{plantilla.codigo}</p>
          </div>
          {plantilla.es_premium && (
            <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-full">
              Premium
            </span>
          )}
        </div>

        {/* Paleta de colores */}
        <div className="flex items-center gap-1 mt-2">
          {['color_primario', 'color_secundario', 'color_fondo', 'color_texto'].map((key) => (
            <div
              key={key}
              className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: tema[key] }}
              title={key.replace('color_', '').replace('_', ' ')}
            />
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
            {TIPOS_EVENTO.find(t => t.value === plantilla.tipo_evento)?.label || plantilla.tipo_evento}
          </span>
          {plantilla.categoria && (
            <span className="px-2 py-0.5 text-xs bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 rounded-full">
              {CATEGORIAS.find(c => c.value === plantilla.categoria)?.label || plantilla.categoria}
            </span>
          )}
          {plantilla.subcategoria && (
            <span className="px-2 py-0.5 text-xs bg-secondary-100 dark:bg-secondary-900/40 text-secondary-600 dark:text-secondary-300 rounded-full">
              {plantilla.subcategoria}
            </span>
          )}
          {plantilla.activo === false && (
            <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-full">
              Inactiva
            </span>
          )}
        </div>

        {plantilla.descripcion && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{plantilla.descripcion}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" size="sm" onClick={() => onEdit(plantilla)}>
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(plantilla.id)}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlantillasPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    delete: { isOpen: false, data: null },
  });

  // Queries
  const { data: plantillasData, isLoading } = usePlantillas({
    tipo_evento: filtroTipo || undefined,
    categoria: filtroCategoria || undefined,
  });
  const plantillas = plantillasData || [];

  // Mutations
  const crearPlantilla = useCrearPlantilla();
  const eliminarPlantilla = useEliminarPlantilla();

  const handleNuevaPlantilla = async () => {
    try {
      const resultado = await crearPlantilla.mutateAsync({
        nombre: 'Nueva Plantilla',
        codigo: `plantilla-${Date.now()}`,
        tipo_evento: 'cumpleanos',
        tema: TEMA_DEFAULT,
      });
      navigate(`/eventos-digitales/plantillas/${resultado.id}/editor`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear la plantilla');
    }
  };

  const handleEditar = (plantilla) => {
    navigate(`/eventos-digitales/plantillas/${plantilla.id}/editor`);
  };

  const handleEliminar = async () => {
    const plantillaId = getModalData('delete');
    if (!plantillaId) return;

    try {
      const result = await eliminarPlantilla.mutateAsync(plantillaId);
      if (result.desactivado) {
        toast.info('Plantilla desactivada (está en uso)');
      } else {
        toast.success('Plantilla eliminada');
      }
      closeModal('delete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <BasePageLayout
      moduleTitle="Eventos Digitales"
      moduleDescription="Gestión de plantillas de diseño para invitaciones digitales"
      backTo="/eventos-digitales"
      backLabel="Volver a Eventos"
      sectionIcon={Palette}
      sectionTitle="Plantillas"
      actions={
        <Button onClick={handleNuevaPlantilla} disabled={crearPlantilla.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          {crearPlantilla.isPending ? 'Creando...' : 'Nueva Plantilla'}
        </Button>
      }
    >
      <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        {/* Filtro por tipo */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tipo de Evento</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroTipo('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !filtroTipo ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            {TIPOS_EVENTO.map((tipo) => (
              <button
                key={tipo.value}
                onClick={() => setFiltroTipo(tipo.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filtroTipo === tipo.value ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tipo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por categoría */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Categoría</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroCategoria('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !filtroCategoria ? 'bg-pink-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            {CATEGORIAS.filter(c => c.value).map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFiltroCategoria(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filtroCategoria === cat.value ? 'bg-pink-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de plantillas */}
      {isLoading ? (
        <LoadingSpinner />
      ) : plantillas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantillas.map((plantilla) => (
            <PlantillaAdminCard
              key={plantilla.id}
              plantilla={plantilla}
              onEdit={handleEditar}
              onDelete={(id) => openModal('delete', id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Palette className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay plantillas
            {filtroTipo && ` de tipo "${TIPOS_EVENTO.find(t => t.value === filtroTipo)?.label}"`}
            {filtroCategoria && ` en categoría "${CATEGORIAS.find(c => c.value === filtroCategoria)?.label}"`}
          </p>
          <Button onClick={handleNuevaPlantilla} className="mt-4" disabled={crearPlantilla.isPending}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primera Plantilla
          </Button>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={handleEliminar}
        title="Eliminar plantilla"
        message="¿Estás seguro de eliminar esta plantilla? Si está en uso, solo será desactivada."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarPlantilla.isPending}
      />
      </div>
    </BasePageLayout>
  );
}

export default PlantillasPage;
