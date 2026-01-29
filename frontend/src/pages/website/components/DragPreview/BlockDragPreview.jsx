/**
 * ====================================================================
 * BLOCK DRAG PREVIEW
 * ====================================================================
 * Preview visual mejorado que se muestra durante el drag desde la paleta.
 * Incluye mini-versión del bloque y detalles del tipo.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
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
import PreviewRenderer from './PreviewRenderer';

// Iconos por tipo de bloque
const ICONOS_BLOQUES = {
  hero: Layout,
  servicios: Briefcase,
  testimonios: MessageSquareQuote,
  equipo: Users,
  cta: MousePointerClick,
  contacto: Mail,
  footer: PanelBottom,
  texto: Type,
  galeria: Image,
  video: Video,
  separador: Minus,
  pricing: DollarSign,
  faq: HelpCircle,
  countdown: Clock,
  stats: TrendingUp,
  timeline: GitBranch,
};

// Nombres por tipo de bloque
const NOMBRES_BLOQUES = {
  hero: 'Hero',
  servicios: 'Servicios',
  testimonios: 'Testimonios',
  equipo: 'Equipo',
  cta: 'Llamada a Accion',
  contacto: 'Contacto',
  footer: 'Pie de Pagina',
  texto: 'Texto',
  galeria: 'Galeria',
  video: 'Video',
  separador: 'Separador',
  pricing: 'Precios',
  faq: 'Preguntas Frecuentes',
  countdown: 'Cuenta Regresiva',
  stats: 'Estadisticas',
  timeline: 'Linea de Tiempo',
};

// Descripciones breves por tipo
const DESCRIPCIONES_BLOQUES = {
  hero: 'Seccion principal con titulo destacado',
  servicios: 'Muestra tus servicios o productos',
  testimonios: 'Opiniones de clientes satisfechos',
  equipo: 'Presenta a tu equipo de trabajo',
  cta: 'Boton de llamada a la accion',
  contacto: 'Formulario de contacto',
  footer: 'Pie de pagina con info y enlaces',
  texto: 'Bloque de texto libre',
  galeria: 'Galeria de imagenes',
  video: 'Video embedido',
  separador: 'Linea divisoria entre secciones',
  pricing: 'Tabla de precios y planes',
  faq: 'Preguntas frecuentes',
  countdown: 'Contador regresivo',
  stats: 'Estadisticas y numeros',
  timeline: 'Linea de tiempo e historia',
};

/**
 * Preview mejorado del bloque durante el drag
 *
 * @param {Object} props
 * @param {string} props.tipo - Tipo de bloque
 * @param {Object} props.tema - Tema del sitio (colores)
 */
function BlockDragPreview({ tipo, tema }) {
  const Icono = ICONOS_BLOQUES[tipo] || Layout;
  const nombre = NOMBRES_BLOQUES[tipo] || tipo;
  const descripcion = DESCRIPCIONES_BLOQUES[tipo] || 'Bloque personalizado';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
      }}
      className="w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-primary-500 overflow-hidden pointer-events-none"
      style={{
        boxShadow: '0 25px 50px -12px rgba(117, 53, 114, 0.4)',
      }}
    >
      {/* Header con icono y nombre */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/30 border-b border-primary-100 dark:border-primary-800">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
          <Icono className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {nombre}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {descripcion}
          </p>
        </div>
      </div>

      {/* Preview visual del bloque */}
      <div className="p-3">
        <PreviewRenderer tipo={tipo} tema={tema} />
      </div>

      {/* Footer con instruccion */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Suelta para agregar a la pagina
        </p>
      </div>
    </motion.div>
  );
}

export default memo(BlockDragPreview);
