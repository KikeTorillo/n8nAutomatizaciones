# Roadmap ERP para PYMES México

**Versión**: 15.0
**Última actualización**: 28 Noviembre 2025

---

## Estado Actual del Proyecto

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Core** (Auth, Orgs, Planes, Clientes) | 100% | Multi-tenant RLS, JWT, RBAC, CRM |
| **Registro Simplificado** | 100% | 7 campos + email activación + auto-login |
| **Super Admin Model** | 100% | Org propia + panel `/superadmin/*` |
| **App Home / Launcher** | 100% | Grid 12 apps, badges, accesos rápidos |
| **Profesionales-Usuario** | 100% | Invitaciones, modulos_acceso, empleados |
| **Agendamiento** | 100% | Particionado, múltiples servicios por cita |
| **Recordatorios** | 100% | pg_cron + HTTP, Telegram/WhatsApp |
| **Comisiones** | 100% | Trigger automático, dashboard, reportes |
| **Marketplace** | 95% | Directorio público, agendamiento sin auth |
| **Inventario** | 100% | CRUD, ABC, alertas, órdenes compra |
| **POS** | 100% | Ventas, Ticket PDF, ClienteSelector, corte caja |
| **Chatbots** | 100% | MCP Server (7 tools), Telegram + WhatsApp |
| **Contabilidad/CFDI** | 0% | Fase futura |

---

## Ventajas Competitivas vs Odoo

| Aspecto | Este Proyecto | Odoo |
|---------|---------------|------|
| **Precio** | ~$12 USD/usuario | $25 USD/usuario |
| **CFDI** | Nativo (próximo) | Plugin terceros |
| **IA WhatsApp** | Nativo | No existe |
| **Implementación** | Autoservicio | $5,000-$50,000 USD |
| **UX** | React moderna | Compleja |

---

## Fases Completadas

### POS (100%)
- Ticket PDF térmico (58mm/80mm)
- Vendedor auto-asignado desde profesional vinculado
- Corte de caja y reportes

### Registro Simplificado (100%)
- **Ruta**: `/registro` → `RegistroPage.jsx`
- **Flujo**: 7 campos → email activación → crear contraseña → auto-login
- **Endpoints**: `POST /auth/registrar`, `GET/POST /auth/activar/:token`

---

## Roadmap - PENDIENTES

### Fase 3: Vista 360° del Cliente (CRM)

| Tab | Contenido | Endpoint |
|-----|-----------|----------|
| Resumen | Datos + stats | GET `/clientes/:id/estadisticas` |
| Citas | Historial | GET `/citas?cliente_id=X` |
| Compras | Historial POS | GET `/pos/ventas?cliente_id=X` |

**Esfuerzo**: 6-10 horas

---

### Fase 4: Mejoras Marketplace

| Mejora | Prioridad | Esfuerzo |
|--------|-----------|----------|
| SEO Técnico (sitemap, robots, Schema.org) | Alta | 3 días |
| Horarios visuales en perfil | Alta | 2 días |
| Galería mejorada (lightbox, drag) | Alta | 3 días |
| Filtro por servicios | Media | 2 días |
| Widget embebible iframe | Media | 3 días |

**Esfuerzo total**: 20-30 horas

---

### Fase 5: Contabilidad + CFDI (Futuro)

**Complejidad**: Alta - 160-264 horas

1. Catálogos SAT + UI datos fiscales (40h)
2. Generación XML sin timbrado - sandbox (60h)
3. Integración PAC sandbox (40h)
4. Producción + certificación (60h)

---

## Referencia Técnica

### MCP Tools (7)

| Tool | Descripción |
|------|-------------|
| `listarServicios` | Catálogo con precios |
| `verificarDisponibilidad` | Slots libres + excluir_cita_id |
| `buscarCliente` | Por teléfono o nombre |
| `buscarCitasCliente` | Historial del cliente |
| `crearCita` | Múltiples servicios |
| `reagendarCita` | Con validación disponibilidad |
| `modificarServiciosCita` | Cambiar servicios |

---

## Resumen Esfuerzo Pendiente

| Fase | Módulo | Esfuerzo | Prioridad |
|------|--------|----------|-----------|
| 3 | Vista 360° CRM | 6-10h | **Alta** |
| 4 | Mejoras Marketplace | 20-30h | Media |
| 5 | CFDI + Contabilidad | 160-264h | Futura |

**Total corto plazo**: ~30-40 horas

---

## Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 15.0 | 28 Nov 2025 | Limpieza ROADMAP: eliminada documentación redundante, renombrado OnboardingFlow → RegistroPage |
| 14.0 | 28 Nov 2025 | Fase 2 refactorizada: flujo unificado, eliminados duplicados |
| 13.0 | 28 Nov 2025 | Fase 2 completada: Backend + Frontend registro simplificado |
| 10.0 | 28 Nov 2025 | POS 100%: Ticket PDF, vendedor auto-asignado |
| 9.0 | 28 Nov 2025 | Super Admin Model completado |
| 8.0 | 28 Nov 2025 | Clientes como Módulo Core |
| 6.0 | 28 Nov 2025 | Profesional-Usuario 100% |
