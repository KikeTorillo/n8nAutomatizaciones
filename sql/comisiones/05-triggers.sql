-- ====================================================================
-- 💵 MÓDULO COMISIONES - TRIGGERS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 17 Noviembre 2025
-- Módulo: comisiones
--
-- DESCRIPCIÓN:
-- Triggers automáticos para cálculo de comisiones, auditoría de cambios
-- y actualización de timestamps.
--
-- TRIGGERS (5 total):
-- • Tabla citas: 1 trigger (calcular comisión al completar)
-- • Tabla configuracion_comisiones: 3 triggers (auditoría + timestamps)
-- • Tabla comisiones_profesionales: 1 trigger (timestamps)
--
-- CARACTERÍSTICAS:
-- • Cálculo 100% automático: Comisión se genera al completar cita
-- • Auditoría completa: Registra INSERT/UPDATE/DELETE en configuración
-- • Anti-duplicados: Validación de existencia antes de insertar
-- • Bypass RLS: Operaciones de sistema con set_config('app.bypass_rls', 'true')
--
-- ====================================================================

-- ====================================================================
-- TRIGGER 1: Calcular comisión automáticamente al completar cita
-- ====================================================================
-- Tabla: citas
-- Evento: AFTER UPDATE OF estado
-- Condición: NEW.estado = 'completada' AND OLD.estado != 'completada'
-- Función: calcular_comision_cita()
--
-- FUNCIONAMIENTO:
-- Cuando una cita cambia a estado 'completada', el trigger:
-- 1. Obtiene servicios de la cita desde citas_servicios
-- 2. Para cada servicio, busca configuración de comisión (específica o global)
-- 3. Calcula comisión según tipo (porcentaje o monto fijo)
-- 4. Genera detalle JSONB con breakdown por servicio
-- 5. Inserta en comisiones_profesionales con estado 'pendiente'
--
-- ANTI-DUPLICADOS:
-- La función valida con EXISTS antes de insertar (previene duplicados).
-- ====================================================================

CREATE TRIGGER trigger_calcular_comision_cita
    AFTER UPDATE OF estado ON citas
    FOR EACH ROW
    WHEN (NEW.estado = 'completada' AND OLD.estado != 'completada')
    EXECUTE FUNCTION calcular_comision_cita();

COMMENT ON TRIGGER trigger_calcular_comision_cita ON citas IS
'Calcula comisión automáticamente cuando una cita se completa.
Ejecuta función calcular_comision_cita() que:
1. Obtiene servicios de la cita
2. Para cada servicio, busca configuración (específica o global)
3. Calcula comisión según tipo (% o monto fijo)
4. Registra en comisiones_profesionales con detalle JSONB
5. Estado inicial: pendiente

Características:
- Anti-duplicados: EXISTS valida antes de insertar
- Bypass RLS: Operación de sistema
- Performance: O(n) donde n = cantidad de servicios
- Índices usados: idx_config_comisiones_prof, idx_config_comisiones_serv, idx_comisiones_cita';

-- ====================================================================
-- TRIGGER 2: Auditoría de cambios en configuración (INSERT/UPDATE)
-- ====================================================================
-- Tabla: configuracion_comisiones
-- Evento: AFTER INSERT OR UPDATE
-- Función: auditoria_configuracion_comisiones()
--
-- REGISTRA:
-- • INSERT: Valores nuevos (tipo, valor, activo)
-- • UPDATE: Valores anteriores y nuevos
-- ====================================================================

CREATE TRIGGER trigger_auditoria_configuracion_comisiones_after
    AFTER INSERT OR UPDATE ON configuracion_comisiones
    FOR EACH ROW
    EXECUTE FUNCTION auditoria_configuracion_comisiones();

COMMENT ON TRIGGER trigger_auditoria_configuracion_comisiones_after ON configuracion_comisiones IS
'Registra INSERT y UPDATE en historial_configuracion_comisiones para auditoría.
Permite rastrear cambios en configuración de comisiones:
- Quién modificó (modificado_por)
- Cuándo se modificó (modificado_en)
- Qué cambió (valores anteriores vs nuevos)

Bypass RLS: Inserción automática de sistema en tabla historial';

-- ====================================================================
-- TRIGGER 3: Auditoría de cambios en configuración (DELETE)
-- ====================================================================
-- Tabla: configuracion_comisiones
-- Evento: BEFORE DELETE
-- Función: auditoria_configuracion_comisiones()
--
-- NOTA: BEFORE DELETE en lugar de AFTER DELETE para evitar problemas
-- con CASCADE. Si usamos AFTER, el registro ya fue eliminado y no
-- podemos obtener los valores anteriores.
-- ====================================================================

