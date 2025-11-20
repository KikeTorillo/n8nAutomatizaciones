# 💳 PLAN - INTEGRACIÓN TERMINALES FÍSICAS POS

**Fecha Creación:** 20 Noviembre 2025
**Estado:** 📋 Post-MVP (Fase 6)
**Prioridad:** 🟡 MEDIA
**Tiempo Estimado:** 1-2 semanas
**Prerequisito:** MVP de Inventario y POS completado

---

## 📊 CONTEXTO

Este documento detalla la integración de **terminales físicas de pago** (Mercado Pago Point, Clip) con el sistema de Punto de Venta (POS).

**⚠️ IMPORTANTE:** Esta funcionalidad es **POST-MVP**. El MVP inicial solo incluye:
- ✅ Métodos de pago manuales (efectivo, tarjeta, transferencia, mixto)
- ✅ QR dinámico de Mercado Pago (sin terminal física)
- ✅ Registro manual de pagos en efectivo

---

## 🎯 VALOR AGREGADO

### Beneficios de Terminales Físicas

**Para el negocio:**
- ⚡ Cobros instantáneos con confirmación automática
- 🔒 Mayor seguridad (sin manejo de efectivo)
- 📊 Conciliación automática con estado de cuenta
- 💼 Aspecto profesional ante clientes

**Para el sistema:**
- 🤖 Actualización automática de estado de venta
- 📉 Reducción de errores humanos en registro manual
- 🔗 Trazabilidad completa del pago
- 📱 Experiencia contactless (NFC)

---

## 🔌 TERMINALES SOPORTADAS

### 1. Mercado Pago Point

