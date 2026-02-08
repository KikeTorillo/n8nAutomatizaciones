import type { BaseEntity } from './common';

// ========== Entidad Principal ==========

export interface WebsiteConfig extends BaseEntity {
  slug: string;
  nombre_sitio?: string;
  descripcion_seo?: string;
  publicado: boolean;
  tema?: WebsiteTema;
  version?: number;
}

export interface WebsiteTema {
  colores?: {
    primario?: string;
    secundario?: string;
    fondo?: string;
    texto?: string;
  };
  fuente_titulos?: string;
  fuente_cuerpo?: string;
}

// ========== Páginas ==========

export interface WebsitePagina extends BaseEntity {
  website_id: number;
  slug: string;
  titulo: string;
  descripcion_seo?: string;
  orden: number;
  visible_menu: boolean;
  publicada: boolean;
}

// ========== Bloques ==========

export interface WebsiteBloque extends BaseEntity {
  pagina_id: string;
  tipo: string;
  contenido?: Record<string, unknown>;
  estilos?: Record<string, unknown>;
  orden: number;
  visible: boolean;
}

// ========== Templates ==========

export interface WebsiteTemplate {
  id: string;
  nombre: string;
  descripcion?: string;
  industria?: string;
  preview_url?: string;
  destacado?: boolean;
}

// ========== Versiones ==========

export interface WebsiteVersion {
  id: string;
  nombre?: string;
  descripcion?: string;
  tipo: string;
  created_at: string;
}

// ========== Analytics ==========

export interface AnalyticsResumen {
  visitas: number;
  visitas_unicas: number;
  paginas_vistas: number;
  tiempo_promedio: number;
  tasa_rebote: number;
}

// ========== SEO ==========

export interface AuditoriaSEO {
  score: number;
  items: Array<{
    tipo: string;
    mensaje: string;
    estado: string;
  }>;
}
