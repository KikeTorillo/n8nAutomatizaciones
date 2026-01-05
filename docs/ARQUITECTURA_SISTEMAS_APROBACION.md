# Arquitectura de Sistemas de Aprobacion

**Fecha**: 4 Enero 2026
**Estado**: Implementado
**Revision**: 3.0

---

## Decision Arquitectonica

### Arquitectura Hibrida: WorkflowEngine + Sistemas Propios

| Enfoque | Modulos | Justificacion |
|---------|---------|---------------|
| **WorkflowEngine** | OC, Requisiciones, Facturas, Pagos, Gastos | Condiciones por monto/rol, reutilizable |
| **Sistema Propio** | Vacaciones, Nomina, Contratos | Logica de dominio especifica |

---

## WorkflowEngine

### Tablas (6)

| Tabla | Proposito |
|-------|-----------|
| `workflow_definiciones` | Workflows por entidad + condicion + prioridad |
| `workflow_pasos` | Flujo: inicio -> aprobacion -> fin (con posiciones X/Y) |
| `workflow_transiciones` | Conexiones entre pasos (con etiquetas) |
| `workflow_instancias` | Ejecuciones activas |
| `workflow_historial` | Auditoria de decisiones |
| `workflow_delegaciones` | Delegacion temporal |

### Workflow Default: Aprobacion OC

```
Inicio (y=211) → Aprobacion Admin (y=200) → Fin Aprobado (y=192)
                                         → Fin Rechazado (y=224)
```

Condicion: `total > limite_aprobacion`
Aprobadores: rol admin/propietario
Timeout: 72h

---

## Editor Visual de Workflows

### Stack

- **Frontend**: React Flow + Tailwind
- **Snap Grid**: 5x5 px (precision de posicionamiento)
- **Flujo**: Horizontal (izquierda → derecha)

### Estructura de Archivos

```
frontend/src/
├── pages/configuracion/workflows/
│   ├── WorkflowsListPage.jsx        # Lista CRUD
│   └── WorkflowDesignerPage.jsx     # Editor principal
│
├── components/workflows/
│   ├── canvas/WorkflowCanvas.jsx    # React Flow canvas
│   ├── nodes/                       # 5 tipos de nodos
│   │   ├── BaseNode.jsx
│   │   ├── StartNode.jsx            # Verde, handle derecha
│   │   ├── ApprovalNode.jsx         # Morado, handles izq/der
│   │   ├── ConditionNode.jsx        # Ambar, diamante
│   │   ├── ActionNode.jsx           # Azul
│   │   └── EndNode.jsx              # Rojo, handle izquierda
│   ├── edges/WorkflowEdge.jsx       # SmoothStep con etiquetas
│   ├── drawers/                     # Configuracion por nodo
│   │   ├── NodeConfigDrawer.jsx     # Router
│   │   ├── ApprovalNodeDrawer.jsx
│   │   ├── ConditionNodeDrawer.jsx
│   │   ├── ActionNodeDrawer.jsx
│   │   └── WorkflowSettingsDrawer.jsx
│   └── toolbar/
│       ├── WorkflowToolbar.jsx      # Guardar/Validar/Publicar
│       └── NodePalette.jsx          # Drag & drop
│
└── hooks/
    ├── useWorkflowDesigner.js       # CRUD + serializacion
    └── useWorkflowValidation.js     # Validacion tiempo real

backend/app/modules/workflows/
├── models/
│   ├── definiciones.model.js
│   └── instancias.model.js          # Query con paso_origen/destino_codigo
└── controllers/designer.controller.js
```

### Tipos de Nodos

| Tipo | Handle Entrada | Handle Salida | Config |
|------|----------------|---------------|--------|
| `inicio` | - | Derecha | - |
| `aprobacion` | Izquierda | Derecha (30% aprobar, 70% rechazar) | aprobadores, timeout |
| `condicion` | Izquierda | Derecha (Si/No) | campo, operador, valor |
| `accion` | Izquierda | Derecha | tipo_accion |
| `fin` | Izquierda | - | estado_nuevo |

### Serializacion Frontend ↔ Backend

```javascript
// Frontend: { aprobador: { tipo: "rol", valor: "admin" } }
// Backend:  { aprobadores_tipo: "rol", aprobadores: ["admin"] }

// useWorkflowDesigner.js
transformApprovalConfig()      // Frontend → Backend
transformBackendApprovalConfig() // Backend → Frontend
```

### API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/v1/workflows/definiciones` | Listar |
| GET | `/api/v1/workflows/definiciones/:id` | Detalle con pasos/transiciones |
| POST | `/api/v1/workflows/designer/definiciones` | Crear |
| PUT | `/api/v1/workflows/designer/definiciones/:id` | Actualizar |
| PATCH | `/api/v1/workflows/designer/definiciones/:id/publicar` | Publicar/Despublicar |

---

## Funcionalidades Implementadas

- [x] Canvas React Flow con dark mode
- [x] Flujo horizontal (handles Left/Right)
- [x] Paleta drag & drop de 5 tipos de nodos
- [x] Edges SmoothStep con etiquetas coloreadas
- [x] Drawers de configuracion por tipo de nodo
- [x] Validacion en tiempo real con indicadores
- [x] Publicar/Despublicar workflow
- [x] Minimapa de navegacion
- [x] Atajos teclado (Delete, Ctrl+S)
- [x] Snap grid 5x5 para alineacion precisa

---

## Pendientes

| Item | Prioridad |
|------|-----------|
| Integracion con motor de ejecucion | Alta |
| Soporte multi-nivel de aprobacion | Media |
| Duplicar workflow desde UI | Baja |

---

## Codigo Clave

| Archivo | Funcion |
|---------|---------|
| `workflow.engine.js` | Motor de ejecucion |
| `useWorkflowDesigner.js` | CRUD + transformaciones |
| `WorkflowCanvas.jsx` | Canvas React Flow (snapGrid: 5x5) |
| `WorkflowEdge.jsx` | getSmoothStepPath con etiquetas |
| `04-datos-iniciales.sql` | Workflow OC default con posiciones |

---

## Historial

| Version | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 3 Ene 2026 | Version inicial |
| 2.0 | 3 Ene 2026 | Arquitectura hibrida |
| 3.0 | 4 Ene 2026 | Editor visual completo, flujo horizontal, alineacion de nodos |
