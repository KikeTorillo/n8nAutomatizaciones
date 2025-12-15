# Módulo de Eventos Digitales (Invitaciones)

**Actualizado**: 14 Diciembre 2025
**Estado**: En producción

---

## Resumen de Funcionalidades

| Funcionalidad | Estado |
|---------------|--------|
| CRUD eventos, invitados, ubicaciones, mesa de regalos, felicitaciones | ✅ |
| Plantillas con temas dinámicos (13 predefinidas) | ✅ |
| Página pública con tema, contador, galería, RSVP | ✅ |
| Importar/Exportar CSV invitados | ✅ |
| Sistema QR + Check-in con escáner | ✅ |
| Agregar a calendario (.ics + Google) | ✅ |
| Seating Chart (asignación invitados a mesas) | ✅ |
| Galería compartida (invitados suben fotos) | ✅ |
| Seating Chart - UX mobile mejorada | ✅ |
| **Plantillas Temáticas Avanzadas** | 🔄 Próxima mejora |

---

## Próxima Mejora: Plantillas Temáticas Avanzadas

### Problema Actual

Las 13 plantillas existentes son **muy genéricas**: solo cambian colores y fuentes. No hay diferenciación visual real entre una invitación de superhéroes vs una de princesas vs una de K-pop.

**Estructura actual de `tema` JSONB:**
```javascript
{
  "color_primario": "#ff69b4",
  "color_secundario": "#ffd700",
  "color_fondo": "#fff0f5",
  "color_texto": "#4a4a4a",
  "color_texto_claro": "#888888",
  "fuente_titulo": "Pinyon Script",
  "fuente_cuerpo": "Poppins"
}
```

**Campos sin usar:** `estructura_html` y `estilos_css` (vacíos en todas las plantillas)

---

### Propuesta: Sistema de Plantillas Temáticas

#### 1. Nueva Estructura de Datos

**Ampliar el JSONB `tema` con:**

```javascript
{
  // === COLORES (existente) ===
  "color_primario": "#ff6b6b",
  "color_secundario": "#ffd93d",
  "color_fondo": "#ffffff",
  "color_texto": "#333333",
  "color_texto_claro": "#666666",

  // === FUENTES (existente) ===
  "fuente_titulo": "Fredoka One",
  "fuente_cuerpo": "Nunito",

  // === NUEVO: Elementos Visuales ===
  "patron_fondo": "confetti",           // none, confetti, stars, hearts, dots, stripes
  "patron_opacidad": 0.1,
  "decoracion_esquinas": "globos",      // none, globos, estrellas, flores, corazones
  "icono_principal": "cake",            // cake, crown, star, heart, mask, etc.

  // === NUEVO: Efectos ===
  "animacion_entrada": "bounce",        // fade, bounce, slide, zoom
  "efecto_titulo": "sparkle",           // none, sparkle, glow, shadow

  // === NUEVO: Layout ===
  "layout": "centered",                 // centered, split, asymmetric
  "hero_style": "fullscreen",           // fullscreen, card, minimal

  // === NUEVO: Assets Temáticos ===
  "stickers": ["🦸", "💥", "⚡"],       // Emojis/stickers decorativos
  "marco_fotos": "comic",               // none, polaroid, comic, vintage, neon
}
```

#### 2. Nueva Columna: Categoría Temática

**Agregar a tabla `plantillas_evento`:**

```sql
ALTER TABLE plantillas_evento
ADD COLUMN categoria VARCHAR(50),
ADD COLUMN subcategoria VARCHAR(50),
ADD COLUMN tags JSONB DEFAULT '[]';

-- Ejemplo de categorías:
-- categoria: 'infantil', 'elegante', 'moderno', 'rustico', 'tematico'
-- subcategoria: 'superheroes', 'princesas', 'kpop', 'unicornios', 'dinosaurios'
```

#### 3. Plantillas Temáticas Propuestas

##### Fiestas Infantiles (cumpleanos)

| Código | Nombre | Subcategoría | Colores | Elementos |
|--------|--------|--------------|---------|-----------|
| `cumple-superheroes` | Superhéroes | superheroes | Rojo/Azul/Amarillo | Comics, rayos, máscaras |
| `cumple-princesas-disney` | Princesas | princesas | Rosa/Dorado/Lavanda | Coronas, castillos, estrellas |
| `cumple-frozen` | Frozen | princesas | Azul hielo/Blanco/Plata | Copos nieve, cristales |
| `cumple-unicornios` | Unicornios Mágicos | fantasia | Pastel rainbow | Arcoíris, estrellas, nubes |
| `cumple-dinosaurios` | Dinosaurios | aventura | Verde/Naranja/Café | Huellas, hojas, volcán |
| `cumple-minecraft` | Minecraft | videojuegos | Verde/Café/Gris | Pixeles, bloques |
| `cumple-kpop` | K-Pop Star | kpop | Rosa neón/Negro/Morado | Luces, micrófonos, estrellas |
| `cumple-futbol` | Fútbol Champion | deportes | Verde/Blanco/Negro | Balones, cancha, trofeo |
| `cumple-space` | Aventura Espacial | ciencia | Azul oscuro/Morado/Plata | Planetas, cohetes, estrellas |
| `cumple-sirenas` | Sirenas | fantasia | Turquesa/Coral/Dorado | Conchas, burbujas, escamas |
| `cumple-safari` | Safari Adventure | aventura | Beige/Verde/Naranja | Animales, hojas, huellas |
| `cumple-circo` | Circo Mágico | clasico | Rojo/Amarillo/Blanco | Carpas, estrellas, animales |