**Características:**
- Terminal Bluetooth/WiFi
- Acepta tarjetas chip, contactless (NFC), QR
- API oficial de integración: [MP Point API](https://www.mercadopago.com.mx/developers/es/docs/mp-point)
- Webhook de confirmación en tiempo real
- Precio: ~$890 MXN (2025)

**Modelos:**
- **Point Smart:** Bluetooth, pantalla táctil, batería
- **Point Mini:** Bluetooth, conecta a smartphone
- **Point Plus:** WiFi/4G, impresora térmica integrada

**Flujo de integración:**
1. Registrar terminal en dashboard Mercado Pago
2. Obtener `device_id` del dispositivo
3. Crear `payment_intent` desde backend con `device_id`
4. Terminal muestra monto y espera tarjeta del cliente
5. Cliente pasa tarjeta (chip/contactless)
6. Terminal procesa pago con Mercado Pago
7. Webhook notifica resultado a backend
8. Backend actualiza venta a estado `pagado`
9. Trigger automático descuenta stock y genera comisión

---

### 2. Clip

**Características:**
- Terminal móvil (conecta a smartphone vía audio jack o Bluetooth)
- Acepta tarjetas chip y banda magnética
- API REST para integración
- Requiere SDK móvil para control de terminal
- Precio: Gratuito con comisiones por transacción

**Modelos:**
- **Clip Plus:** Bluetooth, batería, NFC
- **Clip Pro:** WiFi, pantalla grande, impresora

**Flujo de integración:**
1. Registrar en Clip Dashboard
2. Obtener API keys (pública y secreta)
3. Crear transacción desde backend con Clip API
4. Opciones:
   - **Opción A:** Generar link de pago (cliente paga desde su celular)
   - **Opción B:** Usar SDK móvil nativo (control directo de terminal)
5. Webhook notifica resultado
6. Backend actualiza venta

**⚠️ LIMITACIÓN:** Clip requiere SDK móvil nativo (iOS/Android) para control directo de terminal. Para web, solo soporta links de pago.

---

## 🗄️ ARQUITECTURA DE BASE DE DATOS

### Nueva Tabla: `terminales_pos`

```sql
CREATE TABLE terminales_pos (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📱 INFORMACIÓN DEL TERMINAL
    nombre VARCHAR(100) NOT NULL, -- Ej: "Terminal Mostrador 1"
    tipo_terminal VARCHAR(30) NOT NULL CHECK (tipo_terminal IN (
        'mercadopago_point',
        'mercadopago_point_smart',
        'mercadopago_point_plus',
        'clip_plus',
        'clip_pro'
    )),
    proveedor VARCHAR(20) NOT NULL CHECK (proveedor IN ('mercadopago', 'clip')),

    -- 🔗 CREDENCIALES
    device_id VARCHAR(255) NOT NULL, -- ID del dispositivo en la plataforma
    external_id VARCHAR(255), -- ID adicional si lo requiere
    ubicacion VARCHAR(100), -- Ej: "Sucursal Centro", "Mostrador 2"

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT true,
    conectado BOOLEAN DEFAULT false, -- Última vez que respondió
    ultima_conexion TIMESTAMPTZ,

    -- 🔐 METADATA
    configuracion JSONB, -- Config específica del terminal
    /*
    Ejemplo:
    {
        "auto_print": true,
        "max_installments": 12,
        "allowed_card_types": ["credit", "debit"],
        "timeout_seconds": 60
    }
    */

    -- 📅 TIMESTAMPS
    registrado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, device_id)
);

CREATE INDEX idx_terminales_org ON terminales_pos(organizacion_id);
CREATE INDEX idx_terminales_activo ON terminales_pos(organizacion_id, activo) WHERE activo = true;
CREATE INDEX idx_terminales_proveedor ON terminales_pos(proveedor, activo);
```

---

### Modificación: Tabla `ventas_pos`

**Agregar columnas:**
```sql
ALTER TABLE ventas_pos
ADD COLUMN terminal_id INTEGER REFERENCES terminales_pos(id),
ADD COLUMN payment_intent_id VARCHAR(255), -- ID del pago en plataforma externa
ADD COLUMN terminal_metadata JSONB; -- Info del pago en terminal

-- Índice
CREATE INDEX idx_ventas_pos_terminal ON ventas_pos(terminal_id);
CREATE INDEX idx_ventas_pos_payment_intent ON ventas_pos(payment_intent_id);
```

---

## 🔧 BACKEND

### 1. Service: `mercadoPagoTerminal.service.js`

**Ubicación:** `backend/app/services/mercadoPagoTerminal.service.js`

```javascript
/**
 * Servicio para integración con Mercado Pago Point (Terminal Física)
 * Docs: https://www.mercadopago.com.mx/developers/es/docs/mp-point
 */

const axios = require('axios');
const logger = require('../utils/logger');

class MercadoPagoTerminalService {
    constructor() {
        this.baseURL = 'https://api.mercadopago.com';
        this.accessToken = process.env.MP_ACCESS_TOKEN;
    }

    /**
     * Crear orden de pago en terminal física
     * @param {Object} params
     * @param {number} params.amount - Monto en pesos (ej: 150.50)
     * @param {string} params.description - Descripción de la venta
     * @param {string} params.external_reference - Referencia externa (venta_id)
     * @param {string} params.terminal_id - Device ID del terminal
     * @returns {Promise<Object>}
     */
    async crearOrdenTerminal({ amount, description, external_reference, terminal_id }) {
        try {
            logger.info(`[MP Terminal] Creando orden en terminal ${terminal_id}`, {
                amount,
                external_reference
            });

            const response = await axios.post(
                `${this.baseURL}/point/integration-api/devices/${terminal_id}/payment-intents`,
                {
                    amount,
                    description,
                    external_reference,
                    payment: {
                        installments: 1,
                        type: 'credit_card', // o 'debit_card'
                        installments_cost: 'buyer' // Cliente paga intereses
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Idempotency-Key': `venta-${external_reference}-${Date.now()}`
                    },
                    timeout: 30000 // 30 segundos
                }
            );

            logger.info(`[MP Terminal] Orden creada exitosamente`, {
                payment_intent_id: response.data.id,
                status: response.data.state
            });

            return {
                success: true,
                payment_intent_id: response.data.id,
                status: response.data.state, // 'OPEN', 'PROCESSING', 'FINISHED'
                terminal_metadata: response.data
            };
        } catch (error) {
            logger.error(`[MP Terminal] Error creando orden`, {
                error: error.message,
                response: error.response?.data
            });

            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Consultar estado de pago en terminal
     * @param {string} payment_intent_id - ID del payment intent
     * @returns {Promise<Object>}
     */
    async consultarEstadoPago(payment_intent_id) {
        try {
            const response = await axios.get(
                `${this.baseURL}/point/integration-api/payment-intents/${payment_intent_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            return {
                success: true,
                status: response.data.state,
                payment: response.data.payment
            };
        } catch (error) {
            logger.error(`[MP Terminal] Error consultando estado`, {
                payment_intent_id,
                error: error.message
            });

            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Cancelar pago pendiente en terminal
     * @param {string} payment_intent_id
     * @returns {Promise<Object>}
     */
    async cancelarPago(payment_intent_id) {
        try {
            await axios.delete(
                `${this.baseURL}/point/integration-api/payment-intents/${payment_intent_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            return { success: true };
        } catch (error) {
            logger.error(`[MP Terminal] Error cancelando pago`, {
                payment_intent_id,
                error: error.message
            });

            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

module.exports = new MercadoPagoTerminalService();
```

---

### 2. Service: `clipTerminal.service.js`

**Ubicación:** `backend/app/services/clipTerminal.service.js`

```javascript
/**
 * Servicio para integración con Clip Terminal
 * Docs: https://docs.clip.mx/
 */

const axios = require('axios');
const logger = require('../utils/logger');

class ClipTerminalService {
    constructor() {
        this.baseURL = 'https://api-gw.payclip.com';
        this.apiKey = process.env.CLIP_API_KEY;
    }

    /**
     * Crear transacción de pago
     * @param {Object} params
     * @returns {Promise<Object>}
     */
    async crearTransaccion({ amount, description, external_reference }) {
        try {
            const response = await axios.post(
                `${this.baseURL}/paymentrequest`,
                {
                    amount,
                    currency: 'MXN',
                    purchase_description: description,
                    redirection_url: {
                        success: `${process.env.FRONTEND_URL}/pos/pago-exitoso`,
                        error: `${process.env.FRONTEND_URL}/pos/pago-error`
                    },
                    metadata: {
                        external_reference
                    }
                },
                {
                    headers: {
                        'x-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                transaction_id: response.data.id,
                payment_link: response.data.payment_request_url
            };
        } catch (error) {
            logger.error(`[Clip] Error creando transacción`, {
                error: error.message
            });

            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Consultar estado de transacción
     */
    async consultarTransaccion(transaction_id) {
        try {
            const response = await axios.get(
                `${this.baseURL}/paymentrequest/${transaction_id}`,
                {
                    headers: {
                        'x-api-key': this.apiKey
                    }
                }
            );

            return {
                success: true,
                status: response.data.status, // 'pending', 'paid', 'canceled'
                transaction: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new ClipTerminalService();
```

---

### 3. Controller: `terminal.controller.js`

**Ubicación:** `backend/app/templates/scheduling-saas/controllers/pos/terminal.controller.js`

```javascript
const mercadoPagoTerminalService = require('../../../services/mercadoPagoTerminalService');
const clipTerminalService = require('../../../services/clipTerminalService');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');

class TerminalController {
    /**
     * Listar terminales registrados de la organización
     */
    static listar = asyncHandler(async (req, res) => {
        const { organizacionId } = req.tenant;
        const { activo, proveedor } = req.query;

        let query = db('terminales_pos')
            .where({ organizacion_id: organizacionId });

        if (activo !== undefined) {
            query = query.where({ activo: activo === 'true' });
        }

        if (proveedor) {
            query = query.where({ proveedor });
        }

        const terminales = await query.orderBy('nombre');

        ResponseHelper.success(res, terminales);
    });

    /**
     * Registrar nuevo terminal
     */
    static registrar = asyncHandler(async (req, res) => {
        const { organizacionId } = req.tenant;
        const { nombre, tipo_terminal, proveedor, device_id, ubicacion, configuracion } = req.body;

        const [terminal] = await db('terminales_pos')
            .insert({
                organizacion_id: organizacionId,
                nombre,
                tipo_terminal,
                proveedor,
                device_id,
                ubicacion,
                configuracion
            })
            .returning('*');

        logger.info(`[Terminal] Registrado nuevo terminal`, {
            terminal_id: terminal.id,
            proveedor,
            device_id
        });

        ResponseHelper.created(res, terminal, 'Terminal registrado exitosamente');
    });

    /**
     * Procesar pago con terminal físico
     */
    static procesarPago = asyncHandler(async (req, res) => {
        const { organizacionId } = req.tenant;
        const { venta_id, terminal_id, monto } = req.body;

        // Obtener terminal
        const terminal = await db('terminales_pos')
            .where({
                id: terminal_id,
                organizacion_id: organizacionId,
                activo: true
            })
            .first();

        if (!terminal) {
            return ResponseHelper.badRequest(res, 'Terminal no encontrado o inactivo');
        }

        // Obtener venta
        const venta = await db('ventas_pos')
            .where({
                id: venta_id,
                organizacion_id: organizacionId
            })
            .first();

        if (!venta) {
            return ResponseHelper.notFound(res, 'Venta no encontrada');
        }

        // Procesar según proveedor
        let resultado;
        if (terminal.proveedor === 'mercadopago') {
            resultado = await mercadoPagoTerminalService.crearOrdenTerminal({
                amount: monto,
                description: `Venta ${venta.folio}`,
                external_reference: venta.folio,
                terminal_id: terminal.device_id
            });
        } else if (terminal.proveedor === 'clip') {
            resultado = await clipTerminalService.crearTransaccion({
                amount: monto,
                description: `Venta ${venta.folio}`,
                external_reference: venta.folio
            });
        }

        if (!resultado.success) {
            return ResponseHelper.serverError(res, resultado.error);
        }

        // Actualizar venta con payment_intent_id
        await db('ventas_pos')
            .where({ id: venta_id })
            .update({
                terminal_id: terminal.id,
                payment_intent_id: resultado.payment_intent_id || resultado.transaction_id,
                terminal_metadata: resultado.terminal_metadata || resultado,
                actualizado_en: db.fn.now()
            });

        ResponseHelper.success(res, {
            payment_intent_id: resultado.payment_intent_id || resultado.transaction_id,
            status: resultado.status,
            message: 'Esperando confirmación del terminal...'
        });
    });

    /**
     * Consultar estado de pago en terminal
     */
    static consultarEstado = asyncHandler(async (req, res) => {
        const { payment_intent_id } = req.params;
        const { organizacionId } = req.tenant;

        // Obtener venta
        const venta = await db('ventas_pos')
            .where({
                payment_intent_id,
                organizacion_id: organizacionId
            })
            .first();

        if (!venta) {
            return ResponseHelper.notFound(res, 'Venta no encontrada');
        }

        // Obtener terminal
        const terminal = await db('terminales_pos')
            .where({ id: venta.terminal_id })
            .first();

        // Consultar estado según proveedor
        let resultado;
        if (terminal.proveedor === 'mercadopago') {
            resultado = await mercadoPagoTerminalService.consultarEstadoPago(payment_intent_id);
        } else if (terminal.proveedor === 'clip') {
            resultado = await clipTerminalService.consultarTransaccion(payment_intent_id);
        }

        ResponseHelper.success(res, resultado);
    });
}

module.exports = TerminalController;
```

---

### 4. Routes: `pos.js` (Actualizado)

**Agregar endpoints de terminales:**

```javascript
// TERMINALES
router.get('/terminales',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    asyncHandler(TerminalController.listar)
);

router.post('/terminales/registrar',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['admin', 'propietario']),
    rateLimiting.apiRateLimit,
    validation.validate(posSchemas.registrarTerminal),
    asyncHandler(TerminalController.registrar)
);

router.post('/terminales/procesar-pago',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(posSchemas.procesarPagoTerminal),
    asyncHandler(TerminalController.procesarPago)
);

router.get('/terminales/estado/:payment_intent_id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    asyncHandler(TerminalController.consultarEstado)
);
```

---

### 5. Schemas Joi (Actualizado)

```javascript
// pos.schemas.js

procesarPagoTerminal: {
    body: Joi.object({
        venta_id: Joi.number().integer().positive().required(),
        terminal_id: Joi.number().integer().positive().required(),
        monto: Joi.number().min(0.01).required()
    })
},

registrarTerminal: {
    body: Joi.object({
        nombre: Joi.string().max(100).required(),
        tipo_terminal: Joi.string().valid(
            'mercadopago_point',
            'mercadopago_point_smart',
            'mercadopago_point_plus',
            'clip_plus',
            'clip_pro'
        ).required(),
        proveedor: Joi.string().valid('mercadopago', 'clip').required(),
        device_id: Joi.string().max(255).required(),
        ubicacion: Joi.string().max(100).optional(),
        configuracion: Joi.object().optional()
    })
}
```

---

## 🎨 FRONTEND

### 1. Modal: `TerminalPagoModal.jsx`

**Ubicación:** `frontend/src/components/pos/TerminalPagoModal.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useProcesarPagoTerminal, useConsultarEstadoTerminal } from '../../hooks/usePOS';

export default function TerminalPagoModal({ venta, onClose, onSuccess }) {
    const [terminalSeleccionado, setTerminalSeleccionado] = useState(null);
    const [paymentIntentId, setPaymentIntentId] = useState(null);
    const [estado, setEstado] = useState('idle'); // idle, processing, success, error

    const procesarPagoMutation = useProcesarPagoTerminal();

    // Polling para consultar estado cada 3 segundos
    useEffect(() => {
        if (!paymentIntentId) return;

        const interval = setInterval(async () => {
            try {
                const resultado = await posApi.consultarEstadoTerminal(paymentIntentId);

                if (resultado.status === 'FINISHED' || resultado.status === 'paid') {
                    setEstado('success');
                    clearInterval(interval);
                    setTimeout(() => onSuccess(), 2000);
                } else if (resultado.status === 'CANCELED' || resultado.status === 'ERROR') {
                    setEstado('error');
                    clearInterval(interval);
                }
            } catch (error) {
                console.error('Error consultando estado:', error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [paymentIntentId]);

    const handleProcesarPago = async () => {
        setEstado('processing');

        try {
            const resultado = await procesarPagoMutation.mutateAsync({
                venta_id: venta.id,
                terminal_id: terminalSeleccionado.id,
                monto: venta.total
            });

            setPaymentIntentId(resultado.payment_intent_id);
        } catch (error) {
            setEstado('error');
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Cobrar con Terminal Física</h2>

                {estado === 'idle' && (
                    <>
                        <p>Selecciona el terminal para procesar el pago:</p>
                        <select
                            value={terminalSeleccionado?.id || ''}
                            onChange={(e) => {
                                const terminal = terminales.find(t => t.id === parseInt(e.target.value));
                                setTerminalSeleccionado(terminal);
                            }}
                        >
                            <option value="">-- Seleccionar terminal --</option>
                            {terminales.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.nombre} ({t.ubicacion})
                                </option>
                            ))}
                        </select>

                        <p className="monto">Total a cobrar: ${venta.total.toFixed(2)}</p>

                        <button
                            onClick={handleProcesarPago}
                            disabled={!terminalSeleccionado}
                        >
                            Enviar a Terminal
                        </button>
                    </>
                )}

                {estado === 'processing' && (
                    <div className="processing">
                        <div className="spinner"></div>
                        <p>Esperando pago en terminal...</p>
                        <p className="help-text">El cliente debe pasar su tarjeta en el terminal</p>
                    </div>
                )}

                {estado === 'success' && (
                    <div className="success">
                        <p>✅ Pago procesado exitosamente</p>
                    </div>
                )}

                {estado === 'error' && (
                    <div className="error">
                        <p>❌ Error procesando pago</p>
                        <button onClick={() => setEstado('idle')}>Reintentar</button>
                    </div>
                )}
            </div>
        </div>
    );
}
```

---

### 2. Hook: `usePOS.js` (Actualizado)

```javascript
export function useProcesarPagoTerminal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: posApi.procesarPagoTerminal,
        onSuccess: () => {
            queryClient.invalidateQueries(['ventas']);
        }
    });
}

export function useConsultarEstadoTerminal(paymentIntentId) {
    return useQuery({
        queryKey: ['terminal-estado', paymentIntentId],
        queryFn: () => posApi.consultarEstadoTerminal(paymentIntentId),
        enabled: !!paymentIntentId,
        refetchInterval: 3000 // Poll cada 3 segundos
    });
}

export function useTerminales() {
    return useQuery({
        queryKey: ['terminales'],
        queryFn: posApi.listarTerminales
    });
}
```

---

## 📊 DIAGRAMA DE FLUJO COMPLETO

```
[Cliente solicita pagar $500]
         ↓
[Cajero: "Cobrar" en POS → Selecciona método "Terminal"]
         ↓
[Backend: Crear venta estado=pendiente]
         ↓
[Frontend: Modal "Seleccionar Terminal"]
         ↓
[Cajero selecciona "Terminal Mostrador 1" (MP Point)]
         ↓
[POST /api/v1/pos/terminales/procesar-pago]
    • venta_id: 123
    • terminal_id: 5
    • monto: 500
         ↓
[Backend: mercadoPagoTerminalService.crearOrdenTerminal()]
    • device_id: "PAX_A910_123456"
    • amount: 500
    • description: "Venta POS-2025-0123"
         ↓
[Mercado Pago API: POST /point/integration-api/devices/{device_id}/payment-intents]
         ↓
[Terminal física muestra: "$500.00 MXN - Pasar tarjeta"]
         ↓
[Cliente pasa tarjeta (chip/contactless)]
         ↓
[Terminal procesa pago con Mercado Pago]
         ↓
[Mercado Pago → Webhook: POST /api/v1/webhooks/mercadopago]
    • type: "payment"
    • data.id: payment_id
    • status: "approved"
         ↓
[Backend: Actualizar venta]
    • estado_pago = 'pagado'
    • monto_pagado = 500
    • pago_id = payment_id de MP
         ↓
[Trigger: actualizar_stock_venta_pos()]
    • Descuenta stock de productos
    • Registra movimientos_inventario
         ↓
[Trigger: calcular_comision_cita() - si aplica]
    • Genera comisión para vendedor
         ↓
[Frontend: Polling cada 3s con GET /terminales/estado/{payment_intent_id}]
    • Detecta status = 'FINISHED'
    • Cierra modal
    • Muestra ticket
         ↓
[Frontend: Genera PDF ticket + envía WhatsApp]
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 6.1: Backend (1 semana)

- [ ] **Base de Datos:**
  - [ ] Crear tabla `terminales_pos` con RLS
  - [ ] Agregar columnas a `ventas_pos`
  - [ ] Crear índices

- [ ] **Services:**
  - [ ] `mercadoPagoTerminal.service.js` (3 métodos)
  - [ ] `clipTerminal.service.js` (2 métodos)
  - [ ] Testing con sandbox de MP

- [ ] **Controller:**
  - [ ] `terminal.controller.js` (4 métodos)
  - [ ] Schemas Joi de validación

- [ ] **Routes:**
  - [ ] 4 endpoints de terminales
  - [ ] Middleware stack correcto

- [ ] **Tests:**
  - [ ] Tests unitarios de services (mock APIs)
  - [ ] Tests de endpoints
  - [ ] Tests de integración con webhook

---

### Fase 6.2: Frontend (0.5 semanas)

- [ ] **Componentes:**
  - [ ] `TerminalPagoModal.jsx`
  - [ ] `TerminalesConfigPage.jsx` (configuración admin)
  - [ ] `TerminalCard.jsx` (vista de terminal)

- [ ] **Hooks:**
  - [ ] `useProcesarPagoTerminal()`
  - [ ] `useConsultarEstadoTerminal()`
  - [ ] `useTerminales()`

- [ ] **Integración:**
  - [ ] Agregar botón "Terminal Física" en `MetodoPagoModal`
  - [ ] Polling automático de estado
  - [ ] UI de "Esperando pago..."

---

### Fase 6.3: Testing y Docs (0.5 semanas)

- [ ] Testing con terminal MP Point real
- [ ] Testing con Clip (si disponible)
- [ ] Documentación en `CLAUDE.md`
- [ ] Videos tutoriales para usuarios

---

## 📝 VARIABLES DE ENTORNO REQUERIDAS

```env
# Mercado Pago Terminal
MP_ACCESS_TOKEN=APP_USR-123456-xxxxxx  # Producción
MP_ACCESS_TOKEN_SANDBOX=TEST-123456-xxxxxx  # Testing

# Clip
CLIP_API_KEY=sk_live_xxxxxx  # Producción
CLIP_API_KEY_SANDBOX=sk_test_xxxxxx  # Testing
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Completar MVP de Inventario y POS (sin terminales)
2. ⏳ Evaluar demanda de clientes por terminales físicas
3. 📊 Analizar costo/beneficio de integración
4. 🔧 Si hay demanda: Implementar Fase 6 (1-2 semanas)
5. 📱 Considerar: App móvil nativa para control directo de Clip

---

**Fin del documento**
