# Plan de Implementación: Gaps Competitivos del Módulo de Workflows

## Resumen Ejecutivo

Este documento detalla la implementación de las funcionalidades faltantes identificadas en el análisis competitivo contra Odoo, SAP, NetSuite, Dynamics 365 y Zoho.

**Prioridades:**
| Gap | Prioridad | Esfuerzo | Impacto |
|-----|-----------|----------|---------|
| Aprobaciones Paralelas | 🔴 Alta | 4-5 días | Alto |
| Dashboard Métricas/SLAs | 🟡 Media | 3 días | Alto |
| Aprobación vía Email | 🟡 Media | 2-3 días | Medio |
| Webhooks para N8N | 🟡 Media | 1-2 días | Medio |
| Templates Predefinidos | 🟢 Baja | 2 días | Bajo |
| AI Detección Anomalías | 🟢 Baja | 5+ días | Medio |

---

# FASE 1: Aprobaciones Paralelas (Prioridad Alta)

## Problema Actual
- `workflow_instancias.paso_actual_id` es SINGULAR (solo 1 paso activo)
- `obtener_siguiente_paso()` retorna solo 1 fila (`LIMIT 1`)
- No hay forma de tener IT y Finanzas aprobando simultáneamente

## Solución: Nueva Tabla de Pasos Paralelos

### 1.1 SQL - Nueva Tabla

**Archivo:** `sql/workflows/01-tablas.sql`

```sql
-- Tabla para tracking de múltiples pasos activos en paralelo
CREATE TABLE workflow_instancias_pasos (
    id SERIAL PRIMARY KEY,
    instancia_id INTEGER NOT NULL REFERENCES workflow_instancias(id) ON DELETE CASCADE,
    paso_id INTEGER NOT NULL REFERENCES workflow_pasos(id),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    aprobador_id INTEGER REFERENCES usuarios(id),
    aprobado_en TIMESTAMPTZ,
    comentario TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(instancia_id, paso_id)
);

-- Índices para rendimiento
CREATE INDEX idx_wip_instancia_estado ON workflow_instancias_pasos(instancia_id, estado);
CREATE INDEX idx_wip_paso ON workflow_instancias_pasos(paso_id);

-- RLS Policy
ALTER TABLE workflow_instancias_pasos ENABLE ROW LEVEL SECURITY;
CREATE POLICY workflow_instancias_pasos_org_policy ON workflow_instancias_pasos
    USING (instancia_id IN (
        SELECT id FROM workflow_instancias WHERE organizacion_id = current_setting('app.current_tenant_id')::INT
    ));
```

### 1.2 SQL - Nuevas Funciones

**Archivo:** `sql/workflows/03-funciones.sql`

```sql
-- Iniciar múltiples pasos paralelos
CREATE OR REPLACE FUNCTION iniciar_pasos_paralelos(
    p_instancia_id INTEGER,
    p_paso_ids INTEGER[]
) RETURNS VOID AS $$
BEGIN
    INSERT INTO workflow_instancias_pasos (instancia_id, paso_id, estado)
    SELECT p_instancia_id, UNNEST(p_paso_ids), 'pendiente';
END;
$$ LANGUAGE plpgsql;

-- Verificar si todos los pasos paralelos están aprobados
CREATE OR REPLACE FUNCTION todos_pasos_paralelos_aprobados(p_instancia_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM workflow_instancias_pasos
        WHERE instancia_id = p_instancia_id AND estado = 'pendiente'
    );
END;
$$ LANGUAGE plpgsql;

-- Verificar si algún paso paralelo fue rechazado
CREATE OR REPLACE FUNCTION algun_paso_paralelo_rechazado(p_instancia_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workflow_instancias_pasos
        WHERE instancia_id = p_instancia_id AND estado = 'rechazado'
    );
END;
$$ LANGUAGE plpgsql;

-- Obtener TODOS los siguientes pasos (no solo 1)
CREATE OR REPLACE FUNCTION obtener_siguientes_pasos(
    p_paso_actual_id INTEGER,
    p_etiqueta TEXT DEFAULT NULL
)
RETURNS TABLE(paso_id INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT wt.paso_destino_id
    FROM workflow_transiciones wt
    WHERE wt.paso_origen_id = p_paso_actual_id
      AND (p_etiqueta IS NULL OR wt.etiqueta = p_etiqueta OR wt.etiqueta IS NULL)
    ORDER BY wt.orden;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 1.3 Backend - Modificar WorkflowEngine

**Archivo:** `backend/app/modules/workflows/services/workflow.engine.js`

**Cambios en `iniciarWorkflow()`:**
```javascript
// Obtener TODOS los siguientes pasos (puede haber múltiples)
const siguientesQuery = await db.query(
    `SELECT * FROM obtener_siguientes_pasos($1, 'siguiente')`,
    [pasoInicialId]
);

