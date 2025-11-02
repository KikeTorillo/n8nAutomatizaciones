# Scripts de Backend

## 📋 sync-plans-to-mercadopago.js

Script para sincronizar planes de suscripción locales con Mercado Pago API.

### 🎯 ¿Cuándo usarlo?

1. **Primera vez** - Después de crear planes locales, sincronízalos con MP
2. **Cambio de precio** - Cuando actualices precios en tu BD
3. **Nuevos planes** - Cuando agregues un plan nuevo

### 🚀 Uso

#### 1. Crear planes nuevos (primera vez)

```bash
# Desde el contenedor
docker exec back node scripts/sync-plans-to-mercadopago.js

# O desde tu máquina local
cd backend/app
node scripts/sync-plans-to-mercadopago.js
```

**Qué hace:**
- Busca planes con `mp_plan_id IS NULL`
- Crea cada plan en Mercado Pago
- Guarda el `mp_plan_id` en tu BD

#### 2. Ver qué cambiaría (sin aplicar)

```bash
docker exec back node scripts/sync-plans-to-mercadopago.js --dry-run
```

**Útil para:**
- Ver qué planes se sincronizarían
- Testing seguro (no hace cambios reales)

#### 3. Actualizar precios existentes

```bash
docker exec back node scripts/sync-plans-to-mercadopago.js --update
```

**Qué hace:**
- Compara precios locales vs Mercado Pago
- Detecta cambios
- ⚠️ **NOTA**: MP no permite actualizar precios directamente

#### 4. Recrear planes (cuando cambió el precio)

```bash
docker exec back node scripts/sync-plans-to-mercadopago.js --force
```

**Qué hace:**
- Crea nuevos planes en MP con los datos actualizados
- Actualiza `mp_plan_id` en tu BD
- ⚠️ **IMPORTANTE**: Deberás migrar suscripciones activas al nuevo plan

### 📊 Ejemplo de Flujo Completo

```bash
# 1. Crear planes iniciales en tu BD (desde psql o API)
INSERT INTO planes_subscripcion (codigo_plan, nombre_plan, precio_mensual, activo)
VALUES
  ('basico', 'Plan Básico', 299, true),
  ('profesional', 'Plan Profesional', 599, true),
  ('custom', 'Plan Custom', 999, true);

# 2. Sincronizar con MP (primera vez)
docker exec back node scripts/sync-plans-to-mercadopago.js

# Resultado: ✅ 3 planes creados en MP, mp_plan_id guardados

# ===============================================
# Tiempo después... necesitas cambiar precios
# ===============================================

# 3. Actualizar precio en tu BD
UPDATE planes_subscripcion
SET precio_mensual = 349
WHERE codigo_plan = 'basico';

# 4. Ver qué cambió (dry run)
docker exec back node scripts/sync-plans-to-mercadopago.js --update --dry-run

# 5. Recrear plan con nuevo precio
docker exec back node scripts/sync-plans-to-mercadopago.js --force

# 6. Migrar suscripciones activas al nuevo plan (manual o con otro script)
```

### ⚠️ Limitaciones de Mercado Pago

**No se puede actualizar precio de plan existente:**
- Mercado Pago no permite modificar `transaction_amount` de un plan activo
- Solución: Crear nuevo plan y migrar suscripciones

**Planes con suscripciones activas:**
- Antes de usar `--force`, verifica que no haya suscripciones activas
- O prepara un script de migración

### 🎨 Salida del Script

```bash
╔═══════════════════════════════════════════════════╗
║  SINCRONIZACIÓN DE PLANES CON MERCADO PAGO       ║
╚═══════════════════════════════════════════════════╝

═══════════════════════════════════════════════════
📋 MODO: CREAR PLANES NUEVOS
═══════════════════════════════════════════════════

Encontrados 3 plan(es) sin sincronizar:
  • Plan Básico ($299/mes)
  • Plan Profesional ($599/mes)
  • Plan Custom ($999/mes)

📋 Procesando: Plan Básico
   Código: basico
   Precio: $299 MXN/mes
   ✅ Creado en MP con ID: 2c938084726fca480172750000000001
   ✅ mp_plan_id actualizado en BD local

📋 Procesando: Plan Profesional
   Código: profesional
   Precio: $599 MXN/mes
   ✅ Creado en MP con ID: 2c938084726fca480172750000000002
   ✅ mp_plan_id actualizado en BD local

📋 Procesando: Plan Custom
   Código: custom
   Precio: $999 MXN/mes
   ✅ Creado en MP con ID: 2c938084726fca480172750000000003
   ✅ mp_plan_id actualizado en BD local

═══════════════════════════════════════════════════
📊 RESUMEN
═══════════════════════════════════════════════════
✅ Exitosos: 3
```

### 🐛 Troubleshooting

**Error: "Cannot find module 'mercadopago'"**
```bash
# Instalar dependencias primero
docker exec back npm install
```

**Error: "Invalid access token"**
```bash
# Verificar variables de entorno
docker exec back printenv | grep MERCADOPAGO
```

