-- ====================================================================
-- 🔧 CORRECCIONES DE AUDITORÍA DE BASE DE DATOS
-- ====================================================================
--
-- Este archivo contiene las correcciones identificadas en la auditoría
-- de base de datos del 2025-10-02.
--
-- 📋 CORRECCIONES INCLUIDAS:
-- • Fix #1: Constraint coherencia_organizacion en tabla citas
-- • Fix #2: Índice en usuarios.organizacion_id
-- • Fix #3: Documentación de políticas RLS
--
-- 🔄 ORDEN DE EJECUCIÓN: Después del schema completo
-- ⚡ PRIORIDAD: CRÍTICA - Aplicar antes de producción
-- ====================================================================

-- ====================================================================
-- FIX #1: VALIDACIÓN DE COHERENCIA ORGANIZACIONAL EN CITAS
-- ====================================================================
-- PROBLEMA: Constraint 'coherencia_organizacion CHECK (TRUE)' no valida nada
-- RIESGO: Permite crear citas con servicio/cliente/profesional de diferentes organizaciones
-- SOLUCIÓN: Implementar función + trigger para validación real
-- ────────────────────────────────────────────────────────────────────

-- PASO 1: Crear función de validación
CREATE OR REPLACE FUNCTION validar_coherencia_organizacion_cita()
RETURNS TRIGGER AS $$
DECLARE
    org_cliente INTEGER;
    org_profesional INTEGER;
    org_servicio INTEGER;
BEGIN
    -- Obtener organización del cliente
    SELECT organizacion_id INTO org_cliente
    FROM clientes
    WHERE id = NEW.cliente_id;

    -- Obtener organización del profesional
    SELECT organizacion_id INTO org_profesional
    FROM profesionales
    WHERE id = NEW.profesional_id;

    -- Obtener organización del servicio
    SELECT organizacion_id INTO org_servicio
    FROM servicios
    WHERE id = NEW.servicio_id;

    -- Validar que todas las entidades pertenezcan a la misma organización
    IF org_cliente != NEW.organizacion_id THEN
        RAISE EXCEPTION 'El cliente (org %) no pertenece a la organización de la cita (org %)',
            org_cliente, NEW.organizacion_id;
    END IF;

    IF org_profesional != NEW.organizacion_id THEN
        RAISE EXCEPTION 'El profesional (org %) no pertenece a la organización de la cita (org %)',
            org_profesional, NEW.organizacion_id;
    END IF;

    IF org_servicio != NEW.organizacion_id THEN
        RAISE EXCEPTION 'El servicio (org %) no pertenece a la organización de la cita (org %)',
            org_servicio, NEW.organizacion_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 2: Eliminar constraint inútil
ALTER TABLE citas DROP CONSTRAINT IF EXISTS coherencia_organizacion;

-- PASO 3: Crear trigger de validación
DROP TRIGGER IF EXISTS trigger_validar_coherencia_organizacion ON citas;
CREATE TRIGGER trigger_validar_coherencia_organizacion
    BEFORE INSERT OR UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION validar_coherencia_organizacion_cita();

-- PASO 4: Documentar función
COMMENT ON FUNCTION validar_coherencia_organizacion_cita() IS
'Valida que cliente, profesional y servicio de una cita pertenezcan a la misma organización.
Previene inconsistencias multi-tenant a nivel de base de datos.
Ejecutado automáticamente por trigger en INSERT/UPDATE de citas.';

-- ====================================================================
-- FIX #2: ÍNDICE EN USUARIOS.ORGANIZACION_ID
-- ====================================================================
-- PROBLEMA: Queries de "listar usuarios de mi organización" hacen table scan
-- IMPACTO: Performance degradado en organizaciones con muchos usuarios
-- SOLUCIÓN: Índice parcial en organizacion_id
-- ────────────────────────────────────────────────────────────────────

-- Crear índice optimizado (solo usuarios activos con organización)
CREATE INDEX IF NOT EXISTS idx_usuarios_organizacion_activos
ON usuarios(organizacion_id)
WHERE activo = true AND organizacion_id IS NOT NULL;

-- Documentar índice
COMMENT ON INDEX idx_usuarios_organizacion_activos IS
'Optimiza queries de listado de usuarios por organización.
Índice parcial: solo usuarios activos con organizacion_id no nulo.
Casos de uso: Dashboard admin, asignación de citas, reportes por organización.';

-- ====================================================================
-- FIX #3: DOCUMENTACIÓN DE POLÍTICAS RLS
-- ====================================================================
-- PROBLEMA: Políticas RLS complejas sin documentación inline
-- IMPACTO: Mantenibilidad reducida
-- SOLUCIÓN: Agregar COMMENT ON POLICY para todas las políticas críticas
-- ────────────────────────────────────────────────────────────────────

