/**
 * ====================================================================
 * SEO RULES
 * ====================================================================
 * Definicion de reglas SEO y sus validaciones.
 */

// Reglas SEO con pesos para el score
export const SEO_RULES = [
  {
    id: 'titulo_longitud',
    nombre: 'Longitud del titulo',
    descripcion: 'El titulo debe tener entre 30 y 60 caracteres',
    peso: 20,
    categoria: 'contenido',
    validar: (datos) => {
      const titulo = datos.config?.nombre_sitio || datos.bloques?.[0]?.contenido?.titulo || '';
      const longitud = titulo.length;
      if (longitud >= 30 && longitud <= 60) {
        return { valido: true, mensaje: `Titulo optimo (${longitud} caracteres)` };
      }
      if (longitud < 30) {
        return { valido: false, mensaje: `Titulo muy corto (${longitud}/30 min)` };
      }
      return { valido: false, mensaje: `Titulo muy largo (${longitud}/60 max)` };
    },
  },
  {
    id: 'tiene_cta',
    nombre: 'Llamada a la accion',
    descripcion: 'Debe haber al menos un boton de llamada a la accion',
    peso: 15,
    categoria: 'conversion',
    validar: (datos) => {
      const bloques = datos.bloques || [];
      const tieneCTA = bloques.some((b) => {
        if (b.tipo === 'cta') return true;
        if (b.contenido?.boton_texto || b.contenido?.boton_url) return true;
        return false;
      });
      if (tieneCTA) {
        return { valido: true, mensaje: 'CTA presente en la pagina' };
      }
      return { valido: false, mensaje: 'Agrega un boton de llamada a la accion' };
    },
  },
  {
    id: 'alt_imagenes',
    nombre: 'Alt en imagenes',
    descripcion: 'Las imagenes deben tener texto alternativo',
    peso: 10,
    categoria: 'accesibilidad',
    validar: (datos) => {
      const bloques = datos.bloques || [];
      let imagenesTotal = 0;
      let imagenesConAlt = 0;

      bloques.forEach((b) => {
        if (b.tipo === 'galeria' && b.contenido?.imagenes) {
          b.contenido.imagenes.forEach((img) => {
            imagenesTotal++;
            if (img.alt) imagenesConAlt++;
          });
        }
        if (b.contenido?.imagen_url) {
          imagenesTotal++;
          if (b.contenido.imagen_alt) imagenesConAlt++;
        }
      });

      if (imagenesTotal === 0) {
        return { valido: true, mensaje: 'Sin imagenes para validar' };
      }

      const porcentaje = Math.round((imagenesConAlt / imagenesTotal) * 100);
      if (porcentaje === 100) {
        return { valido: true, mensaje: `Todas las imagenes tienen alt (${imagenesTotal})` };
      }
      return { valido: false, mensaje: `${imagenesConAlt}/${imagenesTotal} imagenes con alt (${porcentaje}%)` };
    },
  },
  {
    id: 'meta_description',
    nombre: 'Meta descripcion',
    descripcion: 'La meta descripcion debe tener entre 120 y 160 caracteres',
    peso: 15,
    categoria: 'seo',
    validar: (datos) => {
      const descripcion = datos.config?.descripcion_seo || datos.pagina?.descripcion_seo || '';
      const longitud = descripcion.length;

      if (!descripcion) {
        return { valido: false, mensaje: 'Falta meta descripcion' };
      }
      if (longitud >= 120 && longitud <= 160) {
        return { valido: true, mensaje: `Meta descripcion optima (${longitud} chars)` };
      }
      if (longitud < 120) {
        return { valido: false, mensaje: `Meta descripcion corta (${longitud}/120 min)` };
      }
      return { valido: false, mensaje: `Meta descripcion larga (${longitud}/160 max)` };
    },
  },
  {
    id: 'keywords_titulo',
    nombre: 'Keywords en titulo',
    descripcion: 'El titulo debe incluir palabras clave relevantes',
    peso: 10,
    categoria: 'seo',
    validar: (datos) => {
      const titulo = datos.config?.nombre_sitio || '';
      const keywords = datos.config?.keywords_seo || '';

      if (!keywords) {
        return { valido: false, mensaje: 'Define keywords para tu sitio' };
      }

      const keywordsArray = keywords.split(',').map((k) => k.trim().toLowerCase()).slice(0, 3);
      const tituloLower = titulo.toLowerCase();
      const keywordsEnTitulo = keywordsArray.filter((k) => tituloLower.includes(k));

      if (keywordsEnTitulo.length > 0) {
        return { valido: true, mensaje: `Keyword "${keywordsEnTitulo[0]}" en titulo` };
      }
      return { valido: false, mensaje: 'Incluye keywords en el titulo' };
    },
  },
  {
    id: 'heading_hierarchy',
    nombre: 'Jerarquia de encabezados',
    descripcion: 'Los encabezados deben seguir orden H1 -> H2 -> H3',
    peso: 10,
    categoria: 'estructura',
    validar: (datos) => {
      const bloques = datos.bloques || [];

      // El primer bloque (hero) deberia ser como H1
      const tieneHero = bloques.some((b) => b.tipo === 'hero');
      const tieneTitulos = bloques.filter((b) => b.contenido?.titulo || b.contenido?.titulo_seccion).length;

      if (tieneHero && tieneTitulos >= 2) {
        return { valido: true, mensaje: 'Estructura de encabezados correcta' };
      }

      if (!tieneHero) {
        return { valido: false, mensaje: 'Agrega un bloque Hero como titulo principal' };
      }

      return { valido: false, mensaje: 'Agrega mas secciones con titulos' };
    },
  },
  {
    id: 'mobile_friendly',
    nombre: 'Optimizado para movil',
    descripcion: 'El contenido debe ser legible en dispositivos moviles',
    peso: 20,
    categoria: 'usabilidad',
    validar: (datos) => {
      // Verificar que los bloques esten configurados para responsive
      const bloques = datos.bloques || [];

      // Verificar textos muy largos en un solo parrafo
      let tieneProblemas = false;
      let mensaje = '';

      bloques.forEach((b) => {
        if (b.tipo === 'texto' && b.contenido?.contenido) {
          const texto = b.contenido.contenido;
          if (texto.length > 500 && !texto.includes('\n')) {
            tieneProblemas = true;
            mensaje = 'Divide textos largos en parrafos';
          }
        }
      });

      if (tieneProblemas) {
        return { valido: false, mensaje };
      }

      // Verificar cantidad de bloques
      if (bloques.length >= 3) {
        return { valido: true, mensaje: 'Contenido estructurado para movil' };
      }

      return { valido: false, mensaje: 'Agrega mas contenido a la pagina' };
    },
  },
];

