import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Crown, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';
import { usePlantillas } from '@/hooks/otros';

const TIPOS_EVENTO = {
  boda: { label: 'Boda', emoji: '💍' },
  xv_anos: { label: 'XV Años', emoji: '👑' },
  cumpleanos: { label: 'Cumpleaños', emoji: '🎂' },
  bautizo: { label: 'Bautizo', emoji: '✨' },
  corporativo: { label: 'Corporativo', emoji: '🏢' },
  otro: { label: 'Otro', emoji: '🎉' },
};

const INITIAL_VISIBLE = 4;

function PlantillaCard({ plantilla, tipo }) {
  const navigate = useNavigate();
  const tema = plantilla.tema || {
    color_primario: '#ec4899',
    color_secundario: '#fce7f3',
    color_fondo: '#fdf2f8',
    color_texto: '#1f2937',
  };

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
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4"
            style={{
              background: `linear-gradient(135deg, ${tema.color_primario}22, ${tema.color_secundario}44, ${tema.color_fondo})`,
            }}
          >
            {/* Mini preview con colores del tema */}
            <div className="w-full max-w-[120px] space-y-2">
              <div
                className="h-2 rounded-full mx-auto w-3/4"
                style={{ backgroundColor: tema.color_primario }}
              />
              <div
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: `${tema.color_secundario}88` }}
              >
                <div
                  className="text-[10px] font-bold mb-1"
                  style={{ color: tema.color_texto }}
                >
                  Invitación
                </div>
                <div
                  className="h-1 rounded w-full mb-1.5"
                  style={{ backgroundColor: tema.color_primario }}
                />
                <div className="flex justify-center gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded"
                      style={{
                        backgroundColor: tema.color_fondo,
                        border: `1px solid ${tema.color_primario}`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div
                className="h-1.5 rounded-full mx-auto w-1/2"
                style={{ backgroundColor: tema.color_secundario }}
              />
            </div>

            <Sparkles
              className="w-8 h-8 mt-3 opacity-40"
              style={{ color: tema.color_primario }}
            />
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
  const tipoInfo = TIPOS_EVENTO[tipo] || { label: tipo, emoji: '🎉' };
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
          <button
            onClick={() => navigate('/eventos-digitales')}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

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