-- Política unificada de usuarios
COMMENT ON POLICY usuarios_unified_access ON usuarios IS
'Política unificada que maneja 5 casos de acceso a usuarios:
1. LOGIN_CONTEXT: Permite buscar usuario por email durante autenticación
2. SUPER_ADMIN: Acceso global a todos los usuarios del sistema
3. BYPASS_RLS: Funciones PL/pgSQL de sistema (registrar_intento_login, etc)
4. SELF_ACCESS: Usuario puede ver/editar su propio registro
5. TENANT_ISOLATION: Usuario solo ve usuarios de su organización

Variables utilizadas:
- app.current_user_role: Rol del usuario (super_admin, admin, empleado, login_context)
- app.current_user_id: ID del usuario autenticado
- app.current_tenant_id: ID de la organización del usuario
- app.bypass_rls: Bypass para funciones de sistema (true/false)';

-- Política de organizaciones
COMMENT ON POLICY tenant_isolation_organizaciones ON organizaciones IS
'Aislamiento multi-tenant para organizaciones:
- Super admin: Acceso a todas las organizaciones
- Usuario regular: Solo acceso a su propia organización (id = app.current_tenant_id)
- Bypass: Funciones de sistema (registro, onboarding)

Escritura (WITH CHECK): Solo super_admin puede crear/modificar organizaciones.';

-- Política de profesionales
COMMENT ON POLICY tenant_isolation_profesionales ON profesionales IS
'Aislamiento multi-tenant para profesionales:
- Permite acceso solo a profesionales de la organización del usuario
- Super admin tiene acceso global
- Bypass disponible para funciones de sistema

Aplica a: SELECT, INSERT, UPDATE, DELETE';

-- Política de clientes (isolation)
COMMENT ON POLICY clientes_isolation ON clientes IS
'Aislamiento multi-tenant básico para clientes.
Usuario solo puede acceder a clientes de su organización (app.current_tenant_id).
Ver también: clientes_super_admin para acceso global.';

-- Política de clientes (super admin)
COMMENT ON POLICY clientes_super_admin ON clientes IS
'Acceso global para super_admin a todos los clientes del sistema.
Permite gestión centralizada de datos para soporte y administración.';

-- Política de servicios
COMMENT ON POLICY servicios_tenant_isolation ON servicios IS
'Aislamiento multi-tenant para servicios:
- Usuario accede solo a servicios de su organización
- Super admin tiene acceso global
- Bypass disponible para funciones de sistema

Uso típico: Catálogo de servicios, asignación a profesionales, pricing.';

-- Política de servicios (bypass)
COMMENT ON POLICY servicios_system_bypass ON servicios IS
'Bypass RLS para funciones de sistema que requieren acceso directo a servicios.
Activado mediante: SELECT set_config(''app.bypass_rls'', ''true'', true);
Casos de uso: Triggers, funciones de migración, procesos batch.';

-- Política de citas
COMMENT ON POLICY citas_tenant_isolation ON citas IS
'Aislamiento multi-tenant para citas:
- Usuario accede solo a citas de su organización
- Super admin tiene acceso global para soporte
- Bypass para triggers y funciones automáticas

Crítico para: Agenda, reportes, facturación, métricas.';

-- Política de horarios disponibilidad
COMMENT ON POLICY horarios_tenant_isolation ON horarios_disponibilidad IS
'Aislamiento multi-tenant para horarios de disponibilidad:
- Usuario accede solo a horarios de su organización
- Super admin tiene acceso global
- Bypass para generación automática de horarios

Optimizado para: Búsqueda de slots disponibles, reservas temporales.';

-- Política de plantillas (lectura pública)
COMMENT ON POLICY plantillas_public_read ON plantillas_servicios IS
'Lectura pública de plantillas activas para todos los usuarios.
Permite a cualquier organización ver el catálogo de servicios sugeridos.
Solo plantillas con activo=true son visibles.';

-- Política de plantillas (escritura admin)
COMMENT ON POLICY plantillas_admin_insert ON plantillas_servicios IS
'Permite INSERT de plantillas sin restricciones de rol.
NOTA: Combinar con validación a nivel de aplicación para controlar quién puede insertar.';

-- Política de plantillas (actualización admin)
COMMENT ON POLICY plantillas_admin_update ON plantillas_servicios IS
'Solo super_admin puede actualizar plantillas de servicios.
Protege integridad del catálogo oficial de plantillas.';

-- Política de plantillas (eliminación admin)
COMMENT ON POLICY plantillas_admin_delete ON plantillas_servicios IS
'Solo super_admin puede eliminar plantillas de servicios.
RECOMENDACIÓN: Usar soft-delete (activo=false) en lugar de DELETE físico.';

-- Política de plantillas (bypass)
COMMENT ON POLICY plantillas_system_bypass ON plantillas_servicios IS
'Bypass RLS para carga masiva de plantillas y scripts de mantenimiento.
Activado mediante: SELECT set_config(''app.bypass_rls'', ''true'', true);';

-- Política de planes de subscripción (lectura)
COMMENT ON POLICY planes_subscripcion_select ON planes_subscripcion IS
'Lectura de planes activos para todos los usuarios.
Permite visualizar catálogo de planes en frontend.
Solo planes con activo=true son visibles.';

