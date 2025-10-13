# 🔒 Guía de Helpers RLS - Separación de Responsabilidades

**Versión**: 2.0.0
**Fecha**: Octubre 2025
**Autor**: Backend Team

---

## 📖 Resumen Ejecutivo

Este documento clarifica la **separación de responsabilidades** entre `RLSContextManager` y `RLSHelper` para evitar confusión y código redundante.

---

## 🎯 División de Responsabilidades

### **RLSContextManager** - Gestión Completa (Alto Nivel)

**Propósito**: Gestión automática completa de RLS para operaciones típicas de modelos.

**Características**:
- ✅ Adquiere/libera conexiones del pool automáticamente
- ✅ Maneja transacciones (BEGIN/COMMIT/ROLLBACK)
- ✅ Configura `current_tenant_id` para multi-tenancy
- ✅ Limpia variables RLS antes/después
- ✅ Garantiza cleanup en TODOS los casos (incluso errores)

**Usar para**:
- ✅ Operaciones CRUD típicas (80% de casos)
- ✅ Queries con aislamiento por `organizacion_id`
- ✅ Bypass RLS con gestión automática
- ✅ Patrón limpio sin manejo manual de conexiones

**Métodos principales**:
```javascript
RLSContextManager.query(organizacionId, callback)          // Sin transacción
RLSContextManager.transaction(organizacionId, callback)    // Con transacción
RLSContextManager.withBypass(callback, options)           // Bypass con gestión completa
RLSContextManager.withRLS(orgId, callback, options)       // Método base flexible
```

---

### **RLSHelper** - Control Manual Fino (Bajo Nivel)

**Propósito**: Control fino de variables RLS para casos específicos.

**Características**:
- ❌ NO adquiere conexiones (debes pasarla)
- ❌ NO maneja transacciones automáticas
- ✅ Configura `current_user_id`, `current_user_role`
- ✅ Método `registrarEvento()` para auditoría
- ✅ Más flexible para transacciones complejas

**Usar para**:
- ✅ Configurar `current_user_id` o `current_user_role`
- ✅ Login/autenticación con `withRole('login_context')`
- ✅ Ya tienes conexión `db` y transacción manual compleja
- ✅ Registrar eventos de auditoría
- ✅ Operaciones que requieren múltiples contextos RLS

**Métodos principales**:
```javascript
RLSHelper.withContext(db, context, callback)      // Método base flexible
RLSHelper.withRole(db, role, callback)            // Para login_context, super_admin
RLSHelper.withSelfAccess(db, userId, callback)    // Acceso propio usuario
RLSHelper.configurarContexto(db, userId, role, orgId) // Configuración manual
RLSHelper.registrarEvento(db, eventoData)         // Auditoría
RLSHelper.withBypass(db, callback)                // ⚠️ DEPRECATED - Usar RLSContextManager.withBypass()
```

---

## 📊 Comparativa Detallada

| Feature | RLSContextManager | RLSHelper |
|---------|-------------------|-----------|
| **Maneja conexiones** | ✅ Automático | ❌ Manual |
| **Maneja transacciones** | ✅ BEGIN/COMMIT/ROLLBACK | ❌ Manual |
| **Configura `current_tenant_id`** | ✅ Principal | 🟡 Opcional |
| **Configura `current_user_id`** | ❌ No | ✅ Sí |
| **Configura `current_user_role`** | ❌ No | ✅ Sí |
| **Bypass RLS** | ✅ Con gestión completa | ⚠️ Deprecated |
| **Auditoría (`registrarEvento`)** | ❌ No | ✅ Sí |
| **Nivel de abstracción** | Alto (simple) | Bajo (flexible) |
| **Casos de uso** | 80% | 20% |

---

## 💻 Ejemplos de Uso

### ✅ RLSContextManager - Query Simple

```javascript
// Patrón típico para operaciones CRUD
static async buscarPorIdConRLS(id, organizacionId) {
    return await RLSContextManager.query(organizacionId, async (db) => {
        const query = `
            SELECT * FROM usuarios
            WHERE id = $1 AND activo = TRUE
        `;
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    });
}
```

### ✅ RLSContextManager - Con Transacción

```javascript
static async actualizarPerfil(userId, datos, organizacionId) {
    return await RLSContextManager.transaction(organizacionId, async (db) => {
        const query = `
            UPDATE usuarios
            SET nombre = $1, apellidos = $2, actualizado_en = NOW()
            WHERE id = $3
            RETURNING *
        `;
        const result = await db.query(query, [datos.nombre, datos.apellidos, userId]);
        return result.rows[0];
    });
}
```

### ✅ RLSContextManager - Bypass RLS

```javascript
static async obtenerEstadisticasGlobales() {
    // Gestión completa de conexión + transacción + bypass
    return await RLSContextManager.withBypass(async (db) => {
        const query = `
            SELECT COUNT(*) as total_usuarios,
                   COUNT(DISTINCT organizacion_id) as total_orgs
            FROM usuarios
        `;
        const result = await db.query(query);
        return result.rows[0];
    }, { useTransaction: false });
}
```

### ✅ RLSHelper - Login/Autenticación

```javascript
// Caso específico: necesitas withRole('login_context')
static async buscarPorEmail(email) {
    const db = await getDb();
    try {
        return await RLSHelper.withRole(db, 'login_context', async (db) => {
            const query = `
                SELECT id, email, password_hash, rol, organizacion_id
                FROM usuarios
                WHERE email = $1 AND activo = TRUE
            `;
            const result = await db.query(query, [email]);
            return result.rows[0] || null;
        });
    } finally {
        db.release();
    }
}
```

### ✅ RLSHelper - Transacción Compleja con Auditoría

