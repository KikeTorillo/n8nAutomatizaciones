-- ====================================================================
-- 💵 MÓDULO COMISIONES - FUNCIONES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 17 Noviembre 2025
-- Módulo: comisiones
--
-- DESCRIPCIÓN:
-- Funciones especializadas para cálculo automático de comisiones y auditoría.
-- Soportan configuración flexible (global o específica) y múltiples tipos.
--
-- FUNCIONES (3):
-- • obtener_configuracion_comision(): Busca config aplicable (prioridad: específica > global)
-- • calcular_comision_cita(): Calcula y registra comisión al completar cita
-- • auditoria_configuracion_comisiones(): Registra cambios en configuración
--
-- CARACTERÍSTICAS:
-- • Trigger automático: calcular_comision_cita() se ejecuta al completar cita
-- • Anti-duplicados: Validación de existencia antes de insertar
-- • Bypass RLS: set_config('app.bypass_rls', 'true') para operaciones de sistema
-- • JSONB detalle_servicios: Breakdown completo por servicio
--
-- ====================================================================

-- ====================================================================
-- FUNCIÓN 1: obtener_configuracion_comision()
-- ====================================================================
-- Obtiene la configuración de comisión aplicable para un profesional/servicio.
-- Primero busca config específica del servicio, sino retorna config global.
--
-- PRIORIDAD DE BÚSQUEDA:
-- 1. Configuración específica: servicio_id = p_servicio_id
-- 2. Configuración global: servicio_id IS NULL (fallback)
--
-- USADO POR:
-- • Trigger calcular_comision_cita() (crítico para cálculo automático)
--
-- RETURNS:
-- • tipo_comision: 'porcentaje' | 'monto_fijo'
-- • valor_comision: 0-100 (si porcentaje) o monto fijo
-- • NULL si no hay configuración
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_configuracion_comision(
    p_profesional_id INTEGER,
    p_servicio_id INTEGER,
    p_organizacion_id INTEGER
)
RETURNS TABLE (
    tipo_comision VARCHAR(20),
    valor_comision DECIMAL(10, 2)
) AS $$
BEGIN
    -- Primero intenta obtener configuración específica del servicio
    RETURN QUERY
    SELECT
        cc.tipo_comision,
        cc.valor_comision
    FROM configuracion_comisiones cc
    WHERE cc.profesional_id = p_profesional_id
      AND cc.servicio_id = p_servicio_id
      AND cc.organizacion_id = p_organizacion_id
      AND cc.activo = true
    LIMIT 1;

    -- Si no hay específica, obtener configuración global del profesional
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT
            cc.tipo_comision,
            cc.valor_comision
        FROM configuracion_comisiones cc
        WHERE cc.profesional_id = p_profesional_id
          AND cc.servicio_id IS NULL
          AND cc.organizacion_id = p_organizacion_id
          AND cc.activo = true
        LIMIT 1;
    END IF;

    -- Si no hay configuración, retornar NULL
    RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_configuracion_comision IS
'Obtiene la configuración de comisión aplicable (específica del servicio o global del profesional).
Prioridad: específica (servicio_id = X) > global (servicio_id IS NULL).
Usada por trigger calcular_comision_cita() para determinar tipo y valor de comisión.
Performance: O(log n) con índices idx_config_comisiones_prof y idx_config_comisiones_serv.';