CREATE TRIGGER trigger_auditoria_configuracion_comisiones_before
    BEFORE DELETE ON configuracion_comisiones
    FOR EACH ROW
    EXECUTE FUNCTION auditoria_configuracion_comisiones();

COMMENT ON TRIGGER trigger_auditoria_configuracion_comisiones_before ON configuracion_comisiones IS
'Registra DELETE en historial_configuracion_comisiones ANTES de ejecutar CASCADE.
Timing: BEFORE DELETE permite capturar valores antes de eliminar registro.
Alternativa: AFTER DELETE fallaría porque el registro ya no existe.

Registra:
- Valores anteriores (tipo_comision, valor_comision, activo)
- Usuario que eliminó
- Timestamp de eliminación';

-- ====================================================================
-- TRIGGER 4: Actualizar timestamp automáticamente (configuracion_comisiones)
-- ====================================================================
-- Tabla: configuracion_comisiones
-- Evento: BEFORE UPDATE
-- Función: actualizar_timestamp() (función global del módulo núcleo)
-- ====================================================================

CREATE TRIGGER trigger_actualizar_timestamp_configuracion_comisiones
    BEFORE UPDATE ON configuracion_comisiones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON TRIGGER trigger_actualizar_timestamp_configuracion_comisiones ON configuracion_comisiones IS
'Actualiza automáticamente actualizado_en usando función actualizar_timestamp().
Función global: Definida en módulo núcleo (nucleo/03-funciones.sql)
Ejecución: BEFORE UPDATE en cada modificación

Permite rastrear última modificación de cada configuración';

-- ====================================================================
-- TRIGGER 5: Actualizar timestamp automáticamente (comisiones_profesionales)
-- ====================================================================
-- Tabla: comisiones_profesionales
-- Evento: BEFORE UPDATE
-- Función: actualizar_timestamp() (función global del módulo núcleo)
-- ====================================================================

CREATE TRIGGER trigger_actualizar_timestamp_comisiones_profesionales
    BEFORE UPDATE ON comisiones_profesionales
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON TRIGGER trigger_actualizar_timestamp_comisiones_profesionales ON comisiones_profesionales IS
'Actualiza automáticamente actualizado_en usando función actualizar_timestamp().
Función global: Definida en módulo núcleo (nucleo/03-funciones.sql)
Ejecución: BEFORE UPDATE en cada modificación

Uso típico:
- Marcar comisión como pagada (estado_pago → pagada)
- Actualizar metodo_pago, referencia_pago, notas_pago
- Auditoría de cambios con timestamp preciso';

-- ====================================================================
-- 📊 RESUMEN DE TRIGGERS
-- ====================================================================
-- TOTAL: 5 triggers automáticos
--
-- Tabla citas (1):
-- └── trigger_calcular_comision_cita
--     ├── Evento: AFTER UPDATE OF estado
--     ├── Condición: NEW.estado = 'completada' AND OLD.estado != 'completada'
--     ├── Función: calcular_comision_cita()
--     └── Propósito: Cálculo automático de comisión al completar cita
--
-- Tabla configuracion_comisiones (3):
-- ├── trigger_auditoria_configuracion_comisiones_after
-- │   ├── Evento: AFTER INSERT OR UPDATE
-- │   ├── Función: auditoria_configuracion_comisiones()
-- │   └── Propósito: Auditoría de INSERT/UPDATE
-- ├── trigger_auditoria_configuracion_comisiones_before
-- │   ├── Evento: BEFORE DELETE
-- │   ├── Función: auditoria_configuracion_comisiones()
-- │   └── Propósito: Auditoría de DELETE (antes de CASCADE)
-- └── trigger_actualizar_timestamp_configuracion_comisiones
--     ├── Evento: BEFORE UPDATE
--     ├── Función: actualizar_timestamp() (global)
--     └── Propósito: Actualizar actualizado_en automáticamente
--
-- Tabla comisiones_profesionales (1):
-- └── trigger_actualizar_timestamp_comisiones_profesionales
--     ├── Evento: BEFORE UPDATE
--     ├── Función: actualizar_timestamp() (global)
--     └── Propósito: Actualizar actualizado_en automáticamente
--
-- DEPENDENCIAS:
-- • Funciones locales: calcular_comision_cita(), auditoria_configuracion_comisiones()
-- • Funciones globales: actualizar_timestamp() (módulo núcleo)
--
-- ====================================================================
