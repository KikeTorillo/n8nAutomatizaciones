# Arquitectura de Sistemas de Aprobacion

**Fecha**: 3 Enero 2026
**Autor**: Arquitectura Nexo
**Estado**: Aprobado
**Revision**: 2.0 (Analisis expandido con vision competitiva vs Odoo)

---

## Contexto

Nexo es una plataforma ERP SaaS Multi-Tenant para LATAM que compite directamente con Odoo.
La vision a largo plazo requiere implementar multiples modulos que necesitaran flujos de aprobacion.

**Pregunta clave**: ¿Usar un motor de workflows generico o sistemas especificos por modulo?

---

## Investigacion: Como lo hace Odoo

### Modulos con Aprobaciones Nativas

| Modulo Odoo | Aprobacion Nativa | Tipo |
|-------------|-------------------|------|
| **Time Off (Vacaciones)** | Si | Sin validacion / RRHH / Supervisor / Ambos |
| **Purchases (Compras)** | Basica | Checkbox por monto |
| **Expenses (Gastos)** | Basica | Manager (doble via addon) |
| **Invoices (Facturas)** | Basica | Por monto |

### Modulos que Requieren Addons (Odoo Apps Store)

Segun [Odoo Apps Store](https://apps.odoo.com/apps/modules/category/Approvals/browse):

| Addon | Funcionalidad |
|-------|---------------|
| `multi_level_approval_configuration` | Aprobacion multi-nivel para varios documentos |
| `xf_approval_route_purchase` | Rutas dinamicas para OC |
| `xf_approval_route_expense` | Rutas dinamicas para gastos |
| `oi_workflow_purchase_requisition` | Workflow para requisiciones |
| `hr_salary_structure_approval` | Aprobacion de estructuras salariales |
| `oi_workflow_hr_payslip_run` | Aprobacion de lotes de nomina |

### Conclusion Odoo

Odoo tiene aprobaciones **basicas nativas** pero la mayoria de empresas usan **addons de terceros**
para flujos mas complejos. Esto indica que:
1. Las aprobaciones basicas por monto son comunes
2. Flujos complejos requieren personalizacion
3. Un motor generico configurable tiene valor

---

## Analisis de Modulos Nexo

### Modulos Actuales (24 directorios)

| # | Modulo | Controllers | Existe en Odoo | Necesita Aprobacion |
|---|--------|-------------|----------------|---------------------|
| 1 | agendamiento | 6 | Calendario | No |
| 2 | catalogos | 4 | Varios | No |
| 3 | clientes | 1 | CRM/Contactos | No |
| 4 | comisiones | 4 | No nativo | No |
| 5 | **contabilidad** | 4 | Facturacion | **Si (futuro)** |
| 6 | core | 12 | Core | No |
| 7 | custom-fields | 2 | Studio | No |
| 8 | eventos-digitales | 9 | Eventos | No |
| 9 | **inventario** | 24 | Inventario | **Si (OC)** |
| 10 | marketplace | 4 | Website Sale | No |
| 11 | notificaciones | 2 | Discuss | No |
| 12 | organizacion | 3 | Empleados | No |
| 13 | permisos | 2 | Access Rights | No |
| 14 | pos | 3 | PdV | No |
| 15 | precios | 1 | Listas Precios | No |
| 16 | profesionales | 7 | Empleados | No |
| 17 | recordatorios | 1 | Calendar | No |
| 18 | storage | 2 | Documents | No |
| 19 | sucursales | 1 | Multi-company | No |
| 20 | **vacaciones** | 1 | Time Off | **Si** |
| 21 | website | 5 | Website | No |
| 22 | workflows | 2 | - | Motor generico |

### Modulos Faltantes para Competir con Odoo

| Modulo | Prioridad | Necesita Aprobacion | Tipo de Aprobacion |
|--------|-----------|---------------------|-------------------|
| **Gastos (Expenses)** | Alta | Si | Manager -> HR |
| **Requisiciones** | Alta | Si | Depto -> Head -> Compras |
| **Nomina (Payroll)** | Alta | Si | RRHH -> Finanzas |
| **Reclutamiento** | Media | Opcional | Multi-step |
| **Contratos** | Media | Opcional | Legal review |
| **Manufacturing** | Baja | No | - |
| **Proyectos** | Baja | Opcional | Budget approval |

### Conteo Total de Modulos con Aprobaciones

| Categoria | Modulos | Cantidad |
|-----------|---------|----------|
| **Implementados** | Vacaciones, OC | 2 |
| **Por implementar (seguro)** | Gastos, Requisiciones, Nomina, Facturas, Pagos | 5 |
| **Por implementar (posible)** | Reclutamiento, Contratos, Proyectos | 3 |
| **Total potencial** | | **9-10 modulos** |

---

## Tipos de Aprobacion Identificados

### Tipo A: Condicional por Monto (Generica)

**Caracteristicas:**
- Condicion: `monto > limite`
- Aprobadores: por rol o jerarquia
- Logica: simple, reutilizable
- Multi-nivel posible

**Modulos aplicables:**
- Ordenes de Compra
- Requisiciones
- Facturas
- Pagos
- Gastos (parcialmente)

### Tipo B: Siempre con Logica de Dominio (Especifica)

**Caracteristicas:**
- Siempre requiere aprobacion
- Logica compleja del dominio
- Calculos especificos
- Integraciones particulares

**Modulos aplicables:**
- Vacaciones (saldo, dias habiles, calendario)
- Nomina (calculos, deducciones, periodos)
- Contratos (documentos, firmas, legal)

---

## Decision Arquitectonica

### Arquitectura Hibrida: WorkflowEngine + Sistemas Propios

Dado que Nexo competira con Odoo y tendra 9-10 modulos con aprobaciones:

| Enfoque | Modulos | Justificacion |
|---------|---------|---------------|
| **WorkflowEngine (Generico)** | OC, Requisiciones, Facturas, Pagos, Gastos | Condiciones similares, aprobadores por rol, reutilizable |
| **Sistema Propio** | Vacaciones, Nomina, Contratos | Logica de dominio muy especifica, no generalizable |

### Justificacion de Mantener WorkflowEngine

1. **5+ modulos lo usaran**: No es YAGNI, realmente se necesitara
2. **Consistencia UX**: Misma interfaz de aprobacion para documentos financieros
3. **Configuracion sin codigo**: Usuarios pueden ajustar limites y aprobadores
4. **Auditoria centralizada**: Un solo lugar para historial de aprobaciones
5. **Escalabilidad**: Agregar nuevos tipos de documento es trivial

### Justificacion de Sistemas Propios

1. **Vacaciones**: Calculo dias habiles, saldo, bloqueos calendario
2. **Nomina**: Calculos complejos, periodos, deducciones legales
3. **Contratos**: Documentos adjuntos, firmas, validacion legal

---

## Arquitectura Final

```
+------------------------------------------------------------------+
|                      NEXO ERP - APROBACIONES                     |
+----------------------------------+-------------------------------+
|        WORKFLOW ENGINE           |       SISTEMAS PROPIOS        |
|     (Generico por monto/rol)     |    (Logica de dominio)        |
+----------------------------------+-------------------------------+
|                                  |                               |
|  +----------------------------+  |  +-------------------------+  |
|  |    MODULOS FINANCIEROS     |  |  |      VACACIONES         |  |
|  +----------------------------+  |  +-------------------------+  |
|  | [x] Ordenes de Compra      |  |  | [x] Solicitudes         |  |
|  | [ ] Requisiciones          |  |  | [x] Saldos              |  |
|  | [ ] Facturas               |  |  | [x] Politicas           |  |
|  | [ ] Pagos                  |  |  | [x] Bloqueos calendario |  |
|  | [ ] Gastos                 |  |  +-------------------------+  |
|  +----------------------------+  |                               |
|              |                   |  +-------------------------+  |
|              v                   |  |       NOMINA            |  |
|  +----------------------------+  |  +-------------------------+  |
|  |   workflow_definiciones    |  |  | [ ] Periodos            |  |
|  |   workflow_pasos           |  |  | [ ] Calculos            |  |
|  |   workflow_instancias      |  |  | [ ] Deducciones         |  |
|  |   workflow_historial       |  |  | [ ] Aprobacion RRHH     |  |
|  +----------------------------+  |  +-------------------------+  |
|              |                   |                               |
|              v                   |  +-------------------------+  |
|  +----------------------------+  |  |      CONTRATOS          |  |
|  |      NOTIFICACIONES        |  |  +-------------------------+  |
|  |   notificacionAdapter      |  |  | [ ] Documentos          |  |
|  +----------------------------+  |  | [ ] Firmas              |  |
|                                  |  | [ ] Validacion legal    |  |
|                                  |  +-------------------------+  |
+----------------------------------+-------------------------------+
|                         POS (Sin aprobaciones)                   |
+------------------------------------------------------------------+

Leyenda: [x] Implementado  [ ] Pendiente
```

---

## Sistema Actual: WorkflowEngine

### Tablas (6)

| Tabla | Proposito |
|-------|-----------|
| `workflow_definiciones` | Workflows por entidad + condicion |
| `workflow_pasos` | Flujo: inicio -> aprobacion -> fin |
| `workflow_transiciones` | Conexiones entre pasos |
| `workflow_instancias` | Ejecuciones activas |
| `workflow_historial` | Auditoria de decisiones |
| `workflow_delegaciones` | Delegacion temporal |

### Configuracion Actual

```sql
-- Workflow para OC
codigo: aprobacion_oc_monto
entidad_tipo: orden_compra
condicion: {"campo": "total", "operador": ">", "valor_ref": "limite_aprobacion"}
```

### Caracteristicas

- Evaluacion condicional via `evaluar_condicion_workflow()`
- Pasos configurables con timeouts
- Notificaciones automaticas
- Acciones finales (cambio de estado)
- Historial completo

---

## Sistema Actual: Vacaciones

### Tablas (4)

| Tabla | Proposito |
|-------|-----------|
| `solicitudes_vacaciones` | Solicitudes con estado |
| `saldos_vacaciones` | Dias disponibles por empleado |
| `politicas_vacaciones` | Reglas por antiguedad |
| `bloqueos_horarios` | Bloqueos de calendario |

### Caracteristicas Especificas

- Aprobador: Supervisor directo (`profesionales.supervisor_id`)
- Calculo de dias habiles (excluye fines de semana)
- Gestion de saldo (acumulacion, uso, vencimiento)
- Integracion con calendario (bloqueos automaticos)
- Soporte para medio dia

---

## Implementacion

### Fase 1: Actual (Completado)

| Modulo | Estado | Sistema |
|--------|--------|---------|
| Vacaciones | [x] Completado | Propio |
| Ordenes de Compra | [x] Completado | WorkflowEngine |
| POS | [x] Sin aprobacion | N/A |

**Archivos clave:**
- `backend/app/modules/workflows/services/workflow.engine.js`
- `backend/app/modules/vacaciones/models/solicitudes.model.js`
- `frontend/src/components/vacaciones/SolicitudesEquipoSection.jsx`
- `frontend/src/pages/vacaciones/VacacionesPage.jsx`

### Fase 2: Proximos 6 meses

| Modulo | Sistema | Notas |
|--------|---------|-------|
| Gastos | WorkflowEngine | Reusar logica OC, agregar categorias |
| Requisiciones | WorkflowEngine | Multi-nivel, genera OC al aprobar |
| Facturas | WorkflowEngine | Por monto, aprobador por rol |
| Pagos | WorkflowEngine | Por monto, tesoreria |

**Trabajo requerido:**
1. Agregar `entidad_tipo` para cada modulo
2. Configurar condiciones y aprobadores
3. Crear UI de aprobacion (reusar patron de OC)

### Fase 3: Largo plazo

| Modulo | Sistema | Notas |
|--------|---------|-------|
| Nomina | Propio | Logica muy especifica |
| Contratos | Propio o Extendido | Evaluar complejidad |
| Reclutamiento | WorkflowEngine | Si es simple |

---

## Expansion del WorkflowEngine

### Nuevos entidad_tipo a Agregar

```sql
-- Fase 2
INSERT INTO workflow_definiciones (codigo, entidad_tipo, condicion_activacion) VALUES
('aprobacion_gastos', 'reporte_gastos', '{"campo": "total", "operador": ">", "valor_ref": "limite_gastos"}'),
('aprobacion_requisicion', 'requisicion_compra', '{"campo": "total", "operador": ">", "valor_ref": "limite_requisicion"}'),
('aprobacion_factura', 'factura', '{"campo": "total", "operador": ">", "valor_ref": "limite_factura"}'),
('aprobacion_pago', 'pago', '{"campo": "monto", "operador": ">", "valor_ref": "limite_pago"}');
```

### Mejoras Sugeridas al Motor

| Mejora | Prioridad | Descripcion |
|--------|-----------|-------------|
| Multi-nivel | Alta | Paso A -> Paso B -> Paso C |
| Condiciones compuestas | Media | monto > X AND categoria = Y |
| Aprobacion paralela | Baja | Todos deben aprobar |
| Escalamiento automatico | Media | Si no responde en 48h, escalar |

---

## GAP: Disenador Visual de Workflows

### Estado Actual

| Componente | Estado | Descripcion |
|------------|--------|-------------|
| AprobacionesPage | Existe | Bandeja para aprobar/rechazar solicitudes |
| WorkflowEngine | Existe | Motor backend que ejecuta workflows |
| Tablas workflow_* | Existe | 6 tablas para definiciones y ejecuciones |
| **UI de Diseno** | **NO EXISTE** | No hay forma visual de crear workflows |
| **Configurador** | **NO EXISTE** | Solo via SQL directo |

### Comparacion con Competencia

| Funcionalidad | Odoo Studio | NetSuite SuiteFlow | Nexo (Actual) |
|---------------|-------------|-------------------|---------------|
| Diseno visual drag & drop | Si | Si | No |
| Configurar condiciones | Si | Si | No (SQL) |
| Asignar aprobadores | Si | Si | No (SQL) |
| Crear pasos personalizados | Si | Si | No |
| Preview del flujo | Si | Si | No |

### Solucion Propuesta: Disenador Visual de Workflows

**Objetivo**: Permitir a usuarios no tecnicos crear y modificar workflows de aprobacion sin escribir codigo.

#### Componentes a Desarrollar

```
frontend/src/pages/configuracion/workflows/
├── WorkflowsListPage.jsx       # Lista de workflows existentes
├── WorkflowDesignerPage.jsx    # Editor visual principal
└── components/
    ├── WorkflowCanvas.jsx      # Canvas drag & drop
    ├── StepNode.jsx            # Nodo de paso (inicio, aprobacion, fin)
    ├── ConditionEditor.jsx     # Editor de condiciones
    ├── ApproverSelector.jsx    # Selector de aprobadores
    ├── TransitionLine.jsx      # Lineas de conexion
    └── WorkflowToolbar.jsx     # Barra de herramientas
```

#### Arquitectura del Disenador

```
+------------------------------------------------------------------+
|                    WORKFLOW DESIGNER                              |
+------------------------------------------------------------------+
|  [Toolbar: Guardar | Probar | Publicar | Historial]              |
+------------------------------------------------------------------+
|                           |                                       |
|   PANEL IZQUIERDO         |         CANVAS CENTRAL                |
|   +-----------------+     |     +-------------------------+       |
|   | Componentes     |     |     |                         |       |
|   | +-------------+ |     |     |    [INICIO]             |       |
|   | | Inicio      | |     |     |        |                |       |
|   | +-------------+ |     |     |        v                |       |
|   | | Aprobacion  | |     |     |  +-----------+          |       |
|   | +-------------+ |     |     |  | Condicion |          |       |
|   | | Condicion   | |     |     |  | monto>10k |          |       |
|   | +-------------+ |     |     |  +-----------+          |       |
|   | | Notificar   | |     |     |    /       \            |       |
|   | +-------------+ |     |     |   Si        No          |       |
|   | | Fin         | |     |     |   |          |          |       |
|   | +-------------+ |     |     |   v          v          |       |
|   +-----------------+     |     | [Aprobar] [Auto-OK]     |       |
|                           |     |     |          |        |       |
|   PROPIEDADES             |     |     v          v        |       |
|   +-----------------+     |     |      [FIN]              |       |
|   | Paso: Aprobar   |     |     |                         |       |
|   | Timeout: 48h    |     |     +-------------------------+       |
|   | Aprobadores:    |     |                                       |
|   | [x] Gerente     |     |   PANEL DERECHO                       |
|   | [ ] Director    |     |   +---------------------------+       |
|   | Escalar a: ...  |     |   | Vista Previa JSON         |       |
|   +-----------------+     |   | Validacion en tiempo real |       |
|                           |   +---------------------------+       |
+------------------------------------------------------------------+
```

#### Funcionalidades Clave

| Funcionalidad | Descripcion | Prioridad |
|---------------|-------------|-----------|
| Drag & Drop | Arrastrar nodos al canvas | Alta |
| Conexiones visuales | Lineas entre nodos | Alta |
| Editor de condiciones | UI para campo/operador/valor | Alta |
| Selector de aprobadores | Por rol, usuario, jerarquia | Alta |
| Validacion en tiempo real | Verificar flujo valido | Media |
| Preview/Simulacion | Probar con datos de ejemplo | Media |
| Versionamiento | Historial de cambios | Media |
| Importar/Exportar | JSON para backup | Baja |
| Templates | Plantillas predefinidas | Baja |

#### Tecnologias Sugeridas

| Opcion | Libreria | Pros | Contras |
|--------|----------|------|---------|
| **A** | React Flow | Popular, bien documentado, MIT | Curva de aprendizaje |
| B | Xyflow | Fork de React Flow, activo | Menos ejemplos |
| C | Custom Canvas | Control total | Mucho desarrollo |
| D | Blockly (Google) | Muy visual, probado | Estilo "bloques" |

**Recomendacion**: React Flow (opcion A) - es el estandar de la industria para editores de flujos.

#### Ejemplo de Integracion con React Flow

```jsx
// WorkflowCanvas.jsx (concepto)
import ReactFlow, {
  Background,
  Controls,
  MiniMap
} from 'reactflow';

const nodeTypes = {
  inicio: StartNode,
  aprobacion: ApprovalNode,
  condicion: ConditionNode,
  notificacion: NotifyNode,
  fin: EndNode,
};

function WorkflowCanvas({ workflow, onChange }) {
  return (
    <ReactFlow
      nodes={workflow.nodes}
      edges={workflow.edges}
      nodeTypes={nodeTypes}
      onNodesChange={onChange}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
```

#### API Backend Requerida

| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/api/v1/workflows` | GET | Listar workflows |
| `/api/v1/workflows` | POST | Crear workflow |
| `/api/v1/workflows/:id` | GET | Obtener detalle |
| `/api/v1/workflows/:id` | PUT | Actualizar workflow |
| `/api/v1/workflows/:id` | DELETE | Eliminar (soft) |
| `/api/v1/workflows/:id/validate` | POST | Validar flujo |
| `/api/v1/workflows/:id/simulate` | POST | Simular con datos |
| `/api/v1/workflows/:id/publish` | POST | Publicar version |
| `/api/v1/workflows/:id/versions` | GET | Historial versiones |

#### Plan de Implementacion

| Fase | Duracion | Entregables |
|------|----------|-------------|
| **Fase 1** | 2 semanas | Lista de workflows + CRUD basico |
| **Fase 2** | 3 semanas | Canvas con React Flow + nodos basicos |
| **Fase 3** | 2 semanas | Editor de condiciones + aprobadores |
| **Fase 4** | 2 semanas | Validacion + simulacion |
| **Fase 5** | 1 semana | Templates + pulido UX |

**Total estimado**: 10 semanas de desarrollo

#### Mockup de Lista de Workflows

```
+------------------------------------------------------------------+
| Configuracion > Workflows de Aprobacion                          |
+------------------------------------------------------------------+
| [+ Nuevo Workflow]                           [Buscar...]         |
+------------------------------------------------------------------+
| Nombre                  | Tipo          | Estado    | Acciones   |
+------------------------------------------------------------------+
| Aprobacion OC por monto | orden_compra  | Activo    | [Editar]   |
| Aprobacion Gastos       | gastos        | Borrador  | [Editar]   |
| Aprobacion Facturas     | factura       | Inactivo  | [Editar]   |
+------------------------------------------------------------------+
```

---

## Metricas de Exito

| Metrica | Objetivo |
|---------|----------|
| Tiempo aprobacion vacaciones | < 24h |
| Tiempo aprobacion OC | < 48h |
| OC pendientes visibles en dashboard | 100% |
| Bloqueos huerfanos en calendario | 0 |
| Historial completo de decisiones | 100% |
| Modulos usando WorkflowEngine | 5+ en 6 meses |

---

## Referencias

### Codigo Fuente
- `backend/app/modules/workflows/services/workflow.engine.js`
- `backend/app/services/workflowAdapter.js`
- `backend/app/modules/vacaciones/models/solicitudes.model.js`
- `backend/app/modules/inventario/models/ordenes-compra.model.js`
- `frontend/src/components/vacaciones/SolicitudesEquipoSection.jsx`

### Investigacion Externa
- [NetSuite Workflows - GURUS Solutions](https://gurussolutions.com/netsuite-workflows)
- [Odoo Multi Level Approval](https://apps.odoo.com/apps/modules/18.0/multi_level_approval_configuration)
- [Purchase Order Approval Patterns - Moxo](https://www.moxo.com/blog/purchase-order-approval-workflow)
- [Workflow Engine Selection - DEV Community](https://dev.to/mohammad_anzawi/choosing-the-right-workflow-engine-for-business-approval-systems-3klf)

---

## Historial de Cambios

| Version | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 3 Ene 2026 | Version inicial - sistemas separados |
| 2.0 | 3 Ene 2026 | Revision completa con vision competitiva, arquitectura hibrida |
| 2.1 | 3 Ene 2026 | Agregado GAP: Disenador Visual de Workflows con React Flow |
