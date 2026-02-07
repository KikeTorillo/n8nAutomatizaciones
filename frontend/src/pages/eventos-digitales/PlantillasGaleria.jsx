import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Crown, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { BackButton, Button, LoadingSpinner } from '@/components/ui';
import { InvitacionDinamica } from '@/components/eventos-digitales';
import { usePlantillas } from '@/hooks/otros';
import { usePlantillaPreview } from '@/hooks/otros/eventos-digitales';
import { TIPOS_EVENTO } from '@/schemas/evento.schema';
import { TIPOS_EVENTO_EMOJIS } from './constants';

const TIPOS_EVENTO_MAP = Object.fromEntries(
  TIPOS_EVENTO.map(t => [t.value, { label: t.label, emoji: TIPOS_EVENTO_EMOJIS[t.value] || '🎉' }])
);

const INITIAL_VISIBLE = 4;

function PlantillaCard({ plantilla, tipo }) {
  const navigate = useNavigate();
  const { tema, evento, bloques } = usePlantillaPreview(plantilla, { tipoEventoFallback: tipo });

  return (
    <div
      className="group relative rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer"
      onClick={() => navigate(`/eventos-digitales/plantillas/preview/${plantilla.id}?tipo=${tipo}`)}
    >
      {/* Preview visual */}
      <div className="aspect-[3/4] relative overflow-hidden">
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

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-900 shadow-lg">
              <Eye className="w-4 h-4" />
              Ver plantilla
            </span>
          </div>
        </div>

        {/* Badge premium */}
        {plantilla.es_premium && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-yellow-400 rounded-full text-xs font-bold text-yellow-900">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {plantilla.nombre}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex gap-1">
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tema.color_primario }} />
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tema.color_secundario }} />
            <div className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: tema.color_fondo }} />
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tema.color_texto }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoriaPlantillas({ tipo, plantillas }) {
  const [expanded, setExpanded] = useState(false);
  const tipoInfo = TIPOS_EVENTO_MAP[tipo] || { label: tipo, emoji: '🎉' };
  const visibles = expanded ? plantillas : plantillas.slice(0, INITIAL_VISIBLE);
  const restantes = plantillas.length - INITIAL_VISIBLE;

  return (
    <div className="mb-10">
      {/* Header de categoría */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{tipoInfo.emoji}</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{tipoInfo.label}</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {plantillas.length} {plantillas.length === 1 ? 'plantilla' : 'plantillas'}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {visibles.map((plantilla) => (
          <PlantillaCard key={plantilla.id} plantilla={plantilla} tipo={tipo} />
        ))}
      </div>

      {/* Ver más */}
      {restantes > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {expanded ? (
              <>
                Ver menos <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Ver más ({restantes}) <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function PlantillasGaleria() {
  const navigate = useNavigate();
  const { data: plantillas, isLoading } = usePlantillas();

  // Agrupar por tipo_evento
  const porTipo = useMemo(() => {
    if (!plantillas) return {};
    const grupos = {};
    for (const p of plantillas) {
      const tipo = p.tipo_evento || 'otro';
      if (!grupos[tipo]) grupos[tipo] = [];
      grupos[tipo].push(p);
    }
    return grupos;
  }, [plantillas]);

  // Orden de categorías
  const tiposOrdenados = useMemo(() => {
    const orden = ['boda', 'xv_anos', 'cumpleanos', 'bautizo', 'corporativo', 'otro'];
    return orden.filter((t) => porTipo[t]?.length > 0);
  }, [porTipo]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <BackButton to="/eventos-digitales" className="mb-4" />

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Elige una plantilla
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Selecciona un diseño y personalízalo después en el editor
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : tiposOrdenados.length > 0 ? (
          <>
            {tiposOrdenados.map((tipo) => (
              <CategoriaPlantillas
                key={tipo}
                tipo={tipo}
                plantillas={porTipo[tipo]}
              />
            ))}
          </>
        ) : (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              No hay plantillas disponibles aún
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Puedes crear tu evento sin plantilla y diseñar desde cero
            </p>
          </div>
        )}

        {/* Crear sin plantilla */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={() => navigate('/eventos-digitales/nuevo')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors underline underline-offset-2"
          >
            Crear sin plantilla
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlantillasGaleria;
