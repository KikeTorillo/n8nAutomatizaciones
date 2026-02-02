/**
 * Mapeo de iconos por módulo del sistema
 * Feb 2026 - Centralizado para evitar duplicación
 *
 * Usado en: ModulosPage, ModuloSelector
 */

import {
  Settings,
  Calendar,
  Package,
  ShoppingCart,
  DollarSign,
  Globe,
  Bot,
  PartyPopper,
  BookOpen,
  ClipboardCheck,
  CreditCard,
} from 'lucide-react';

/**
 * Mapeo de iconos por módulo (componentes React)
 * Los iconos se mantienen aquí centralizados para evitar duplicación
 */
export const MODULOS_ICONOS = {
  core: Settings,
  agendamiento: Calendar,
  inventario: Package,
  workflows: ClipboardCheck,
  pos: ShoppingCart,
  comisiones: DollarSign,
  contabilidad: BookOpen,
  marketplace: Globe,
  chatbots: Bot,
  'eventos-digitales': PartyPopper,
  website: Globe,
  'suscripciones-negocio': CreditCard,
};