```javascript
static async cambiarRol(userId, nuevoRol, orgId, adminId) {
    const db = await getDb();
    try {
        await db.query('BEGIN');

        // Bypass para operación compleja
        const resultado = await RLSHelper.withContext(db, { bypass: true }, async (db) => {
            // Validaciones y lógica compleja...
            const query = `
                UPDATE usuarios SET rol = $1, actualizado_en = NOW()
                WHERE id = $2 AND organizacion_id = $3
                RETURNING *
            `;
            const result = await db.query(query, [nuevoRol, userId, orgId]);
            return result.rows[0];
        });

        // Registrar auditoría en la MISMA transacción
        await RLSHelper.registrarEvento(db, {
            organizacion_id: orgId,
            evento_tipo: 'usuario_rol_cambiado',
            entidad_tipo: 'usuario',
            entidad_id: userId,
            descripcion: `Rol cambiado a ${nuevoRol}`,
            metadatos: { rol_nuevo: nuevoRol, admin_id: adminId },
            usuario_id: adminId
        });

        await db.query('COMMIT');
        return resultado;
    } catch (error) {
        await db.query('ROLLBACK');
        throw error;
    } finally {
        db.release();
    }
}
```

---

## ⚠️ Método Deprecated

### `RLSHelper.withBypass()` - DEPRECATED

**Estado**: Marcado como deprecated en v2.0.0

**Razón**: `RLSContextManager.withBypass()` hace lo mismo pero con gestión completa de conexiones.

**Migración**:

```javascript
// ❌ Patrón viejo (solo si ya tienes db + transacción manual)
const db = await getDb();
try {
    await db.query('BEGIN');
    const result = await RLSHelper.withBypass(db, async (db) => {
        return await db.query('SELECT ...');
    });
    await db.query('COMMIT');
} finally {
    db.release();
}

// ✅ Patrón nuevo (preferido)
const result = await RLSContextManager.withBypass(async (db) => {
    return await db.query('SELECT ...');
}, { useTransaction: true });
```

**Nota**: Si tu método ya tiene transacción manual compleja y necesita `registrarEvento()`, puedes seguir usando `RLSHelper.withContext()` directamente.

---

## 📋 Checklist para Elegir el Helper Correcto

### ¿Qué Helper Debo Usar?

**Usa RLSContextManager si**:
- [ ] Es una operación CRUD típica (SELECT, INSERT, UPDATE, DELETE)
- [ ] Solo necesitas aislamiento por `organizacion_id`
- [ ] No necesitas configurar `current_user_id` o `current_user_role`
- [ ] Prefieres gestión automática de conexiones
- [ ] El método no existe aún (nuevo código)

**Usa RLSHelper si**:
- [ ] Necesitas configurar `current_user_id` o `current_user_role`
- [ ] Operación de login/autenticación
- [ ] Ya tienes una transacción manual compleja
- [ ] Necesitas registrar eventos de auditoría
- [ ] Requieres múltiples contextos RLS en la misma transacción
- [ ] Código legacy que aún no se ha refactorizado

---

## 🎓 Mejores Prácticas

### 1. **Patrón Preferido: RLSContextManager**

Para nuevos métodos de modelos, preferir:

```javascript
// ✅ CORRECTO
static async listarPorOrganizacion(organizacionId, filtros) {
    return await RLSContextManager.query(organizacionId, async (db) => {
        const query = `SELECT * FROM tabla WHERE activo = TRUE`;
        const result = await db.query(query);
        return result.rows;
    });
}
```

### 2. **RLSHelper Solo para Casos Específicos**

```javascript
// ✅ CORRECTO - Login requiere role='login_context'
static async buscarPorEmail(email) {
    const db = await getDb();
    try {
        return await RLSHelper.withRole(db, 'login_context', async (db) => {
            // ...
        });
    } finally {
        db.release();
    }
}
```

### 3. **Evitar Mezclado de Helpers**

```javascript
// ❌ INCORRECTO - Mezclando ambos sin necesidad
return await RLSContextManager.transaction(orgId, async (db) => {
    await RLSHelper.withBypass(db, async (db) => { // Redundante
        // ...
    });
});

// ✅ CORRECTO - Usar solo RLSContextManager
return await RLSContextManager.withBypass(async (db) => {
    // ...
}, { useTransaction: true });
```

---

## 🔄 Migración Gradual

**No es necesario** migrar todo el código legacy de inmediato. El deprecation warning ayudará a identificar nuevos usos.

**Prioridad de migración**:
1. 🔴 **Alta**: Nuevos métodos → Usar RLSContextManager
2. 🟡 **Media**: Métodos simples con solo bypass → Migrar cuando sea conveniente
3. 🟢 **Baja**: Métodos complejos con transacciones manuales + auditoría → Dejar con RLSHelper

---

## 📚 Referencias

- **RLSContextManager**: `/backend/app/utils/rlsContextManager.js`
- **RLSHelper**: `/backend/app/utils/rlsHelper.js`
- **Ejemplo de uso**: `/backend/app/database/usuario.model.js`
- **Políticas RLS**: `/sql/schema/08-rls-policies.sql`
- **Documentación proyecto**: `/CLAUDE.md`

---

## ✅ Resumen

| Aspecto | RLSContextManager | RLSHelper |
|---------|------------------|-----------|
| **Propósito** | Gestión completa automática | Control fino manual |
| **Nivel** | Alto (80% casos) | Bajo (20% casos) |
| **Gestión** | Conexiones + Transacciones | Solo variables RLS |
| **Casos** | CRUD típico | Login, auditoría, casos específicos |
| **Nuevo código** | ✅ Preferido | Solo si es necesario |

---

**Última actualización**: Octubre 2025
**Versión del sistema**: 454/454 tests pasando ✅
