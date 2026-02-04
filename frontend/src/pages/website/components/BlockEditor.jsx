/**
 * ====================================================================
 * BLOCK EDITOR - WEBSITE BUILDER
 * ====================================================================
 * Vista de lista de bloques para el Website Builder.
 * Usa el componente genérico BlockListEditor del framework.
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @updated 2026-02-04 - Refactorizado para usar BlockListEditor del framework
 */

import { memo } from 'react';
import {
  Layout,
  Briefcase,
  MessageSquareQuote,
  Users,
  MousePointerClick,
  Mail,
  PanelBottom,
  Type,
  Image,
  Video,
  Minus,
  DollarSign,
  HelpCircle,
  Clock,
  TrendingUp,
  GitBranch,
} from 'lucide-react';
import { BlockListEditor } from '@/components/editor-framework';

// Editores de bloques específicos
import HeroEditor from './blocks/HeroEditor';
import ServiciosEditor from './blocks/ServiciosEditor';
import TestimoniosEditor from './blocks/TestimoniosEditor';
import EquipoEditor from './blocks/EquipoEditor';
import CtaEditor from './blocks/CtaEditor';
import ContactoEditor from './blocks/ContactoEditor';
import FooterEditor from './blocks/FooterEditor';
import TextoEditor from './blocks/TextoEditor';
import GaleriaEditor from './blocks/GaleriaEditor';
import VideoEditor from './blocks/VideoEditor';
import SeparadorEditor from './blocks/SeparadorEditor';
import PricingEditor from './blocks/PricingEditor';
import FaqEditor from './blocks/FaqEditor';
import CountdownEditor from './blocks/CountdownEditor';
import StatsEditor from './blocks/StatsEditor';
import TimelineEditor from './blocks/TimelineEditor';

/**
 * Iconos y colores por tipo de bloque
 */
export const BLOQUES_CONFIG = {
  hero: { icon: Layout, color: 'purple', label: 'Hero' },
  servicios: { icon: Briefcase, color: 'blue', label: 'Servicios' },
  testimonios: { icon: MessageSquareQuote, color: 'amber', label: 'Testimonios' },
  equipo: { icon: Users, color: 'green', label: 'Equipo' },
  cta: { icon: MousePointerClick, color: 'red', label: 'CTA' },
  contacto: { icon: Mail, color: 'indigo', label: 'Contacto' },
  footer: { icon: PanelBottom, color: 'gray', label: 'Footer' },
  texto: { icon: Type, color: 'slate', label: 'Texto' },
  galeria: { icon: Image, color: 'pink', label: 'Galería' },
  video: { icon: Video, color: 'rose', label: 'Video' },
  separador: { icon: Minus, color: 'neutral', label: 'Separador' },
  pricing: { icon: DollarSign, color: 'emerald', label: 'Precios' },
  faq: { icon: HelpCircle, color: 'sky', label: 'FAQ' },
  countdown: { icon: Clock, color: 'orange', label: 'Countdown' },
  stats: { icon: TrendingUp, color: 'violet', label: 'Estadísticas' },
  timeline: { icon: GitBranch, color: 'teal', label: 'Timeline' },
};

/**
 * Editores por tipo de bloque
 */
export const EDITORES_BLOQUE = {
  hero: HeroEditor,
  servicios: ServiciosEditor,
  testimonios: TestimoniosEditor,
  equipo: EquipoEditor,
  cta: CtaEditor,
  contacto: ContactoEditor,
  footer: FooterEditor,
  texto: TextoEditor,
  galeria: GaleriaEditor,
  video: VideoEditor,
  separador: SeparadorEditor,
  pricing: PricingEditor,
  faq: FaqEditor,
  countdown: CountdownEditor,
  stats: StatsEditor,
  timeline: TimelineEditor,
};

/**
 * BlockEditor - Editor principal de bloques para Website Builder
 *
 * @param {Object} props
 * @param {Object} props.pagina - Info de la página actual
 * @param {Array} props.bloques - Array de bloques
 * @param {Object} props.bloqueSeleccionado - Bloque seleccionado
 * @param {Function} props.onSeleccionar - Callback al seleccionar
 * @param {Function} props.onActualizar - Callback al actualizar
 * @param {Function} props.onEliminar - Callback al eliminar
 * @param {Function} props.onDuplicar - Callback al duplicar
 * @param {Function} props.onReordenar - Callback al reordenar
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Object} props.tema - Tema del sitio
 * @param {string} props.industria - Industria del sitio
 */
function BlockEditor({
  pagina,
  bloques,
  bloqueSeleccionado,
  onSeleccionar,
  onActualizar,
  onEliminar,
  onDuplicar,
  onReordenar,
  isLoading,
  tema,
  industria = 'default',
}) {
  // Si no hay página seleccionada
  if (!pagina) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layout className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Selecciona una página
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Elige una página del panel de páginas para empezar a editarla
          </p>
        </div>
      </div>
    );
  }

  // Header con info de la página
  const headerContent = (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">{pagina.titulo}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">/{pagina.slug || ''}</p>
    </div>
  );

  return (
    <BlockListEditor
      bloques={bloques}
      bloqueSeleccionado={bloqueSeleccionado}
      bloquesConfig={BLOQUES_CONFIG}
      editoresBloque={EDITORES_BLOQUE}
      onSeleccionar={onSeleccionar}
      onActualizar={onActualizar}
      onEliminar={onEliminar}
      onDuplicar={onDuplicar}
      onReordenar={onReordenar}
      isLoading={isLoading}
      tema={tema}
      emptyTitle="Página vacía"
      emptyMessage="Agrega bloques desde la paleta de la izquierda para construir tu página"
      editorExtraProps={{ industria }}
      headerContent={headerContent}
    />
  );
}

export default memo(BlockEditor);
