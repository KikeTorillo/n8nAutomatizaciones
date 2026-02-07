import { useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BackButton, Button, LoadingSpinner } from '@/components/ui';
import { usePlantilla, usePlantillas } from '@/hooks/otros';
import { InvitacionDinamica } from '@/components/eventos-digitales';
import { generarPreviewData } from '@/utils/plantillaDummyData';
import '@/components/eventos-digitales/publico/EventoAnimations.css';

const TEMA_DEFAULT = {
  color_primario: '#ec4899',
  color_secundario: '#fce7f3',
  color_fondo: '#fdf2f8',
  color_texto: '#1f2937',
  color_texto_claro: '#6b7280',
  fuente_titulo: 'Playfair Display',
  fuente_cuerpo: 'Inter',
};

function PlantillaPreview() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tipoFiltro = searchParams.get('tipo') || '';

  // Query: plantilla actual
  const { data: plantilla, isLoading } = usePlantilla(id);

  // Query: lista para navegación ←→
  const { data: todasPlantillas } = usePlantillas(
    tipoFiltro ? { tipo_evento: tipoFiltro } : {}
  );

  // Índice actual y navegación
  const plantillasList = useMemo(() => todasPlantillas || [], [todasPlantillas]);
  const currentIndex = useMemo(
    () => plantillasList.findIndex((p) => String(p.id) === String(id)),
    [plantillasList, id]
  );

  // Tema de la plantilla
  const tema = useMemo(
    () => ({ ...TEMA_DEFAULT, ...(plantilla?.tema || {}) }),
    [plantilla]
  );

  // Datos dummy basados en tipo de evento
  const tipoEvento = plantilla?.tipo_evento || tipoFiltro || 'boda';
  const { evento, bloques } = useMemo(
    () => generarPreviewData(tipoEvento, tema),
    [tipoEvento, tema]
  );

  // Cargar Google Fonts
  useEffect(() => {
    if (!plantilla) return;
    const fuentes = [tema.fuente_titulo, tema.fuente_cuerpo].filter(Boolean);
    const fuentesUnicas = [...new Set(fuentes)];
    if (fuentesUnicas.length > 0) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?${fuentesUnicas.map((f) => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700`).join('&')}&display=swap`;
      document.head.appendChild(link);
      return () => document.head.removeChild(link);
    }
  }, [plantilla, tema.fuente_titulo, tema.fuente_cuerpo]);

  // Navegación entre plantillas
  const goTo = useCallback(
    (direction) => {
      const newIndex = currentIndex + direction;
      if (newIndex < 0 || newIndex >= plantillasList.length) return;
      const next = plantillasList[newIndex];
      navigate(`/eventos-digitales/plantillas/preview/${next.id}${tipoFiltro ? `?tipo=${tipoFiltro}` : ''}`, { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentIndex, plantillasList, navigate, tipoFiltro]
  );

  // "Usar esta plantilla"
  const handleUsar = useCallback(() => {
    navigate('/eventos-digitales/nuevo', {
      state: {
        plantilla_id: plantilla?.id,
        plantillaNombre: plantilla?.nombre,
        tema: plantilla?.tema,
      },
    });
  }, [navigate, plantilla]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plantilla) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Plantilla no encontrada</p>
          <Button variant="outline" onClick={() => navigate('/eventos-digitales/plantillas/galeria')}>
            Volver a la galería
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Botón volver - fixed */}
      <BackButton
        to="/eventos-digitales/plantillas/galeria"
        className="fixed top-4 left-4 z-50"
      />

      {/* Preview — igual que la página pública */}
      <InvitacionDinamica
        evento={evento}
        invitado={null}
        bloques={bloques}
        tema={tema}
        onConfirmRSVP={() => {}}
        isLoadingRSVP={false}
      />

      {/* Barra de navegación sticky bottom */}
      <div className="sticky bottom-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Prev */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(-1)}
            disabled={currentIndex <= 0}
            className="flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Indicador */}
          <div className="text-center flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {plantilla.nombre}
            </p>
            {plantillasList.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentIndex + 1} / {plantillasList.length}
              </p>
            )}
          </div>

          {/* Next */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(1)}
            disabled={currentIndex >= plantillasList.length - 1}
            className="flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* CTA */}
          <Button onClick={handleUsar} className="flex-shrink-0">
            Usar plantilla
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PlantillaPreview;