-- ====================================================================
-- FUNCIÓN 1b: obtener_configuracion_comision_producto()
-- ====================================================================
-- Obtiene la configuración de comisión aplicable para un producto.
-- Busca con prioridad cascada: producto específico > categoría > global.
--
-- PRIORIDAD DE BÚSQUEDA:
-- 1. Configuración específica: producto_id = p_producto_id
-- 2. Configuración por categoría: categoria_producto_id = p_categoria_id
-- 3. Configuración global de productos: aplica_a IN ('producto', 'ambos')
--
-- USADO POR:
-- • Trigger calcular_comision_venta() (crítico para cálculo automático)
--
-- RETURNS:
-- • tipo_comision: 'porcentaje' | 'monto_fijo'
-- • valor_comision: 0-100 (si porcentaje) o monto fijo
-- • NULL si no hay configuración
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_configuracion_comision_producto(
    p_profesional_id INTEGER,
    p_producto_id INTEGER,
    p_categoria_producto_id INTEGER,
    p_organizacion_id INTEGER
)
RETURNS TABLE (
    tipo_comision VARCHAR(20),
    valor_comision DECIMAL(10, 2)
) AS $$
BEGIN
    -- 1. Buscar configuración específica del producto
    RETURN QUERY
    SELECT cc.tipo_comision, cc.valor_comision
    FROM configuracion_comisiones cc
    WHERE cc.organizacion_id = p_organizacion_id
      AND cc.profesional_id = p_profesional_id
      AND cc.producto_id = p_producto_id
      AND cc.activo = true
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;

    -- 2. Buscar configuración por categoría de producto
    IF p_categoria_producto_id IS NOT NULL THEN
        RETURN QUERY
        SELECT cc.tipo_comision, cc.valor_comision
        FROM configuracion_comisiones cc
        WHERE cc.organizacion_id = p_organizacion_id
          AND cc.profesional_id = p_profesional_id
          AND cc.categoria_producto_id = p_categoria_producto_id
          AND cc.producto_id IS NULL
          AND cc.activo = true
        LIMIT 1;

        IF FOUND THEN RETURN; END IF;
    END IF;

    -- 3. Buscar configuración global de productos
    RETURN QUERY
    SELECT cc.tipo_comision, cc.valor_comision
    FROM configuracion_comisiones cc
    WHERE cc.organizacion_id = p_organizacion_id
      AND cc.profesional_id = p_profesional_id
      AND cc.producto_id IS NULL
      AND cc.categoria_producto_id IS NULL
      AND cc.servicio_id IS NULL
      AND cc.aplica_a IN ('producto', 'ambos')
      AND cc.activo = true
    LIMIT 1;

    -- Si no hay configuración, retornar vacío
    RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_configuracion_comision_producto IS
'Obtiene la configuración de comisión aplicable para un producto.
Prioridad cascada: producto_id > categoria_producto_id > global (aplica_a IN producto, ambos).
Usada por trigger calcular_comision_venta() para determinar tipo y valor de comisión.
Performance: O(log n) con índices idx_config_comisiones_producto y idx_config_comisiones_categoria.';

-- ====================================================================
-- FUNCIÓN 2: calcular_comision_cita()
-- ====================================================================
-- Calcula y registra comisión al completar una cita.
-- Trigger AFTER UPDATE ejecuta esta función cuando estado → 'completada'.
--
-- ALGORITMO:
-- 1. Verifica que la cita pasó a estado 'completada'
-- 2. Valida que no exista comisión previa (anti-duplicados)
-- 3. Obtiene servicios de la cita desde citas_servicios
-- 4. Para cada servicio:
--    a. Busca configuración (específica o global) con obtener_configuracion_comision()
--    b. Calcula comisión según tipo (porcentaje o monto_fijo)
--    c. Agrega al detalle_servicios JSONB
-- 5. Determina tipo_comision final:
--    - 'porcentaje' si todos los servicios usan porcentaje
--    - 'monto_fijo' si todos usan monto fijo
--    - 'mixto' si combina ambos tipos
-- 6. Inserta en comisiones_profesionales con estado 'pendiente'
--
-- BYPASS RLS:
-- Activa bypass_rls para poder insertar sin restricciones de RLS.
-- Esto es necesario porque el trigger es una operación de sistema.
--
-- ANTI-DUPLICADOS:
-- Verifica con EXISTS antes de insertar (idx_comisiones_cita).
-- ====================================================================