const pasoIds = siguientesQuery.rows.map(r => r.paso_id);

if (pasoIds.length > 1) {
    // PARALELOS: insertar en workflow_instancias_pasos
    await db.query(
        `SELECT iniciar_pasos_paralelos($1, $2)`,
        [instancia.id, pasoIds]
    );

    // Marcar instancia como paralela (paso_actual_id = NULL)
    await db.query(
        `UPDATE workflow_instancias SET paso_actual_id = NULL WHERE id = $1`,
        [instancia.id]
    );

    // Notificar a aprobadores de TODOS los pasos
    for (const pasoId of pasoIds) {
        await this._notificarAprobadoresPaso(instancia, pasoId, organizacionId, db);
    }
} else {
    // SECUENCIAL: comportamiento actual (sin cambios)
    // ...
}
```

**Nuevo método `aprobarPasoParalelo()`:**
```javascript
static async aprobarPasoParalelo(instanciaId, pasoId, usuarioId, comentario, organizacionId) {
    return await RLSContextManager.transaction(organizacionId, async (db) => {
        // 1. Marcar paso como aprobado
        await db.query(
            `UPDATE workflow_instancias_pasos
             SET estado = 'aprobado', aprobador_id = $1, aprobado_en = NOW(), comentario = $2
             WHERE instancia_id = $3 AND paso_id = $4`,
            [usuarioId, comentario, instanciaId, pasoId]
        );

        // 2. Registrar en historial
        await db.query(
            `INSERT INTO workflow_historial (instancia_id, paso_id, accion, usuario_id, comentario)
             VALUES ($1, $2, 'aprobado', $3, $4)`,
            [instanciaId, pasoId, usuarioId, comentario]
        );

        // 3. Verificar si TODOS los pasos paralelos están aprobados
        const todosQuery = await db.query(
            `SELECT todos_pasos_paralelos_aprobados($1) as todos`,
            [instanciaId]
        );

        if (todosQuery.rows[0].todos) {
            // Todos aprobaron: avanzar al siguiente paso común
            await this._avanzarDespuesDeParalelos(instanciaId, organizacionId, db);
        }

        return { estado: 'aprobado_parcial', todosAprobados: todosQuery.rows[0].todos };
    });
}
```

### 1.4 Frontend - UI para Pasos Paralelos

**Archivo:** `frontend/src/components/workflows/editors/ApprovalNodeDrawer.jsx`

Agregar campo para marcar nodos como paralelos:
```jsx
<div className="mt-4">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={formData.es_paralelo || false}
      onChange={(e) => handleChange('es_paralelo', e.target.checked)}
    />
    <span>Ejecutar en paralelo con otros nodos conectados</span>
  </label>
  <p className="text-xs text-gray-500 mt-1">
    Si hay múltiples nodos conectados desde el mismo origen,
    todos se activarán simultáneamente
  </p>