##### XV Años Temáticos

| Código | Nombre | Subcategoría | Estilo |
|--------|--------|--------------|--------|
| `xv-paris` | Noche en París | romantico | Torre Eiffel, luces, elegante |
| `xv-mascarada` | Mascarada | misterioso | Máscaras, plumas, dorado |
| `xv-jardin-secreto` | Jardín Secreto | natural | Flores, mariposas, verde |
| `xv-hollywood` | Hollywood Glam | glamour | Estrellas, alfombra roja |

---

### Implementación Técnica

#### Fase 1: Infraestructura (Backend)

1. **Migración SQL**: Agregar columnas `categoria`, `subcategoria`, `tags`
2. **Ampliar validación** de `tema` JSONB para nuevos campos
3. **Endpoint de búsqueda**: Filtrar plantillas por categoría/subcategoría
4. **Assets storage**: Carpeta en MinIO para patrones/decoraciones SVG

#### Fase 2: Assets Visuales

1. **Crear SVGs de patrones**: confetti, stars, hearts, dots, etc.
2. **Crear SVGs de decoraciones**: globos, estrellas, flores por esquina
3. **Definir marcos de fotos**: polaroid, comic, vintage, neon (CSS)
4. **Animaciones CSS**: bounce, slide, sparkle, glow

#### Fase 3: Frontend - Aplicación de Temas

1. **Componente `PatronFondo`**: Renderiza SVG pattern como background
2. **Componente `DecoracionesEsquina`**: Posiciona elementos decorativos
3. **Componente `TituloTematico`**: Aplica efectos al título
4. **Refactor `EventoPublicoPage`**: Integrar nuevos componentes según tema

#### Fase 4: UI de Selección

1. **Galería de plantillas mejorada**: Preview visual real con hover
2. **Filtros por categoría**: "Infantil > Superhéroes"
3. **Búsqueda por tags**: "rosa", "elegante", "divertido"
4. **Preview en tiempo real**: Ver cómo queda antes de guardar

---

### Ejemplo Visual: Invitación Superhéroes

```
┌─────────────────────────────────────────┐
│  ⚡ (decoración esquina)         💥     │
│                                         │
│     ████████  ★ BOOM! ★  ████████      │  ← Patrón comic rays
│                                         │
│         🦸 SUPER FIESTA 🦸              │  ← Título con efecto glow
│                                         │
│        ¡DIEGO cumple 6 años!            │
│                                         │
│     ┌─────────────────────────┐        │
│     │   [FOTO CON MARCO       │        │  ← Marco estilo comic
│     │    COMIC/HALFTONE]      │        │
│     └─────────────────────────┘        │
│                                         │
│   📅 Sábado 20 de Enero                 │
│   📍 Salón de Fiestas Heroes           │
│                                         │
│  ⚡                               💥    │
└─────────────────────────────────────────┘
```

---

## Arquitectura Actual

### Tablas (8)
- `eventos_digitales` - Evento principal
- `invitados_evento` - Lista de invitados con RSVP y check-in
- `ubicaciones_evento` - Lugares del evento
- `mesa_regalos_evento` - Regalos sugeridos
- `felicitaciones_evento` - Mensajes de invitados
- `plantillas_evento` - Temas visuales (super_admin)
- `mesas_evento` - Mesas físicas para seating chart
- `fotos_evento` - Galería compartida

### Endpoints Principales

```
# Admin (autenticado)
/eventos-digitales/eventos                     CRUD eventos
/eventos-digitales/eventos/:id/invitados       CRUD invitados
/eventos-digitales/eventos/:id/mesas           CRUD mesas (seating)
/eventos-digitales/eventos/:id/galeria         CRUD fotos (moderación)
/eventos-digitales/eventos/:id/qr-masivo       ZIP con QRs
/eventos-digitales/eventos/:id/checkin         Registrar check-in

# Público (sin auth)
/public/evento/:slug                           Datos del evento
/public/evento/:slug/galeria                   Galería pública
/public/evento/:slug/calendario                Descargar .ics
/public/evento/:slug/:token                    Invitación personalizada
/public/evento/:slug/:token/rsvp               Confirmar asistencia
/public/evento/:slug/:token/galeria            Subir foto (invitado)
/public/evento/:slug/:token/qr                 QR del invitado
/public/galeria/:id/reportar                   Reportar foto inapropiada
```

### Configuración del Evento (JSONB)
```javascript
{
  "permitir_galeria_invitados": true,
  "mostrar_libro_firmas": true,
  "mostrar_rsvp": true,
  "habilitar_seating_chart": true,
  "mostrar_qr_invitado": true
}
```

---

## Prioridades de Implementación

| Prioridad | Tarea | Esfuerzo |
|-----------|-------|----------|
| 1 | Migración SQL (categoria, subcategoria, tags) | Bajo |
| 2 | Crear 5 plantillas infantiles temáticas (superhéroes, princesas, unicornios, dinosaurios, K-pop) | Medio |
| 3 | Componentes frontend para patrones y decoraciones | Medio |
| 4 | UI de selección de plantillas con filtros | Medio |
| 5 | Agregar más plantillas según demanda | Continuo |

---

**Última actualización**: 14 Diciembre 2025