// Categorias de reglas
export const SEO_CATEGORIES = [
  { id: 'seo', nombre: 'SEO', icono: 'search' },
  { id: 'contenido', nombre: 'Contenido', icono: 'file-text' },
  { id: 'estructura', nombre: 'Estructura', icono: 'layout' },
  { id: 'conversion', nombre: 'Conversion', icono: 'target' },
  { id: 'accesibilidad', nombre: 'Accesibilidad', icono: 'eye' },
  { id: 'usabilidad', nombre: 'Usabilidad', icono: 'smartphone' },
];

/**
 * Calcular score SEO
 * @param {Object} datos - Datos del sitio/pagina
 * @returns {Object} { score, reglas, sugerencias }
 */
export function calcularScoreSEO(datos) {
  let pesoTotal = 0;
  let pesoObtenido = 0;
  const reglasValidadas = [];
  const sugerencias = [];

  SEO_RULES.forEach((regla) => {
    const resultado = regla.validar(datos);
    pesoTotal += regla.peso;

    if (resultado.valido) {
      pesoObtenido += regla.peso;
    } else {
      sugerencias.push({
        id: regla.id,
        nombre: regla.nombre,
        mensaje: resultado.mensaje,
        peso: regla.peso,
        categoria: regla.categoria,
      });
    }

    reglasValidadas.push({
      ...regla,
      resultado,
    });
  });

  const score = Math.round((pesoObtenido / pesoTotal) * 100);

  return {
    score,
    reglas: reglasValidadas,
    sugerencias: sugerencias.sort((a, b) => b.peso - a.peso), // Ordenar por importancia
    nivel: score >= 80 ? 'excelente' : score >= 60 ? 'bueno' : score >= 40 ? 'mejorable' : 'bajo',
  };
}

export default SEO_RULES;
