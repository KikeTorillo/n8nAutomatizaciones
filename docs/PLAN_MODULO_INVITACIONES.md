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
| Recordatorios automáticos (emails) | ⏸️ Baja prioridad |

---

## Pendiente: Recordatorios Automáticos (Baja Prioridad)

Enviar emails automáticos a invitados con `estado_rsvp = 'pendiente'` X días antes del evento.

**Requiere**: Configuración SMTP, plantillas de email.

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
  "permitir_galeria_invitados": true,  // Habilita subida de fotos
  "mostrar_libro_firmas": true,
  "mostrar_rsvp": true
}
```
