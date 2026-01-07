# Análisis Comparativo: Módulo Agendamiento Nexo vs Competencia

**Fecha**: 7 de Enero 2026
**Versión**: 2.4
**Última actualización**: Round-Robin completado

---

## Resumen Ejecutivo

Análisis del módulo de agendamiento de Nexo vs **Odoo 19 Appointments**, **Calendly**, **Acuity Scheduling**, **Cal.com**.

**Estado actual**: 9/10 (subió de 8.5 tras implementar Round-Robin)

---

## 1. Matriz Comparativa

### Leyenda
- ✅ Implementado | ⚠️ Parcial | ❌ No disponible

### 1.1 Agendamiento y Disponibilidad

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| Reserva de citas online | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-servicio por cita | ✅ | ❌ | ❌ | ✅ | ❌ |
| Walk-in (sin cita previa) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Horarios por profesional | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buffer time (prep/limpieza) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bloqueos (vacaciones, etc.) | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Citas recurrentes | ✅ | ❌ | ⚠️ | ✅ | ✅ |
| Reservas grupales | ❌ | ✅ | ✅ | ✅ | ✅ |
| Lista de espera (waitlist) | ❌ | ❌ | ❌ | ✅ | ❌ |

### 1.2 Asignación y Automatización

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| Selección manual | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto-asignación básica | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Round-Robin** | ✅ | ✅ | ✅ | ❌ | ✅ |
| Por habilidades/servicios | ✅ | ✅ | ❌ | ✅ | ⚠️ |

### 1.3 Notificaciones

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| Recordatorios SMS | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |
| Recordatorios WhatsApp | ✅ | ⚠️ | ❌ | ⚠️ | ❌ |
| Chatbots IA | ✅ | ❌ | ❌ | ❌ | ❌ |
| Email (vía n8n) | ⚠️ | ✅ | ✅ | ✅ | ✅ |

### 1.4 Integraciones

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| Sync Google/Outlook | ❌ | ✅ | ✅ | ✅ | ✅ |
| Widget embebible | ❌ | ✅ | ✅ | ✅ | ✅ |
| Pago anticipado | ❌ | ✅ | ✅ | ✅ | ✅ |

### 1.5 Gestión HR

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| Días festivos LATAM | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Módulo Vacaciones | ✅ | ✅ | ❌ | ❌ | ❌ |
| Portal Mi Perfil | ✅ | ✅ | N/A | N/A | N/A |

---

## 2. Fortalezas Exclusivas de Nexo

| Feature | Ventaja Competitiva |
|---------|---------------------|
| Multi-servicio por cita | Salones/spas (corte + tintura + peinado) |
| Walk-in nativo | Cola de espera para negocios con alto tráfico |
| Chatbots IA | Agendamiento por Telegram/WhatsApp con LLM |
| Catálogo feriados LATAM | MX, CO, AR, CL, PE pre-configurados |
| Round-Robin con orden personalizable | Drag & drop por servicio |
| Citas Recurrentes con Preview | Visualización de disponibilidad antes de crear serie |

---

## 3. Gaps Pendientes

### Alta Prioridad
| Gap | Impacto | Esfuerzo |
|-----|---------|----------|
| Sync Google/Outlook | Evita doble-reserva | 8-12 días |
| Pagos Anticipados (Stripe) | Reduce no-shows | 5-7 días |

### Media Prioridad
| Gap | Impacto | Esfuerzo |
|-----|---------|----------|
| Lista de Espera | Optimización agenda | 4-6 días |
| Reservas Grupales | Clases/talleres | 6-8 días |
| Widget Embebible | Captación clientes | 4-5 días |

---

## 4. Implementaciones Completadas (Fase 0 - Enero 2026)

| Feature | Estado | Componentes Clave |
|---------|:------:|-------------------|
| Buffer Time | ✅ | Query + Command sincronizados |
| Días Festivos LATAM | ✅ | Catálogo MX, CO, AR, CL, PE |
| Tab Ausencias | ✅ | Integrado en Profesionales |
| Mi Perfil (Autoservicio) | ✅ | Portal empleados |
| Citas Recurrentes | ✅ | Preview + Series + Validación inteligente |
| **Round-Robin** | ✅ | Auto-asignación con orden personalizable |

### Round-Robin (7 Ene 2026)

| Componente | Descripción |
|------------|-------------|
| **SQL** | `orden_rotacion` en `servicios_profesionales` + índice |
| **Backend Service** | `RoundRobinService` - algoritmo con verificación disponibilidad |
| **Backend Config** | `ConfiguracionAgendamientoController` - toggle + API orden |
| **Frontend Toggle** | Configuración > Módulos > Agendamiento > Configuración avanzada |
| **Frontend Orden** | Servicios > Gestionar profesionales > Drag & drop |

