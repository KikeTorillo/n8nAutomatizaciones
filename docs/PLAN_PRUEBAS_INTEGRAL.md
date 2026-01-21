# Plan de Pruebas Integral - Nexo ERP

**Versión:** 2.1 (Bug Seguridad RBAC)
**Última actualización:** 21 Enero 2026

---

## Credenciales de Prueba

| Campo | Valor |
|-------|-------|
| **URL** | http://localhost:8080 |
| **Email** | arellanestorillo@gmail.com |
| **Contraseña** | Enrique23 |
| **Rol** | super_admin |

**n8n:** http://localhost:5678 | arellanestorillo@yahoo.com | Enrique23

---

## Resumen de Estado por Módulo

| Módulo | Estado | Bugs Corregidos |
|--------|--------|-----------------|
| Clientes (CRM) | ✅ Completado | 4 |
| Agendamiento/Citas | ✅ Completado | 7 |
| Servicios | ✅ Completado | 3 |
| Profesionales | ✅ Completado | 0 |
| Inventario | ✅ Completado | 0 |
| POS | ✅ Completado | 1 |
| Contabilidad | ✅ Completado | 2 |
| Comisiones | ✅ Completado | 2 |
| Sucursales | ✅ Completado | 0 |
| Ausencias | ✅ Completado | 4 |
| Chatbots IA | ⏳ CRUD OK | 0 |
| Configuración | ✅ Completado | 3 |
| **RBAC (Permisos)** | ⚠️ Bug Crítico | 1 (SEC-001) |

**Total bugs corregidos:** 26

---

## Pruebas Pendientes

### RBAC - Validación Funcional de Permisos

```
[x] Crear usuario de prueba con rol limitado (cajero@test.com / test1234)
[x] Verificar que API rechaza operaciones sin permiso
[!] BUG CRÍTICO: Sistema no restringe - ver SEC-001
```

### Chatbots IA - Conversación End-to-End

```
[ ] Cliente agenda cita por chat Telegram
[ ] Cliente consulta disponibilidad
[ ] Cliente cancela/reagenda cita
```

---

## Bugs de Seguridad (Sin Corregir)

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| **SEC-001** | **CRÍTICA** | **Sistema RBAC inefectivo**: 23 permisos tienen `valor_default = true` en `permisos_catalogo`. Usuarios sin permisos configurados obtienen acceso por defecto a crear ventas, citas, clientes, ver reportes, etc. El sistema debería ser "restrictivo por defecto". | ⚠️ Pendiente |

**Detalle SEC-001:**
- **Ubicación:** Función SQL `obtener_permiso()` + tabla `permisos_catalogo.valor_default`
- **Causa raíz:** Si no hay registro en `permisos_rol` para un rol, se usa `valor_default` del catálogo
- **Impacto:** Cualquier usuario con rol "empleado" puede: crear ventas POS, crear citas, ver/crear clientes, exportar reportes
- **Permisos afectados:** `pos.crear_ventas`, `pos.abrir_caja`, `clientes.crear`, `agendamiento.crear_citas`, y 19 más
- **Fix propuesto:** Cambiar `valor_default` a `false` para todos los permisos en `permisos_catalogo`

---

## Bugs Corregidos (Todos)

### Críticos (Bloqueantes)

| ID | Módulo | Bug | Fix |
|----|--------|-----|-----|
| BUG-001 | Clientes | `etiquetas.map is not a function` | Extracción correcta de estructura |
| BUG-005 | Citas | `limpiarServicios` no memoizado, re-renders infinitos | `useCallback` |
| BUG-009 | Ausencias | Tipos de bloqueo no aparecían en selector | Fix estructura respuesta hook |
| BUG-010 | Citas | Endpoints no-show y cancelar 404 | Creados endpoints backend |
| BUG-012 | Ausencias | Tab Configuración crashea: `nivelesArray.map` | Extracción `niveles?.data` |
| BUG-013 | Servicios | Search crashea: "circular structure to JSON" | `e.target.value` en ListadoCRUDPage |
| BUG-017 | Comisiones | `profesionales?.map is not a function` | Extracción `items` del hook |
| BUG-019 | Contabilidad | Columna `codigo_sat` no existe | Usar `codigo_agrupador` |
| BUG-020 | Contabilidad | Políticas RLS excluían super_admin | Simplificar políticas BD |
| BUG-021 | Ausencias | Historial/calendario mostraban 0 ausencias | Fix triple anidación `data.data.data` |

### Altos (Afectan funcionalidad)

| ID | Módulo | Bug | Fix |
|----|--------|-----|-----|
| BUG-007 | Citas | Fecha incorrecta por timezone UTC | Extraer fecha antes de `parseISO` |
| BUG-008 | Ausencias | `diasDisponibles=0` en solicitud vacaciones | Agregar prop al modal |
| BUG-011 | Citas | Frontend PUT vs Backend POST | Cambiar a `apiClient.post` |
| BUG-018 | Comisiones | Filtro "Origen" no filtraba datos | Agregar campo a schema Joi |
| BUG-024 | Config | Días Festivos: falla importación constraint | Agregar `fecha_fin_recurrencia` |