</div>
```

### 1.5 Validaciones Adicionales

**Archivo:** `frontend/src/hooks/useWorkflowValidation.js`

```javascript
// Validar que pasos paralelos converjan en un punto común
const validarConvergenciaParalelos = (nodes, edges) => {
  // Si hay bifurcación paralela, debe haber convergencia
  // Alertar si los caminos paralelos no convergen
};
```

---

# FASE 2: Dashboard de Métricas y SLAs (Prioridad Media)

## Arquitectura

```
Frontend                    Backend                      BD
   │                           │                          │
useMetricasWorkflows() ──> GET /workflows/metricas ──> SQL Agregado
   │                           │                          │
StatCard + Charts  <──────── JSON Response <──────── workflow_instancias
                                                     workflow_historial
```

## 2.1 Backend - Nuevo Controller

**Archivo:** `backend/app/modules/workflows/controllers/metricas.controller.js`

```javascript
const RLSContextManager = require('../../../utils/rlsContextManager');

class MetricasWorkflowsController {

    static async obtenerResumen(req, res, next) {
        try {
            const { organizacion_id } = req.user;
            const { desde, hasta } = req.query;

            const resultado = await RLSContextManager.query(organizacion_id, async (db) => {
                return await db.query(`
                    WITH stats AS (
                        SELECT
                            AVG(EXTRACT(EPOCH FROM (completado_en - iniciado_en)) / 3600) as tiempo_promedio_horas,
                            PERCENTILE_CONT(0.95) WITHIN GROUP (
                                ORDER BY EXTRACT(EPOCH FROM (completado_en - iniciado_en)) / 3600
                            ) as tiempo_p95_horas,
                            COUNT(*) FILTER (WHERE completado_en <= fecha_limite) as dentro_sla,
                            COUNT(*) FILTER (WHERE completado_en IS NOT NULL) as total_completadas,
                            COUNT(*) FILTER (WHERE estado = 'aprobado') as aprobadas,
                            COUNT(*) FILTER (WHERE estado = 'rechazado') as rechazadas,
                            COUNT(*) FILTER (WHERE estado = 'en_progreso') as en_progreso,
                            COUNT(*) FILTER (WHERE estado = 'expirado') as expiradas
                        FROM workflow_instancias
                        WHERE organizacion_id = $1
                          AND (completado_en >= $2 OR completado_en IS NULL)
                          AND (completado_en <= $3 OR completado_en IS NULL)
                    )
                    SELECT
                        ROUND(tiempo_promedio_horas::numeric, 2) as tiempo_promedio_horas,
                        ROUND(tiempo_p95_horas::numeric, 2) as tiempo_p95_horas,
                        ROUND(dentro_sla * 100.0 / NULLIF(total_completadas, 0), 2) as sla_compliance_pct,
                        aprobadas,
                        rechazadas,
                        ROUND(aprobadas * 100.0 / NULLIF(aprobadas + rechazadas, 0), 2) as tasa_aprobacion_pct,
                        en_progreso,
                        expiradas
                    FROM stats
                `, [organizacion_id, desde || '1970-01-01', hasta || '2099-12-31']);
            });

            res.json({ success: true, data: resultado.rows[0] });
        } catch (error) {
            next(error);
        }
    }

    static async obtenerTimeline(req, res, next) {
        // Gráfica de completadas por día (últimos 30 días)
        // ...
    }

    static async obtenerAprobadoresMasActivos(req, res, next) {
        // Top 10 aprobadores por cantidad y tiempo promedio
        // ...
    }
}

module.exports = MetricasWorkflowsController;
```

### 2.2 Backend - Nueva Ruta

**Archivo:** `backend/app/modules/workflows/routes/metricas.routes.js`

```javascript
const router = require('express').Router();
const MetricasController = require('../controllers/metricas.controller');
const auth = require('../../../middleware/auth');

router.get('/resumen', auth.authenticateToken, MetricasController.obtenerResumen);
router.get('/timeline', auth.authenticateToken, MetricasController.obtenerTimeline);
router.get('/aprobadores', auth.authenticateToken, MetricasController.obtenerAprobadoresMasActivos);
router.get('/sla', auth.authenticateToken, MetricasController.obtenerSLADetalle);