CREATE OR REPLACE FUNCTION calcular_comision_cita()
RETURNS TRIGGER AS $$
DECLARE
    v_profesional_id INTEGER;
    v_organizacion_id INTEGER;
    v_monto_total DECIMAL(10, 2);
    v_comision_total DECIMAL(10, 2) := 0;
    v_detalle_servicios JSONB := '[]'::jsonb;
    v_servicio RECORD;
    v_config RECORD;
    v_comision_servicio DECIMAL(10, 2);
    v_tipo_comision_final VARCHAR(20);
    v_tipos_usados TEXT[] := ARRAY[]::TEXT[];
    v_valor_comision_final DECIMAL(10, 2) := 0;
    v_primer_valor DECIMAL(10, 2);
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- ACTIVAR BYPASS RLS PARA FUNCIONES DE SISTEMA
    -- ═══════════════════════════════════════════════════════════════════
    -- Necesario para que el trigger pueda insertar en comisiones_profesionales
    -- sin restricciones de RLS (función de cálculo automático de sistema)
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Solo calcular si la cita pasa a estado 'completada'
    IF NEW.estado = 'completada' AND OLD.estado != 'completada' THEN

        -- Obtener datos de la cita
        SELECT profesional_id, organizacion_id
        INTO v_profesional_id, v_organizacion_id
        FROM citas
        WHERE id = NEW.id;

        -- Si no hay profesional asignado, no calcular comisión
        IF v_profesional_id IS NULL THEN
            RETURN NEW;
        END IF;

        -- Verificar si ya existe una comisión para esta cita (anti-duplicados)
        IF EXISTS (SELECT 1 FROM comisiones_profesionales WHERE cita_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- Calcular monto total de la cita (suma de servicios)
        SELECT COALESCE(SUM(s.precio), 0)
        INTO v_monto_total
        FROM citas_servicios cs
        JOIN servicios s ON cs.servicio_id = s.id
        WHERE cs.cita_id = NEW.id;

        -- Iterar sobre cada servicio de la cita
        FOR v_servicio IN
            SELECT cs.servicio_id, s.nombre, s.precio
            FROM citas_servicios cs
            JOIN servicios s ON cs.servicio_id = s.id
            WHERE cs.cita_id = NEW.id
        LOOP
            -- Obtener configuración de comisión para este servicio
            SELECT * INTO v_config
            FROM obtener_configuracion_comision(
                v_profesional_id,
                v_servicio.servicio_id,
                v_organizacion_id
            );

            -- Si hay configuración, calcular comisión
            IF v_config.tipo_comision IS NOT NULL THEN
                IF v_config.tipo_comision = 'porcentaje' THEN
                    v_comision_servicio := v_servicio.precio * (v_config.valor_comision / 100);
                ELSE
                    v_comision_servicio := v_config.valor_comision;
                END IF;

                -- Registrar tipo de comisión usado
                v_tipos_usados := array_append(v_tipos_usados, v_config.tipo_comision);

                -- Guardar el primer valor para valor_comision
                IF v_primer_valor IS NULL THEN
                    v_primer_valor := v_config.valor_comision;
                END IF;

                -- Agregar al detalle JSONB
                v_detalle_servicios := v_detalle_servicios || jsonb_build_object(
                    'servicio_id', v_servicio.servicio_id,
                    'nombre', v_servicio.nombre,
                    'precio', v_servicio.precio,
                    'tipo_comision', v_config.tipo_comision,
                    'valor_comision', v_config.valor_comision,
                    'comision_calculada', v_comision_servicio
                );

                v_comision_total := v_comision_total + v_comision_servicio;
            END IF;
        END LOOP;

        -- Determinar tipo_comision final y valor_comision
        IF array_length(v_tipos_usados, 1) = 0 THEN
            -- No hay configuración, no crear comisión
            RETURN NEW;
        ELSIF array_length(v_tipos_usados, 1) = 1 THEN
            -- Un solo tipo de comisión
            v_tipo_comision_final := v_tipos_usados[1];
            v_valor_comision_final := v_primer_valor;
        ELSE
            -- Múltiples tipos (porcentaje + monto_fijo)
            v_tipo_comision_final := 'mixto';
            v_valor_comision_final := 0; -- No aplica en mixto
        END IF;

        -- Solo insertar si hay comisión calculada
        IF v_comision_total > 0 THEN
            INSERT INTO comisiones_profesionales (
                organizacion_id,
                sucursal_id,
                profesional_id,
                cita_id,
                fecha_cita,
                monto_base,
                tipo_comision,
                valor_comision,
                monto_comision,
                detalle_servicios,
                estado_pago
            ) VALUES (
                v_organizacion_id,
                NEW.sucursal_id,  -- Heredar sucursal de la cita
                v_profesional_id,
                NEW.id,
                NEW.fecha_cita,
                v_monto_total,
                v_tipo_comision_final,
                v_valor_comision_final,
                v_comision_total,
                v_detalle_servicios,
                'pendiente'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_comision_cita IS
'Calcula y registra automáticamente la comisión al completar una cita.
Trigger: trigger_calcular_comision_cita (AFTER UPDATE OF estado ON citas)
Algoritmo:
1. Valida estado → completada
2. Verifica anti-duplicados (EXISTS en comisiones_profesionales)
3. Obtiene servicios desde citas_servicios
4. Para cada servicio: busca config (específica > global) y calcula comisión
5. Determina tipo final: porcentaje | monto_fijo | mixto
6. Inserta en comisiones_profesionales con estado pendiente
Bypass RLS: set_config(''app.bypass_rls'', ''true'') para operación de sistema';

-- ====================================================================
-- FUNCIÓN 3: auditoria_configuracion_comisiones()
-- ====================================================================
-- Registra cambios en configuración de comisiones para auditoría.
-- Trigger ejecuta esta función en INSERT/UPDATE/DELETE de configuracion_comisiones.
--
-- OPERACIONES:
-- • INSERT: Registra valores nuevos
-- • UPDATE: Registra valores anteriores y nuevos
-- • DELETE: Registra valores anteriores
--
-- BYPASS RLS:
-- Activa bypass_rls para poder insertar en historial sin restricciones.
--
-- USUARIO MODIFICADOR:
-- Obtiene el usuario desde current_setting('app.user_id').
-- ====================================================================

CREATE OR REPLACE FUNCTION auditoria_configuracion_comisiones()
RETURNS TRIGGER AS $$
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- ACTIVAR BYPASS RLS PARA FUNCIONES DE SISTEMA
    -- ═══════════════════════════════════════════════════════════════════
    -- Necesario para que el trigger pueda insertar en historial sin
    -- restricciones de RLS (función de auditoría de sistema)
    PERFORM set_config('app.bypass_rls', 'true', true);

    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO historial_configuracion_comisiones (
            organizacion_id,
            configuracion_id,
            profesional_id,
            aplica_a,
            servicio_id,
            producto_id,
            categoria_producto_id,
            tipo_comision_anterior,
            valor_comision_anterior,
            activo_anterior,
            aplica_a_anterior,
            tipo_comision_nuevo,
            valor_comision_nuevo,
            activo_nuevo,
            aplica_a_nuevo,
            accion,
            modificado_por
        ) VALUES (
            NEW.organizacion_id,
            NEW.id,
            NEW.profesional_id,
            NEW.aplica_a,
            NEW.servicio_id,
            NEW.producto_id,
            NEW.categoria_producto_id,
            OLD.tipo_comision,
            OLD.valor_comision,
            OLD.activo,
            OLD.aplica_a,
            NEW.tipo_comision,
            NEW.valor_comision,
            NEW.activo,
            NEW.aplica_a,
            'UPDATE',
            current_setting('app.user_id', true)::integer
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO historial_configuracion_comisiones (
            organizacion_id,
            configuracion_id,
            profesional_id,
            aplica_a,
            servicio_id,
            producto_id,
            categoria_producto_id,
            tipo_comision_nuevo,
            valor_comision_nuevo,
            activo_nuevo,
            aplica_a_nuevo,
            accion,
            modificado_por
        ) VALUES (
            NEW.organizacion_id,
            NEW.id,
            NEW.profesional_id,
            NEW.aplica_a,
            NEW.servicio_id,
            NEW.producto_id,
            NEW.categoria_producto_id,
            NEW.tipo_comision,
            NEW.valor_comision,
            NEW.activo,
            NEW.aplica_a,
            'INSERT',
            current_setting('app.user_id', true)::integer
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO historial_configuracion_comisiones (
            organizacion_id,
            configuracion_id,
            profesional_id,
            aplica_a,
            servicio_id,
            producto_id,
            categoria_producto_id,
            tipo_comision_anterior,
            valor_comision_anterior,
            activo_anterior,
            aplica_a_anterior,
            accion,
            modificado_por
        ) VALUES (
            OLD.organizacion_id,
            OLD.id,
            OLD.profesional_id,
            OLD.aplica_a,
            OLD.servicio_id,
            OLD.producto_id,
            OLD.categoria_producto_id,
            OLD.tipo_comision,
            OLD.valor_comision,
            OLD.activo,
            OLD.aplica_a,
            'DELETE',
            current_setting('app.user_id', true)::integer
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auditoria_configuracion_comisiones IS
'Registra todos los cambios (INSERT/UPDATE/DELETE) en configuracion_comisiones para auditoría.
Triggers:
- trigger_auditoria_configuracion_comisiones_after (AFTER INSERT OR UPDATE)
- trigger_auditoria_configuracion_comisiones_before (BEFORE DELETE)
Inserta en historial_configuracion_comisiones con valores anteriores/nuevos y usuario modificador.
Bypass RLS: set_config(''app.bypass_rls'', ''true'') para operación de sistema';

-- ====================================================================
-- FUNCIÓN 4: calcular_comision_venta()
-- ====================================================================
-- Calcula y registra comisión al completar una venta POS.
-- Se ejecuta por trigger AFTER INSERT/UPDATE en ventas_pos.
--
-- ALGORITMO:
-- 1. Verifica que la venta está en estado 'completada'
-- 2. Verifica que hay profesional_id (vendedor) asignado
-- 3. Valida que no exista comisión previa (anti-duplicados)
-- 4. Obtiene items de la venta desde ventas_pos_items
-- 5. Para cada item con aplica_comision = true:
--    a. Busca configuración (producto > categoría > global)
--    b. Calcula comisión según tipo (porcentaje o monto_fijo)
--    c. Agrega al detalle_productos JSONB
-- 6. Determina tipo_comision final
-- 7. Inserta en comisiones_profesionales con origen = 'venta'
--
-- BYPASS RLS:
-- Activa bypass_rls para poder insertar sin restricciones de RLS.
--
-- NOTA: Este función requiere que el módulo POS se inicialice ANTES que
-- el módulo comisiones. Ver init-data.sh para el orden de ejecución.
-- ====================================================================

CREATE OR REPLACE FUNCTION calcular_comision_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_profesional_id INTEGER;
    v_item RECORD;
    v_config RECORD;
    v_comision_item DECIMAL(10,2);
    v_total_comision DECIMAL(10,2) := 0;
    v_monto_base DECIMAL(10,2) := 0;
    v_detalle_productos JSONB := '[]'::JSONB;
    v_tipos_usados TEXT[] := ARRAY[]::TEXT[];
    v_tipo_final VARCHAR(20);
    v_primer_valor DECIMAL(10,2);
BEGIN
    -- Solo procesar ventas completadas
    IF NEW.estado != 'completada' THEN
        RETURN NEW;
    END IF;

    -- Obtener profesional (vendedor)
    v_profesional_id := NEW.profesional_id;

    -- Si no hay profesional asignado, no hay comisión
    IF v_profesional_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Anti-duplicados: Verificar si ya existe comisión para esta venta
    IF EXISTS (
        SELECT 1 FROM comisiones_profesionales
        WHERE venta_id = NEW.id AND origen = 'venta'
    ) THEN
        RETURN NEW;
    END IF;

    -- Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Iterar sobre los items de la venta
    FOR v_item IN
        SELECT
            vpi.producto_id,
            vpi.nombre_producto,
            vpi.cantidad,
            vpi.subtotal,
            vpi.aplica_comision,
            p.categoria_id
        FROM ventas_pos_items vpi
        JOIN productos p ON vpi.producto_id = p.id
        WHERE vpi.venta_pos_id = NEW.id
          AND vpi.aplica_comision = true  -- Solo items que aplican comisión
    LOOP
        -- Acumular monto base
        v_monto_base := v_monto_base + v_item.subtotal;

        -- Buscar configuración de comisión (cascada: producto > categoría > global)
        SELECT tipo_comision, valor_comision INTO v_config
        FROM obtener_configuracion_comision_producto(
            v_profesional_id,
            v_item.producto_id,
            v_item.categoria_id,
            NEW.organizacion_id
        );

        -- Si hay configuración, calcular comisión
        IF v_config.tipo_comision IS NOT NULL THEN
            -- Calcular comisión según tipo
            IF v_config.tipo_comision = 'porcentaje' THEN
                v_comision_item := v_item.subtotal * (v_config.valor_comision / 100);
            ELSE -- monto_fijo
                v_comision_item := v_config.valor_comision * v_item.cantidad;
            END IF;

            v_total_comision := v_total_comision + v_comision_item;

            -- Registrar tipo usado
            IF NOT v_config.tipo_comision = ANY(v_tipos_usados) THEN
                v_tipos_usados := array_append(v_tipos_usados, v_config.tipo_comision);
            END IF;

            -- Guardar el primer valor para valor_comision
            IF v_primer_valor IS NULL THEN
                v_primer_valor := v_config.valor_comision;
            END IF;

            -- Agregar al detalle
            v_detalle_productos := v_detalle_productos || jsonb_build_object(
                'producto_id', v_item.producto_id,
                'nombre', v_item.nombre_producto,
                'cantidad', v_item.cantidad,
                'subtotal', v_item.subtotal,
                'tipo_comision', v_config.tipo_comision,
                'valor_comision', v_config.valor_comision,
                'comision_calculada', v_comision_item
            );
        END IF;
    END LOOP;

    -- Solo insertar si hay comisión > 0
    IF v_total_comision > 0 THEN
        -- Determinar tipo final
        IF array_length(v_tipos_usados, 1) = 1 THEN
            v_tipo_final := v_tipos_usados[1];
        ELSE
            v_tipo_final := 'mixto';
            v_primer_valor := 0; -- No aplica en mixto
        END IF;

        -- Insertar comisión
        INSERT INTO comisiones_profesionales (
            organizacion_id,
            sucursal_id,
            profesional_id,
            origen,
            venta_id,
            monto_base,
            tipo_comision,
            valor_comision,
            monto_comision,
            detalle_productos,
            estado_pago
        ) VALUES (
            NEW.organizacion_id,
            NEW.sucursal_id,  -- Heredar sucursal de la venta
            v_profesional_id,
            'venta',
            NEW.id,
            v_monto_base,
            v_tipo_final,
            COALESCE(v_primer_valor, 0),
            v_total_comision,
            v_detalle_productos,
            'pendiente'
        );
    END IF;

    -- Restaurar RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_comision_venta IS
'Calcula y registra automáticamente la comisión al completar una venta POS.
Triggers: trigger_calcular_comision_venta (AFTER INSERT/UPDATE ON ventas_pos)
Algoritmo:
1. Valida estado = completada y profesional_id NOT NULL
2. Verifica anti-duplicados (EXISTS en comisiones_profesionales WHERE venta_id = ?)
3. Obtiene items desde ventas_pos_items WHERE aplica_comision = true
4. Para cada item: busca config (producto > categoría > global) y calcula comisión
5. Determina tipo final: porcentaje | monto_fijo | mixto
6. Inserta en comisiones_profesionales con origen = venta
Bypass RLS: set_config(''app.bypass_rls'', ''true'') para operación de sistema';

-- ====================================================================
-- 📊 RESUMEN DE FUNCIONES
-- ====================================================================
-- TOTAL: 5 funciones en este módulo
--
-- obtener_configuracion_comision():
-- ├── Parámetros: p_profesional_id, p_servicio_id, p_organizacion_id
-- ├── Returns: tipo_comision, valor_comision (o NULL)
-- ├── Prioridad: específica (servicio_id) > global (servicio_id NULL)
-- └── Usado por: calcular_comision_cita()
--
-- obtener_configuracion_comision_producto():
-- ├── Parámetros: p_profesional_id, p_producto_id, p_categoria_producto_id, p_organizacion_id
-- ├── Returns: tipo_comision, valor_comision (o NULL)
-- ├── Prioridad: producto_id > categoria_producto_id > global (aplica_a IN producto, ambos)
-- └── Usado por: calcular_comision_venta()
--
-- calcular_comision_cita():
-- ├── Tipo: TRIGGER FUNCTION
-- ├── Evento: AFTER UPDATE OF estado ON citas
-- ├── Condición: NEW.estado = 'completada' AND OLD.estado != 'completada'
-- ├── Algoritmo: Itera servicios → busca config → calcula comisión → inserta
-- ├── Anti-duplicados: EXISTS (SELECT 1 WHERE cita_id = ?)
-- └── Bypass RLS: set_config('app.bypass_rls', 'true')
--
-- auditoria_configuracion_comisiones():
-- ├── Tipo: TRIGGER FUNCTION
-- ├── Eventos: AFTER INSERT/UPDATE, BEFORE DELETE
-- ├── Acción: Registra cambios en historial_configuracion_comisiones
-- ├── Usuario: current_setting('app.user_id')
-- └── Bypass RLS: set_config('app.bypass_rls', 'true')
--
-- calcular_comision_venta():
-- ├── Tipo: TRIGGER FUNCTION
-- ├── Evento: AFTER INSERT/UPDATE OF estado ON ventas_pos
-- ├── Condición: NEW.estado = 'completada' AND profesional_id IS NOT NULL
-- ├── Algoritmo: Itera items → busca config (producto>categoría>global) → calcula
-- ├── Anti-duplicados: EXISTS (SELECT 1 WHERE venta_id = ? AND origen = 'venta')
-- └── Bypass RLS: set_config('app.bypass_rls', 'true')
--
-- ORDEN DE EJECUCIÓN:
-- El módulo POS debe ejecutarse ANTES que comisiones en init-data.sh
-- para que las tablas ventas_pos y ventas_pos_items existan.
--
-- ====================================================================
