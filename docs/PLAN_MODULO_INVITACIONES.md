# Módulo de Eventos Digitales (Invitaciones)

**Actualizado**: 13 Diciembre 2025
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
| Seating Chart - UX mobile mejorada | 🔄 Pendiente |
| Galería compartida (invitados suben fotos) | 🔄 Pendiente |
| Recordatorios automáticos (emails) | ⏸️ Baja prioridad |

---

## Pendiente: Seating Chart - UX Mobile Mejorada

### Estado Actual

Actualmente el Seating Chart usa `@dnd-kit` con:
- `PointerSensor` para desktop (drag inmediato)
- `TouchSensor` con delay de 200ms para mobile
- `touch-action: none` en elementos draggables

**Limitaciones en mobile:**
- El delay de 200ms puede sentirse lento
- Las mesas son pequeñas y difíciles de tocar con precisión
- No hay feedback visual de "mantener presionado"

### Propuesta: Controles Híbridos (Opción C)

Implementar un sistema híbrido que detecte el dispositivo y ofrezca la mejor UX:

```
┌─────────────────────────────────────────────────────────────┐
│  DESKTOP                         MOBILE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • Drag-drop directo             • Tap en mesa → Selecciona  │
│  • Hover muestra opciones        • Panel inferior aparece:   │
│                                    ┌──────────────────────┐  │
│                                    │  ← ↑ ↓ →  [Mover]   │  │
│                                    │  Mesa: Mesa Novios    │  │
│                                    │  Posición: 25%, 40%   │  │
│                                    └──────────────────────┘  │
│                                                              │
│                                  • Alternativa: Tap destino  │
│                                    en canvas = "Mover aquí"  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Componentes a Crear

#### 1. `MobilePositionPanel.jsx`
Panel inferior que aparece al seleccionar una mesa en mobile:
```jsx
// Props
{
  mesa: { id, nombre, posicion_x, posicion_y },
  onMove: (direction) => void, // 'up' | 'down' | 'left' | 'right'
  onPositionChange: (x, y) => void,
  onClose: () => void
}
```

Contenido:
- Nombre de la mesa seleccionada
- Botones de dirección (flechas) que mueven 5% por click
- Inputs numéricos para posición exacta (X%, Y%)
- Botón "Cerrar" o tap fuera para deseleccionar

#### 2. `useIsMobile.js` hook
```javascript
const isMobile = useIsMobile(); // true si viewport < 768px o touch device
```

#### 3. Modificaciones a `SeatingChartEditor.jsx`

```javascript
// Estado
const [selectedMesa, setSelectedMesa] = useState(null);
const isMobile = useIsMobile();

// En mobile: tap selecciona en lugar de iniciar drag
const handleMesaTap = (mesa) => {
  if (isMobile) {
    setSelectedMesa(mesa);
  }
};

// Renderizar panel si hay mesa seleccionada
{isMobile && selectedMesa && (
  <MobilePositionPanel
    mesa={selectedMesa}
    onMove={handleMoveDirection}
    onClose={() => setSelectedMesa(null)}
  />
)}
```

#### 4. Modificaciones a `MesaVisual.jsx`

- Agregar `onClick` prop para selección en mobile
- Mostrar indicador visual cuando está seleccionada (ring/borde)
- Deshabilitar drag en mobile cuando hay mesa seleccionada

### Flujo UX Mobile

1. Usuario toca una mesa
2. Mesa se resalta (borde rosa/primary)
3. Panel aparece desde abajo con controles
4. Usuario puede:
   - Usar flechas para mover gradualmente
   - Ingresar posición exacta
   - Tocar otra mesa para cambiar selección
   - Tocar fuera o "X" para cerrar

### Estimación

| Tarea | Complejidad |
|-------|-------------|
| Hook `useIsMobile` | Baja |
| Componente `MobilePositionPanel` | Media |
| Integrar en `SeatingChartEditor` | Media |
| Modificar `MesaVisual` para selección | Baja |
| Testing y ajustes UX | Media |

---

## Pendiente: Galería Compartida de Fotos

### Objetivo

Permitir que los invitados suban fotos durante el evento, creando una galería colaborativa en tiempo real.

### Flujo

```
┌─────────────────────────────────────────────────────────────┐
│  INVITADO (móvil)              ORGANIZADOR (admin)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Entra a su invitación      1. Habilita galería en      │
│     (link o QR)                   configuración evento      │
│                                                             │
│  2. Click "Subir foto"         2. Ve fotos en tiempo real  │
│     → Selecciona imagen           en tab "Galería"          │
│     → Agrega caption opcional                               │
│                                                             │
│  3. Foto aparece en galería    3. Puede moderar:           │
│     del evento (live)             • Aprobar/Ocultar         │
│                                   • Descargar todas (ZIP)   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cambios Requeridos

#### Base de Datos
```sql
CREATE TABLE fotos_evento (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos_digitales(id),
    invitado_id INTEGER REFERENCES invitados_evento(id),
    organizacion_id UUID NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption VARCHAR(200),
    estado VARCHAR(20) DEFAULT 'visible', -- visible, oculta, destacada
    creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### Backend
- `POST /eventos/:id/galeria` - Subir foto (invitado autenticado por token)
- `GET /eventos/:id/galeria` - Listar fotos (admin)
- `PUT /galeria/:id` - Moderar foto (admin)
- `GET /eventos/:id/galeria/descargar` - ZIP con todas las fotos
- `GET /public/evento/:slug/galeria` - Galería pública
- `POST /public/evento/:slug/:token/galeria` - Subir foto (invitado)

#### Frontend Admin
- Nueva tab "Galería" en detalle del evento
- Grid de fotos con opciones de moderación
- Botón descargar todas (ZIP)
- Toggle en configuración: "Permitir subir fotos"

#### Frontend Público
- Sección "Galería del evento" con fotos de todos
- Botón "Subir mi foto" (solo invitados confirmados)
- Lightbox para ver fotos en grande

### Configuración del Evento
```javascript
// En evento.configuracion (JSONB)
{
  "permitir_galeria_invitados": true,  // ← NUEVO
  "moderar_fotos": false               // Si true, fotos requieren aprobación
}
```

---

## Pendiente: Recordatorios Automáticos (Baja Prioridad)

Enviar emails automáticos a invitados con `estado_rsvp = 'pendiente'` X días antes del evento.

**Requiere**: Configuración SMTP, plantillas de email.

---

## Arquitectura Actual

### Tablas (8)
- `eventos_digitales` - Evento principal
- `invitados_evento` - Lista de invitados con RSVP y check-in
- `ubicaciones_evento` - Lugares del evento (ceremonia, recepción)
- `mesa_regalos_evento` - Regalos sugeridos
- `felicitaciones_evento` - Mensajes de invitados
- `plantillas_evento` - Temas visuales (super_admin)
- `mesas_evento` - Mesas físicas para seating chart
- `fotos_evento` - Galería compartida (PENDIENTE)

### Endpoints Principales

```
# Admin
/eventos-digitales/eventos              CRUD eventos
/eventos-digitales/eventos/:id/invitados    CRUD invitados
/eventos-digitales/eventos/:id/mesas        CRUD mesas (seating)
/eventos-digitales/eventos/:id/qr-masivo    ZIP con QRs
/eventos-digitales/eventos/:id/checkin      Registrar check-in

# Público (sin auth)
/public/evento/:slug                    Datos del evento
/public/evento/:slug/:token             Invitación personalizada
/public/evento/:slug/:token/rsvp        Confirmar asistencia
/public/evento/:slug/:token/qr          QR del invitado
/public/evento/:slug/calendario         Descargar .ics
```