**Error: "mp_plan_id actualizado pero no aparece"**
```bash
# Verificar en BD
docker exec postgres_db psql -U admin -d postgres -c "SELECT codigo_plan, nombre_plan, mp_plan_id FROM planes_subscripcion;"
```

### 💡 Tips

1. **Siempre usa --dry-run primero** para ver qué cambiará
2. **Haz backup de BD** antes de usar --force
3. **Documenta mp_plan_id** para referencia futura
4. **Prueba en sandbox** antes de producción

### 📚 Ver Ayuda

```bash
docker exec back node scripts/sync-plans-to-mercadopago.js --help
```

---

## 🚀 PLAN DE MEJORA: Auto-sincronización (Pendiente de Implementación)

### 🎯 Objetivo
Integrar la sincronización automáticamente al flujo de desarrollo para que no se requiera ejecución manual cada vez que se reinicia el proyecto.

### ⭐ Solución Recomendada: Auto-sincronización + Endpoint Manual

---

### **Parte 1: Auto-sincronización al inicio del backend**

**Archivo a modificar:** `backend/app/app.js`

**Código a agregar** (al final del archivo, antes del `module.exports`):

```javascript
/**
 * Sincronización automática de planes con Mercado Pago
 * Se ejecuta en background 5 segundos después del inicio del servidor
 * Solo en entornos de desarrollo y producción (no en tests)
 */
if (require.main === module && process.env.NODE_ENV !== 'test') {
  setTimeout(async () => {
    try {
      const { exec } = require('child_process');
      const scriptPath = require('path').join(__dirname, 'scripts', 'sync-plans-to-mercadopago.js');

      logger.info('Iniciando sincronización automática de planes con Mercado Pago...');

      exec(`node ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
          logger.warn('Error en sincronización automática de planes:', {
            error: error.message,
            stderr
          });
        } else {
          logger.info('✅ Sincronización automática de planes completada');
          if (stdout) {
            logger.debug('Output de sincronización:', { stdout });
          }
        }
      });
    } catch (error) {
      logger.warn('No se pudo ejecutar sincronización automática de planes:', {
        error: error.message
      });
    }
  }, 5000); // Esperar 5 segundos para que el servidor esté completamente inicializado
}
```

**Beneficios:**
- ✅ Automático cada vez que inicia el backend
- ✅ No bloquea el inicio del servidor (se ejecuta en background)
- ✅ El script es idempotente (solo sincroniza lo que falta)
- ✅ Logs claros en caso de error
- ✅ No afecta los tests

---

### **Parte 2: Endpoint manual para super_admin (Opcional)**

**Archivo a crear:** `backend/app/routes/api/v1/sync.js`

```javascript
const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');
const { exec } = require('child_process');
const path = require('path');

/**
 * POST /api/v1/sync/plans
 * Sincronizar planes con Mercado Pago (solo super_admin)
 */