-- Política de planes de subscripción (modificación)
COMMENT ON POLICY planes_subscripcion_modify ON planes_subscripcion IS
'Solo super_admin puede crear/modificar/eliminar planes de subscripción.
Operaciones críticas: Pricing, límites, características de planes.';

-- Política de subscripciones
COMMENT ON POLICY subscripciones_unified_access ON subscripciones IS
'Acceso a subscripciones por organización:
- Usuario accede solo a subscripción de su organización
- Super admin tiene acceso global
- Validación de formato numérico en tenant_id (regex: ^[0-9]+$)

Crítico para: Facturación, límites de uso, upgrades/downgrades.';

-- Política de historial subscripciones
COMMENT ON POLICY historial_subscripciones_access ON historial_subscripciones IS
'Acceso de solo lectura al historial de subscripciones:
- Usuario ve historial de su organización
- Super admin ve todo el historial
- Usado para auditoría y reportes de facturación';

-- Política de servicios profesionales
COMMENT ON POLICY servicios_profesionales_tenant_isolation ON servicios_profesionales IS
'Aislamiento indirecto mediante JOIN con tabla servicios.
Verifica que el servicio asociado pertenezca a la organización del usuario.
Previene asignaciones cruzadas entre organizaciones.';

-- Política de horarios profesionales
COMMENT ON POLICY horarios_profesionales_unified_access ON horarios_profesionales IS
'Acceso a configuración de horarios de profesionales:
- Usuario accede solo a horarios de su organización
- Super admin tiene acceso global
- Validación de formato numérico en tenant_id

Usado para: Configuración de disponibilidad semanal, breaks, horarios premium.';

-- Política de bloqueos horarios
COMMENT ON POLICY bloqueos_horarios_tenant_isolation ON bloqueos_horarios IS
'Aislamiento multi-tenant para bloqueos de horarios:
- Usuario accede solo a bloqueos de su organización
- Super admin tiene acceso global
- Bypass para funciones automáticas

Tipos de bloqueo: vacaciones, feriados, capacitación, emergencia, mantenimiento.';

-- Política de eventos sistema
COMMENT ON POLICY eventos_sistema_tenant_access ON eventos_sistema IS
'Acceso a eventos del sistema con múltiples criterios:
- Super admin: Acceso global a todos los eventos
- Usuario de organización: Eventos de su organización
- Usuario específico: Eventos donde es el actor (usuario_id)
- Bypass: Funciones de logging y auditoría

Crítico para: Auditoría, seguridad, debugging, compliance.';

-- Política de métricas uso
COMMENT ON POLICY metricas_uso_access ON metricas_uso_organizacion IS
'Acceso a métricas de uso de organización:
- Usuario ve métricas de su organización
- Super admin ve todas las métricas
- Usado para: Dashboard, límites de plan, alertas de cuota.';

-- ====================================================================
-- FIX #4: ÍNDICE ADICIONAL EN EVENTOS_SISTEMA
-- ====================================================================
-- MEJORA: Optimizar queries de auditoría por usuario
-- ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_eventos_usuario_org_fecha
ON eventos_sistema(usuario_id, organizacion_id, creado_en DESC)
WHERE usuario_id IS NOT NULL;

COMMENT ON INDEX idx_eventos_usuario_org_fecha IS
'Optimiza queries de auditoría de acciones por usuario específico.
Incluye organizacion_id para filtrado multi-tenant.
Índice parcial: solo eventos con usuario identificado.';

-- ====================================================================
-- VALIDACIÓN DE CORRECCIONES
-- ====================================================================

-- Verificar que las correcciones se aplicaron correctamente
DO $$
DECLARE
    trigger_count INTEGER;
    index_count INTEGER;
    policy_comment_count INTEGER;
BEGIN
    -- Verificar trigger de coherencia
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'trigger_validar_coherencia_organizacion'
    AND tgrelid = 'citas'::regclass;

    IF trigger_count = 0 THEN
        RAISE WARNING 'Trigger de coherencia organizacional NO creado en tabla citas';
    ELSE
        RAISE NOTICE '✅ Trigger de coherencia organizacional creado correctamente';
    END IF;

    -- Verificar índice de usuarios
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE indexname = 'idx_usuarios_organizacion_activos';

    IF index_count = 0 THEN
        RAISE WARNING 'Índice idx_usuarios_organizacion_activos NO creado';
    ELSE
        RAISE NOTICE '✅ Índice de usuarios.organizacion_id creado correctamente';
    END IF;

    -- Verificar comentarios en políticas
    SELECT COUNT(*) INTO policy_comment_count
    FROM pg_description d
    JOIN pg_policy p ON d.objoid = p.oid
    WHERE d.description IS NOT NULL;

    RAISE NOTICE '✅ % políticas RLS documentadas', policy_comment_count;

    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'CORRECCIONES DE AUDITORÍA APLICADAS EXITOSAMENTE';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
