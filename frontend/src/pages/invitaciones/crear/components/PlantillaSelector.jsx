/**
 * PlantillaSelector — Grid de plantillas filtradas por tipo de evento (paso 3)
 */
import { memo, useMemo } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { usePlantillasPublicas } from '@/hooks/otros/eventos-digitales';
import PlantillaPreviewImage from '../../components/PlantillaPreviewImage';

const PlantillaCard = memo(function PlantillaCard({ plantilla, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(plantilla)}
      className={`relative text-left rounded-2xl overflow-hidden border-2 transition-all ${
        selected
          ? 'border-pink-500 ring-2 ring-pink-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800">
        <PlantillaPreviewImage plantilla={plantilla} />
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">{plantilla.nombre}</h3>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
});

const PlantillaSelector = memo(function PlantillaSelector({ tipoEvento, plantillaSeleccionada, onChange }) {
  const params = useMemo(() => ({
    activo: true,
    ...(tipoEvento && { tipo_evento: tipoEvento }),
  }), [tipoEvento]);

  const { data: plantillasData, isLoading } = usePlantillasPublicas(params);
  const plantillas = plantillasData?.plantillas || [];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
        Elige una plantilla
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
        Podrás personalizar todos los detalles en el editor
      </p>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
        </div>
      ) : plantillas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
          <p className="text-gray-500 dark:text-gray-400">
            No hay plantillas disponibles para este tipo de evento aún. Puedes continuar sin plantilla.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {plantillas.map((p) => (
            <PlantillaCard
              key={p.id}
              plantilla={p}
              selected={plantillaSeleccionada?.id === p.id}
              onSelect={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default PlantillaSelector;