router.post('/plans',
  auth.authenticateToken,
  auth.requireRole(['super_admin']),
  async (req, res) => {
    try {
      const scriptPath = path.join(__dirname, '../../../scripts', 'sync-plans-to-mercadopago.js');

      logger.info('Sincronización manual de planes iniciada por super_admin', {
        userId: req.user.id,
        email: req.user.email
      });

      exec(`node ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
          logger.error('Error sincronizando planes:', {
            error: error.message,
            stderr
          });
          return ResponseHelper.error(res, `Error: ${error.message}`, 500);
        }

        logger.info('✅ Sincronización manual completada', {
          userId: req.user.id
        });

        return ResponseHelper.success(res, {
          message: 'Sincronización completada',
          output: stdout
        });
      });
    } catch (error) {
      logger.error('Error ejecutando script de sincronización:', {
        error: error.message
      });
      return ResponseHelper.error(res, 'Error ejecutando sincronización', 500);
    }
  }
);

module.exports = router;
```

**Archivo a modificar:** `backend/app/routes/api/v1/index.js`

Agregar:
```javascript
const syncRouter = require('./sync');
// ...
router.use('/sync', syncRouter);
```

**Uso:**
```bash
# Desde el frontend o Postman (como super_admin)
POST /api/v1/sync/plans
Authorization: Bearer <super_admin_token>
```

---

### 📝 Checklist de Implementación

#### Fase 1: Auto-sincronización (Desarrollo)
- [ ] Modificar `backend/app/app.js` con el código de auto-sincronización
- [ ] Reiniciar backend: `docker restart back`
- [ ] Verificar logs: `docker logs back --tail 50`
- [ ] Buscar mensaje: `✅ Sincronización automática de planes completada`
- [ ] Verificar planes en BD: `docker exec postgres_db psql -U saas_app -d postgres -c "SELECT id, codigo_plan, mp_plan_id FROM planes_subscripcion;"`

#### Fase 2: Endpoint Manual (Opcional - Producción)
- [ ] Crear `backend/app/routes/api/v1/sync.js`
- [ ] Agregar ruta en `backend/app/routes/api/v1/index.js`
- [ ] Probar endpoint como super_admin
- [ ] Documentar en API docs

---

### 🔍 Verificación Post-Implementación

#### Verificar que los planes están sincronizados:
```bash
docker exec postgres_db psql -U saas_app -d postgres -c \
  "SELECT id, codigo_plan, nombre_plan, precio_mensual, mp_plan_id FROM planes_subscripcion ORDER BY id;"
```

**Resultado esperado:**
```
 id | codigo_plan |    nombre_plan     | precio_mensual |           mp_plan_id
----+-------------+--------------------+----------------+--------------------------------
  1 | trial       | Plan de Prueba     |           0.00 | NULL (esperado - plan gratuito)
  2 | basico      | Plan Básico        |         299.00 | 86248549db6548a7ba7923297a2c9ce3
  3 | profesional | Plan Professional  |         599.00 | 0820b6a0db62465cae7606feeb8d7202
  4 | custom      | Plan Personalizado |           0.00 | NULL (esperado - plan gratuito)
```

---

### ⚠️ Notas Importantes

1. **Planes gratuitos ($0):** Mercado Pago NO acepta planes con precio $0. Los planes `trial` y `custom` nunca tendrán `mp_plan_id` y eso es correcto.

2. **Idempotencia:** El script solo crea planes que NO tienen `mp_plan_id`, por lo que es seguro ejecutarlo múltiples veces.

3. **Ambiente:** El script usa las credenciales de `.env.dev` (sandbox en desarrollo).

4. **Tiempo de espera:** La auto-sincronización espera 5 segundos para no bloquear el inicio del servidor.

5. **Producción:** En producción, considera usar el endpoint manual en lugar de auto-sincronización para tener mayor control.

---

### 🐛 Troubleshooting Auto-sincronización

#### Script no se ejecuta automáticamente
**Verificar:**
1. Que el código esté en `app.js` antes de `module.exports`
2. Que `NODE_ENV !== 'test'`
3. Revisar logs: `docker logs back | grep "Sincronización"`
4. Verificar que el path del script sea correcto

#### Error: "Cannot find module 'child_process'"
**Solución:** `child_process` es módulo nativo de Node.js, no requiere instalación

#### Script se ejecuta pero no sincroniza
**Verificar:**
1. Variables de entorno de Mercado Pago: `docker exec back printenv | grep MERCADOPAGO`
2. Que existan planes sin `mp_plan_id`: `SELECT * FROM planes_subscripcion WHERE mp_plan_id IS NULL;`

---

### 📚 Referencias

- **Controller de suscripciones:** `backend/app/controllers/subscripciones.controller.js`
- **Servicio Mercado Pago:** `backend/app/services/mercadopago.service.js`
- **Documentación MP:** https://www.mercadopago.com.mx/developers/es/docs/subscriptions/integration-configuration/subscription-creation

---

**Estado:** ✅ FASE 1 IMPLEMENTADA - Auto-sincronización en desarrollo
**Última actualización:** 2 de Noviembre 2025
**Prioridad:** Media (mejora de DX - Developer Experience)

---

## ✅ FASE 1 IMPLEMENTADA: Auto-sincronización en Desarrollo

### Archivos Modificados
1. **`.env`** y **`.env.dev`** - Variable `AUTO_SYNC_PLANS=true`
2. **`docker-compose.dev.yml`** - Variable agregada al servicio backend
3. **`backend/app/app.js`** - Lógica de auto-sincronización (líneas 394-430)

### Verificación Post-Implementación

**1. Verificar variable en contenedor:**
```bash
docker exec back printenv | grep AUTO_SYNC_PLANS
# Salida esperada: AUTO_SYNC_PLANS=true
```

**2. Verificar logs de sincronización:**
```bash
docker logs back --tail 50 | grep "Sincronización"
# Salida esperada:
# 🔄 Iniciando sincronización automática de planes con Mercado Pago...
# ✅ Sincronización automática de planes completada
```

**3. Verificar planes sincronizados:**
```bash
docker exec postgres_db psql -U saas_app -d postgres -c \
  "SELECT codigo_plan, precio_mensual, mp_plan_id IS NOT NULL as sincronizado
   FROM planes_subscripcion ORDER BY id;"
```

**Resultado esperado:**
```
 codigo_plan | precio_mensual | sincronizado
-------------+----------------+--------------
 trial       |           0.00 | f            ← Correcto (MP no acepta $0)
 basico      |         299.00 | t            ← Sincronizado ✅
 profesional |         599.00 | t            ← Sincronizado ✅
 custom      |           0.00 | f            ← Correcto (MP no acepta $0)
```

### Notas Importantes

⚠️ **Errores esperados en logs:**
Los planes con precio $0 (trial, custom) generarán errores al intentar sincronizar:
```
❌ Error creando en MP: Invalid value for transaction amount, must be a positive number
```
**Esto es CORRECTO** - Mercado Pago no permite planes gratuitos.

✅ **Auto-sincronización solo en desarrollo:**
La sincronización automática solo se ejecuta cuando `AUTO_SYNC_PLANS=true`. En producción, configurar `AUTO_SYNC_PLANS=false` y usar FASE 2 (endpoint manual).

---

## 📋 FASE 2 PENDIENTE: Endpoint Manual para Super Admin

Para implementar el endpoint manual `/api/v1/sync/plans` para producción, seguir las instrucciones en las líneas 242-316 de este README.