### Medios (UX/UI)

| ID | Módulo | Bug | Fix |
|----|--------|-----|-----|
| BUG-002 | Clientes | Stats duplicados en vista detalle | Eliminar StatCardGrid del header |
| BUG-003 | Clientes | Nomenclatura inconsistente | Unificar a "Total Gastado" |
| BUG-004 | Clientes | Etiquetas no actualizan sin refresh | Fix invalidación cache |
| BUG-006 | Citas | Duración mostraba "minutos" sin valor | Usar `duracion_total_minutos` |
| BUG-014 | Servicios | NaN en spinbutton al editar | `field.value || 0` |
| BUG-015 | UI | Click en acciones abre drawer detrás | `e.stopPropagation()` |
| BUG-016 | POS | Nombre cliente no aparece en historial | `nombre_cliente` vs `cliente_nombre` |
| BUG-022 | Config | Departamentos: código/descripción no se guardan | Fix función SQL + preparePayload |
| BUG-023 | Config | Monedas: calculadora crashea con string | `parseFloat(tasa.tasa)` |

---

## Gaps Funcionales Identificados

| ID | Módulo | Descripción | Prioridad |
|----|--------|-------------|-----------|
| GAP-001 | Ausencias | Aprobación de vacaciones no filtra por jerarquía de supervisor. `listarPendientes` retorna TODAS las solicitudes sin filtrar por `supervisor_id`. | Media |

---

## Mejoras UX Pendientes

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| UX-003 | Agregar breadcrumbs en todas las páginas | Media |
| UX-004 | Shortcuts de teclado (N=nuevo, E=editar, ESC=cerrar) | Media |
| UX-005 | POS: Modo pantalla completa para tablets | Media |

---

## Flujo de Negocio Principal Validado

```
Cliente → Agenda cita → Confirma → En curso → Completada →
       → POS (servicio + productos) → Comisión profesional →
       → Asiento contable automático
```

**Verificaciones end-to-end:**
- ✅ Venta POS $150 → Comisión 10% = $15.00
- ✅ Cita completada $150 → Comisión 15% = $22.50
- ✅ Dashboard comisiones muestra total correcto
- ✅ Filtros por origen funcionan
- ✅ Asientos contables se generan automáticamente

---

## Comparativa vs Odoo

### Fortalezas de Nexo

| Área | Ventaja |
|------|---------|
| Especialización | Enfoque en servicios de belleza/salud |
| IA Integrada | Chatbots Telegram/WhatsApp nativos |
| Multi-tenancy | RLS PostgreSQL nativo |
| México | Catálogo SAT Anexo 24, RFC, CFDI ready |

### Áreas de Mejora

| Feature | Estado |
|---------|--------|
| Pipeline visual (Kanban) CRM | Pendiente |
| Actividades/Tareas en CRM | Pendiente |
| Portal de clientes | Marketplace parcial |
| Reportes dinámicos | Solo reportes fijos |

---

## Arquitectura de Referencia

### Flujo de Permisos RBAC

```
Request → JWT Middleware → Decodificar token →
        → Verificar rol → Cargar permisos de BD →
        → Verificar permiso específico → Controller
```

### Estados de Cita

```
Pendiente → Confirmada → En Espera → En Proceso → Completada
    ↓           ↓                         ↓
Cancelada   Reagendada                 Cobrada (POS)
    ↓
 No-Show
```

### Modelo de Datos (Simplificado)

```
ORGANIZACION
  └── SUCURSAL
        ├── PROFESIONAL ←→ SERVICIO
        ├── CITA → VENTA → COMISION
        └── CAJA

CLIENTE → CITA → VENTA_DETALLE → PRODUCTO
                      ↓
               ASIENTO_CONTABLE
```

---

## Datos de Prueba Disponibles

| Entidad | Nombre | Detalles |
|---------|--------|----------|
| Cliente | Ana Martínez | 5 citas históricas, etiquetas VIP |
| Profesional | enrique | Comisiones 15% servicio, 10% producto |
| Servicio | Corte de Cabello | $150, 45 min |
| Servicio | Tratamiento Hidratante | $200, 60 min |
| Producto | Shampoo Premium | SKU: SHAMP-001, $150 |
| Combo | Kit Cuidado Capilar | 10% descuento |

---

## Checklist de Validación Pre-Release

```
[x] Login/logout funcional
[x] RLS aísla datos por organización
[x] CRUD completo en todos los módulos
[x] Flujo cita → venta → comisión end-to-end
[x] Filtros y búsquedas funcionan
[x] Exportación CSV funciona
[x] Asientos contables se generan
[x] Chatbot Telegram se activa
[!] RBAC restringe acceso correctamente - SEC-001 PENDIENTE
[ ] Chatbot puede agendar citas
```

---

*Documento consolidado para reducir redundancia. Detalles técnicos de correcciones en CLAUDE.md y commits de git.*