**Flujo:**
1. Si `profesional_id` no proporcionado → usar RoundRobinService
2. Obtener profesionales ordenados por `orden_rotacion`
3. Obtener último asignado de tabla `citas`
4. Iterar verificando disponibilidad hasta encontrar uno libre

**Archivos:**
- `sql/agendamiento/06-round-robin.sql`
- `backend/app/modules/agendamiento/services/round-robin.service.js`
- `backend/app/modules/agendamiento/controllers/configuracion.controller.js`
- `frontend/src/pages/servicios/components/ProfesionalesServicioModal.jsx`

---

## 5. Roadmap Q1 2026

| Semana | Feature | Prioridad | Estado |
|--------|---------|-----------|--------|
| 1 | Citas Recurrentes | Alta | ✅ |
| 1 | Round-Robin | Media | ✅ |
| **2** | **Testing E2E Integral** | **Alta** | **Siguiente** |
| 3-4 | Pagos Anticipados (Stripe) | Alta | Pendiente |
| 5-6 | Lista de Espera | Alta | Pendiente |
| 7-8 | Sync Google/Outlook | Alta | Pendiente |

---

## 6. Siguiente Paso: Testing E2E Integral

### Objetivo
Validar el flujo completo de Profesionales + Agendamiento desde el frontend, empezando desde cero (BD limpia).

### Plan de Testing

#### Fase 1: Setup Inicial (desde Frontend)
| Paso | Acción | Validación |
|------|--------|------------|
| 1 | Crear organización via registro | Organización creada |
| 2 | Login como admin | Acceso al dashboard |
| 3 | Crear 3 profesionales | Lista muestra 3 profesionales |
| 4 | Crear 2 servicios | Lista muestra 2 servicios |
| 5 | Asignar profesionales a servicios | "2 profesionales" visible |

#### Fase 2: Configuración Agendamiento
| Paso | Acción | Validación |
|------|--------|------------|
| 6 | Crear horarios para cada profesional | Horarios visibles en calendario |
| 7 | Activar Round-Robin | Toggle en "activado" |
| 8 | Configurar orden profesionales (drag & drop) | Orden guardado en BD |

#### Fase 3: Flujo de Citas
| Paso | Acción | Validación |
|------|--------|------------|
| 9 | Crear cliente | Cliente en lista |
| 10 | Crear cita SIN seleccionar profesional | Round-Robin asigna automáticamente |
| 11 | Verificar asignación correcta | Profesional #1 del orden asignado |
| 12 | Crear segunda cita | Profesional #2 asignado (rotación) |
| 13 | Crear cita recurrente (4 semanas) | 4 citas creadas en serie |
| 14 | Verificar preview recurrencia | Muestra fechas disponibles |

#### Fase 4: Bloqueos y Disponibilidad
| Paso | Acción | Validación |
|------|--------|------------|
| 15 | Crear bloqueo para profesional | Bloqueo visible en calendario |
| 16 | Intentar crear cita en horario bloqueado | Error: "No disponible" |
| 17 | Crear cita cuando solo 1 profesional disponible | Asigna al disponible |

### Comando para Ejecutar
```bash
# 1. Limpiar BD y levantar stack desde cero
npm run clean:data

# 2. Abrir navegador en http://localhost:8080/registro

# 3. Seguir flujo de testing manual desde frontend
```

### Criterios de Éxito
- [ ] Todos los pasos completados sin errores 500
- [ ] Round-Robin asigna correctamente en rotación
- [ ] Citas recurrentes crean serie completa
- [ ] Bloqueos respetados en disponibilidad
- [ ] UI muestra feedback correcto en cada acción

---

## 7. Métricas de Código

### Backend Agendamiento
| Componente | Cantidad |
|------------|----------|
| Controllers | 11 |
| Models | 9 |
| Services | 2 |
| Routes | 6 |

### Frontend Agendamiento
| Componente | Cantidad |
|------------|----------|
| Páginas | 9 |
| Componentes | 18+ |
| Hooks | 7 |

---

## 8. Conclusiones

**Score: 9/10** - Nexo ahora compite directamente con Calendly/Cal.com en features core.

**Ventajas únicas:**
- Round-Robin con orden personalizable por servicio (drag & drop)
- Preview de disponibilidad en citas recurrentes
- Multi-servicio + Walk-in (único en el mercado)
- Chatbots IA para agendamiento

**Próximo foco:** Testing E2E integral para validar flujo completo antes de continuar con pagos anticipados.

---

**Documento actualizado**: 7 de Enero 2026
**Próxima revisión**: Post Testing E2E