module.exports = router;
```

### 2.3 Frontend - Nuevo Hook

**Archivo:** `frontend/src/hooks/useMetricasWorkflows.js`

```javascript
import { useQuery } from '@tanstack/react-query';
import { workflowsApi } from '@/services/api/endpoints';

export function useMetricasWorkflows(filtros = {}) {
    return useQuery({
        queryKey: ['metricas-workflows', filtros],
        queryFn: () => workflowsApi.obtenerMetricas(filtros),
        staleTime: 1000 * 60 * 5, // 5 minutos cache
    });
}

export function useTimelineWorkflows(dias = 30) {
    return useQuery({
        queryKey: ['timeline-workflows', dias],
        queryFn: () => workflowsApi.obtenerTimeline({ dias }),
        staleTime: 1000 * 60 * 10,
    });
}
```

### 2.4 Frontend - Nueva Página

**Archivo:** `frontend/src/pages/configuracion/workflows/WorkflowMetricasPage.jsx`

```jsx
import StatCard from '@/components/dashboard/StatCard';
import { Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { useMetricasWorkflows, useTimelineWorkflows } from '@/hooks/useMetricasWorkflows';
import { Line, Doughnut } from 'react-chartjs-2';

function WorkflowMetricasPage() {
    const { data: metricas, isLoading } = useMetricasWorkflows();
    const { data: timeline } = useTimelineWorkflows(30);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Métricas de Workflows</h1>

            {/* KPIs principales */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                    title="Tiempo Promedio"
                    value={`${metricas?.tiempo_promedio_horas || 0}h`}
                    icon={Clock}
                    color="blue"
                />
                <StatCard
                    title="SLA Compliance"
                    value={`${metricas?.sla_compliance_pct || 0}%`}
                    icon={TrendingUp}
                    color={metricas?.sla_compliance_pct >= 95 ? 'green' : 'yellow'}
                />
                <StatCard
                    title="Tasa Aprobación"
                    value={`${metricas?.tasa_aprobacion_pct || 0}%`}
                    icon={CheckCircle}
                    color="green"
                />
                <StatCard
                    title="En Progreso"
                    value={metricas?.en_progreso || 0}
                    icon={Clock}
                    color="yellow"
                />
                <StatCard
                    title="Rechazadas"
                    value={metricas?.rechazadas || 0}
                    icon={XCircle}
                    color="red"
                />
                <StatCard
                    title="Expiradas"
                    value={metricas?.expiradas || 0}
                    icon={AlertTriangle}
                    color="orange"
                />
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Completadas por Día</h3>
                    <Line data={timeline} options={chartOptions} />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Distribución de Estados</h3>
                    <Doughnut data={estadosData} />
                </div>
            </div>
        </div>
    );
}
```

---

# FASE 3: Aprobación vía Email (Prioridad Media)

## Flujo de Aprobación por Email

```
1. WorkflowEngine crea instancia
2. Genera token único (crypto.randomBytes)
3. Envía email con botones APROBAR/RECHAZAR
4. Usuario hace clic → GET /aprobaciones/token/:token
5. Muestra página de confirmación
6. Usuario confirma → POST aprobar/rechazar
7. Token se invalida (Redis blacklist)
```

### 3.1 SQL - Agregar Campo Token

**Archivo:** `sql/workflows/01-tablas.sql`

```sql
ALTER TABLE workflow_instancias
ADD COLUMN approval_token VARCHAR(64),
ADD COLUMN token_expira TIMESTAMPTZ;

CREATE INDEX idx_wi_approval_token ON workflow_instancias(approval_token)
WHERE approval_token IS NOT NULL;
```

### 3.2 Backend - Template de Email

**Archivo:** `backend/app/services/email/templates/approvalRequest.js`

```javascript
module.exports = ({ nombre, folio, monto, descripcion, aprobarUrl, rechazarUrl, expiraEn }) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        .btn { padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
        .btn-aprobar { background: #10B981; color: white; }
        .btn-rechazar { background: #EF4444; color: white; }
    </style>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #753572; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Nexo</h1>
    </div>

    <div style="padding: 30px;">
        <h2>Hola ${nombre},</h2>

        <p>Se requiere tu aprobación para:</p>

        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Documento:</strong> ${folio}</p>
            <p><strong>Monto:</strong> $${monto.toLocaleString('es-MX')}</p>
            <p><strong>Descripción:</strong> ${descripcion}</p>
        </div>

        <p><strong>Fecha límite:</strong> ${expiraEn}</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${aprobarUrl}" class="btn btn-aprobar" style="margin-right: 10px;">
                ✓ APROBAR
            </a>
            <a href="${rechazarUrl}" class="btn btn-rechazar">
                ✗ RECHAZAR
            </a>
        </div>

        <p style="color: #6B7280; font-size: 12px;">
            Este enlace expira en ${expiraEn}. Si no solicitaste esta aprobación, ignora este correo.
        </p>
    </div>
</body>
</html>
`;
```

### 3.3 Backend - Endpoint de Aprobación por Token

**Archivo:** `backend/app/modules/workflows/routes/aprobaciones.routes.js`

```javascript
// GET - Página de confirmación
router.get('/token/:token', AprobacionesController.mostrarConfirmacionToken);

// POST - Ejecutar aprobación/rechazo
router.post('/token/:token/aprobar', AprobacionesController.aprobarPorToken);
router.post('/token/:token/rechazar', AprobacionesController.rechazarPorToken);
```

### 3.4 Backend - Controller Token

**Archivo:** `backend/app/modules/workflows/controllers/aprobaciones.controller.js`

```javascript
static async mostrarConfirmacionToken(req, res, next) {
    const { token } = req.params;

    // Verificar token válido y no expirado
    const instancia = await db.query(`
        SELECT wi.*, wd.nombre as workflow_nombre,
               oc.folio, oc.total
        FROM workflow_instancias wi
        JOIN workflow_definiciones wd ON wd.id = wi.workflow_id
        LEFT JOIN ordenes_compra oc ON oc.id = wi.entidad_id AND wi.entidad_tipo = 'orden_compra'
        WHERE wi.approval_token = $1
          AND wi.token_expira > NOW()
          AND wi.estado = 'en_progreso'
    `, [token]);

    if (!instancia.rows[0]) {
        return res.status(404).render('approval-expired', {
            mensaje: 'Este enlace ha expirado o ya fue utilizado'
        });
    }

    // Verificar si token ya fue usado (Redis)
    const usado = await redisClient.get(`approval_token_used:${token}`);
    if (usado) {
        return res.status(400).render('approval-already-used');
    }

    res.render('approval-confirm', {
        instancia: instancia.rows[0],
        token
    });
}

static async aprobarPorToken(req, res, next) {
    const { token } = req.params;
    const { comentario } = req.body;

    // Validar token
    const instancia = await validarToken(token);
    if (!instancia) return res.status(401).json({ error: 'Token inválido' });

    // Marcar token como usado (prevenir replay)
    await redisClient.setex(`approval_token_used:${token}`, 86400, '1');

    // Ejecutar aprobación
    // Nota: sin usuarioId, registrar como "aprobación por email"
    await WorkflowEngine.aprobar(
        instancia.id,
        null, // Usuario desconocido (email)
        comentario,
        instancia.organizacion_id
    );

    res.render('approval-success', { accion: 'aprobada' });
}
```

### 3.5 Integrar en WorkflowEngine._notificarAprobadores()

```javascript
// Después de crear notificación UI, enviar email
const crypto = require('crypto');
const approvalToken = crypto.randomBytes(32).toString('hex');

// Guardar token en instancia
await db.query(
    `UPDATE workflow_instancias
     SET approval_token = $1, token_expira = NOW() + INTERVAL '72 hours'
     WHERE id = $2`,
    [approvalToken, instancia.id]
);

// Enviar email a cada aprobador
for (const aprobador of aprobadores) {
    await emailService.enviarSolicitudAprobacion({
        email: aprobador.email,
        nombre: aprobador.nombre,
        folio: tituloEntidad,
        monto: contexto.total || 0,
        descripcion: contexto.descripcion || '',
        aprobarUrl: `${FRONTEND_URL}/api/v1/workflows/aprobaciones/token/${approvalToken}/aprobar`,
        rechazarUrl: `${FRONTEND_URL}/api/v1/workflows/aprobaciones/token/${approvalToken}/rechazar`,
        expiraEn: new Date(Date.now() + 72*60*60*1000).toLocaleString('es-MX')
    });
}
```

---

# FASE 4: Webhooks para N8N (Prioridad Media)

## 4.1 Backend - Nueva Ruta Webhook

**Archivo:** `backend/app/modules/workflows/routes/webhooks.routes.js`

```javascript
const router = require('express').Router();
const crypto = require('crypto');

// Validar firma HMAC
const validateWebhookSignature = (req, res, next) => {
    const signature = req.headers['x-webhook-signature'];
    const secret = process.env.WEBHOOK_SECRET;

    const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (signature !== expectedSig) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    next();
};

// Webhook entrante desde N8N
router.post('/workflow-events',
    express.json(),
    validateWebhookSignature,
    async (req, res) => {
        // Responder rápido
        res.status(200).send('OK');

        // Procesar async
        const { evento, datos } = req.body;

        switch (evento) {
            case 'aprobar_externo':
                await WorkflowEngine.aprobar(datos.instancia_id, datos.usuario_id, datos.comentario, datos.organizacion_id);
                break;
            case 'rechazar_externo':
                await WorkflowEngine.rechazar(datos.instancia_id, datos.usuario_id, datos.motivo, datos.organizacion_id);
                break;
        }
    }
);

module.exports = router;
```

## 4.2 Disparar Eventos hacia N8N

**Archivo:** `backend/app/modules/workflows/services/workflow.engine.js`

```javascript
// Al final de iniciarWorkflow(), aprobar(), rechazar()
await this._dispararWebhookN8N(evento, datos);

static async _dispararWebhookN8N(evento, datos) {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
        await axios.post(webhookUrl, {
            evento,
            datos,
            timestamp: new Date().toISOString()
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Source': 'nexo-workflows'
            },
            timeout: 5000
        });
    } catch (error) {
        logger.warn('[WorkflowEngine] Error enviando webhook a N8N', { error: error.message });
        // No fallar el flujo principal por error de webhook
    }
}
```

---

# FASE 5: Templates Predefinidos (Prioridad Baja)

## 5.1 SQL - Tabla de Templates

```sql
CREATE TABLE workflow_templates (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    entidad_tipo VARCHAR(50) NOT NULL,
    categoria VARCHAR(50), -- 'compras', 'gastos', 'rrhh'
    definicion JSONB NOT NULL, -- {pasos: [], transiciones: []}
    es_publico BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Templates iniciales
INSERT INTO workflow_templates (codigo, nombre, descripcion, entidad_tipo, categoria, definicion) VALUES
('oc_basico', 'Aprobación OC Básica', 'Aprobación simple de órdenes de compra por monto', 'orden_compra', 'compras', '{"pasos":[...], "transiciones":[...]}'),
('oc_multinivel', 'Aprobación OC Multi-nivel', 'Manager → Director → CFO según monto', 'orden_compra', 'compras', '{"pasos":[...], "transiciones":[...]}'),
('gastos_basico', 'Aprobación de Gastos', 'Aprobación de gastos por supervisor', 'gasto', 'gastos', '{"pasos":[...], "transiciones":[...]}'),
('vacaciones', 'Solicitud de Vacaciones', 'Aprobación por RRHH y supervisor', 'vacacion', 'rrhh', '{"pasos":[...], "transiciones":[...]}');
```

## 5.2 Frontend - Selector de Templates

**Archivo:** `frontend/src/components/workflows/modals/TemplatePickerModal.jsx`

```jsx
function TemplatePickerModal({ isOpen, onClose, onSelect }) {
    const { data: templates } = useQuery({
        queryKey: ['workflow-templates'],
        queryFn: () => workflowsApi.listarTemplates()
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Plantilla">
            <div className="grid grid-cols-2 gap-4">
                {templates?.map(template => (
                    <button
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className="p-4 border rounded-lg hover:border-primary-500 text-left"
                    >
                        <h4 className="font-semibold">{template.nombre}</h4>
                        <p className="text-sm text-gray-500">{template.descripcion}</p>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                            {template.categoria}
                        </span>
                    </button>
                ))}
            </div>
        </Modal>
    );
}
```

---

# FASE 6: AI Detección de Anomalías (Futuro)

## Concepto

Integrar con DeepSeek/OpenRouter existente para:
1. Detectar patrones inusuales (proveedor nuevo + monto alto)
2. Sugerir auto-aprobación cuando riesgo es bajo
3. Priorizar revisiones según score de riesgo

## Implementación Futura

```javascript
// En evaluarRequiereAprobacion()
const riskScore = await AIService.evaluarRiesgoAprobacion({
    entidad: datosEntidad,
    usuario: usuarioId,
    historico: await obtenerHistoricoUsuario(usuarioId)
});

if (riskScore < 0.2 && total < limiteAutoAprobacion) {
    // Auto-aprobar con registro
    return { requiere: false, motivo: 'auto_aprobado_bajo_riesgo' };
}

if (riskScore > 0.8) {
    // Marcar como alta prioridad
    return { requiere: true, prioridad: 2, alertas: ['riesgo_alto'] };
}
```

---

# Cronograma de Implementación Sugerido

| Semana | Fase | Entregables |
|--------|------|-------------|
| 1 | Paralelas (SQL) | Tabla + funciones + tests |
| 2 | Paralelas (Backend) | WorkflowEngine refactor |
| 3 | Paralelas (Frontend) | UI + validaciones |
| 4 | Métricas (Backend) | Controller + rutas + queries |
| 5 | Métricas (Frontend) | Dashboard + gráficas |
| 6 | Email Approval | Template + endpoints + integración |
| 7 | Webhooks | Rutas + integración N8N |
| 8 | Templates | BD + UI selector |
| 9+ | Testing E2E | Pruebas completas |

---

# Archivos a Crear/Modificar

## Nuevos Archivos
- `sql/workflows/05-pasos-paralelos.sql`
- `backend/app/modules/workflows/controllers/metricas.controller.js`
- `backend/app/modules/workflows/routes/metricas.routes.js`
- `backend/app/services/email/templates/approvalRequest.js`
- `frontend/src/hooks/useMetricasWorkflows.js`
- `frontend/src/pages/configuracion/workflows/WorkflowMetricasPage.jsx`
- `frontend/src/components/workflows/modals/TemplatePickerModal.jsx`

## Archivos a Modificar
- `sql/workflows/01-tablas.sql` (agregar campos token)
- `sql/workflows/03-funciones.sql` (nuevas funciones paralelas)
- `backend/app/modules/workflows/services/workflow.engine.js` (refactor mayor)
- `backend/app/modules/workflows/routes/aprobaciones.routes.js` (rutas token)
- `backend/app/modules/workflows/controllers/aprobaciones.controller.js`
- `backend/app/services/emailService.js` (nuevo método)
- `frontend/src/services/api/endpoints.js` (nuevos endpoints)
- `frontend/src/components/workflows/editors/ApprovalNodeDrawer.jsx`

---

# Métricas de Éxito

| Métrica | Objetivo | Cómo Medir |
|---------|----------|------------|
| Tiempo promedio aprobación | < 24h | Dashboard métricas |
| SLA Compliance | > 95% | Dashboard métricas |
| Adopción email approval | > 30% | % aprobaciones vía email |
| Uso templates | > 50% nuevos workflows | Contador en BD |
| Errores paralelos | 0 | Logs + monitoreo |
