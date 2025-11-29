-- ====================================================================
-- MÓDULO NÚCLEO: DATOS INICIALES
-- ====================================================================
-- Datos de configuración inicial del sistema:
-- • Planes de subscripción (free, pro, custom)
--
-- Modelo de Negocio: Estilo Odoo (Nov 2025)
-- • Free: 1 App gratis a elegir, usuarios ilimitados
-- • Pro: Todas las apps, $249 MXN/usuario/mes
-- • Custom: Plan personalizado (precio negociado)
--
-- Migrado de: sql/schema/10-subscriptions-table.sql
-- Fecha migración: 16 Noviembre 2025
-- Actualización: 24 Noviembre 2025 - Modelo Free/Pro
-- ====================================================================

-- ====================================================================
-- DATOS INICIALES: PLANES DE SUBSCRIPCIÓN
-- ====================================================================

INSERT INTO planes_subscripcion (
    codigo_plan, nombre_plan, descripcion,
    precio_mensual, precio_anual, precio_por_usuario, moneda,
    limite_profesionales, limite_clientes, limite_servicios,
    limite_usuarios, limite_citas_mes,
    funciones_habilitadas, activo, orden_display
) VALUES

-- ============================================================
-- Plan Free: 1 App gratis a elegir
-- ============================================================
-- Usuario elige: Agendamiento, Inventario o POS
-- Sin límites funcionales dentro de la app elegida
-- Upsell: Cuando necesitan otra app → Pro
-- ============================================================
('free', 'Free',
 '1 App gratis a elegir. Usuarios ilimitados. Para siempre.',
 0.00, 0.00, NULL, 'MXN',
 NULL, NULL, NULL, NULL, NULL,  -- Sin límites
 '{
   "soporte_email": true,
   "soporte_chat": false,
   "soporte_prioritario": false,
   "api_access": false,
   "custom_branding": false,
   "whatsapp": false,
   "reportes_avanzados": false
 }'::jsonb,
 TRUE, 1),

-- ============================================================
-- Plan Pro: Todas las apps incluidas
-- ============================================================
-- $249 MXN/usuario/mes (~$15 USD)
-- Todas las apps: Agendamiento, Inventario, POS, Marketplace,
--                 Comisiones, Chatbots IA
-- Sin límites
-- ============================================================
('pro', 'Pro',
 'Todas las apps incluidas. $249 MXN por usuario al mes.',
 249.00, 2490.00, 249.00, 'MXN',  -- precio_por_usuario = $249
 NULL, NULL, NULL, NULL, NULL,  -- Sin límites
 '{
   "soporte_email": true,
   "soporte_chat": true,
   "soporte_prioritario": true,
   "api_access": true,
   "custom_branding": true,
   "whatsapp": true,
   "reportes_avanzados": true,
   "marketplace": true,
   "comisiones": true,
   "chatbots_ia": true
 }'::jsonb,
 TRUE, 2),

-- ============================================================
-- Plan Custom: Empresarial / Personalizado
-- ============================================================
-- Para organizaciones grandes con necesidades específicas
-- Precio negociado, features personalizadas
-- ============================================================
('custom', 'Personalizado',
 'Plan a medida para organizaciones con necesidades específicas.',
 0.00, NULL, NULL, 'MXN',
 NULL, NULL, NULL, NULL, NULL,  -- Sin límites
 '{
   "soporte_email": true,
   "soporte_chat": true,
   "soporte_prioritario": true,
   "soporte_dedicado": true,
   "api_access": true,
   "custom_branding": true,
   "whatsapp": true,
   "reportes_avanzados": true,
   "marketplace": true,
   "comisiones": true,
   "chatbots_ia": true,
   "sla_garantizado": true,
   "features_custom": true
 }'::jsonb,
 TRUE, 3),

-- ============================================================
-- Plan Trial: Período de prueba (14 días)
-- ============================================================
-- Acceso temporal a todas las apps para evaluar
-- Después del trial: elegir Free o Pro
-- ============================================================
('trial', 'Trial',
 'Período de prueba de 14 días. Acceso completo para evaluar.',
 0.00, NULL, NULL, 'MXN',
 3, 50, 10, 2, 50,  -- Límites para trial
 '{
   "soporte_email": true,
   "soporte_chat": false,
   "api_access": false,
   "custom_branding": false,
   "whatsapp": true,
   "reportes_avanzados": false
 }'::jsonb,
 TRUE, 0)

ON CONFLICT (codigo_plan) DO UPDATE SET
    nombre_plan = EXCLUDED.nombre_plan,
    descripcion = EXCLUDED.descripcion,
    precio_mensual = EXCLUDED.precio_mensual,
    precio_anual = EXCLUDED.precio_anual,
    precio_por_usuario = EXCLUDED.precio_por_usuario,
    limite_profesionales = EXCLUDED.limite_profesionales,
    limite_clientes = EXCLUDED.limite_clientes,
    limite_servicios = EXCLUDED.limite_servicios,
    limite_usuarios = EXCLUDED.limite_usuarios,
    limite_citas_mes = EXCLUDED.limite_citas_mes,
    funciones_habilitadas = EXCLUDED.funciones_habilitadas,
    activo = EXCLUDED.activo,
    orden_display = EXCLUDED.orden_display,
    actualizado_en = NOW();

-- ====================================================================
-- PLANES LEGACY (Inactivos - Solo para clientes existentes)
-- ====================================================================
-- Estos planes ya no están disponibles para nuevos registros
-- Los clientes existentes mantienen su plan hasta migración
-- ====================================================================

INSERT INTO planes_subscripcion (
    codigo_plan, nombre_plan, descripcion,
    precio_mensual, precio_anual, precio_por_usuario, moneda,
    limite_profesionales, limite_clientes, limite_servicios,
    limite_usuarios, limite_citas_mes,
    funciones_habilitadas, activo, orden_display
) VALUES

('basico', 'Plan Básico [LEGACY]',
 'Plan legacy - No disponible para nuevos clientes.',
 299.00, 2990.00, NULL, 'MXN',
 5, 200, 15, 3, 200,
 '{"whatsapp_integration": true, "advanced_reports": false, "custom_branding": false, "api_access": false}'::jsonb,
 FALSE, 99),

('profesional', 'Plan Professional [LEGACY]',
 'Plan legacy - No disponible para nuevos clientes.',
 599.00, 5990.00, NULL, 'MXN',
 15, 1000, 50, 8, 800,
 '{"whatsapp_integration": true, "advanced_reports": true, "custom_branding": true, "api_access": false}'::jsonb,
 FALSE, 99)

ON CONFLICT (codigo_plan) DO UPDATE SET
    nombre_plan = EXCLUDED.nombre_plan,
    descripcion = EXCLUDED.descripcion,
    activo = EXCLUDED.activo,
    orden_display = EXCLUDED.orden_display,
    actualizado_en = NOW();

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON TABLE planes_subscripcion IS
'Planes de subscripción del SaaS (Modelo Estilo Odoo - Nov 2025):
- free: 1 App gratis a elegir, usuarios ilimitados, para siempre
- pro: Todas las apps, $249 MXN/usuario/mes (~$15 USD)
- custom: Plan personalizado sin límites (precio negociado)
- trial: Período de prueba 14 días
- basico/profesional: LEGACY (inactivos, solo clientes existentes)';


-- ====================================================================
-- ORGANIZACIÓN INICIAL PARA SUPER_ADMIN
-- ====================================================================
-- El super_admin requiere una organización (como todos los usuarios).
-- Esta es una organización normal con todas las funcionalidades.
-- El super_admin puede crear citas, clientes, ventas, etc. aquí.
-- Adicionalmente tiene acceso al panel /superadmin/* para gestión global.
--
-- Fecha: 28 Noviembre 2025
-- ====================================================================

INSERT INTO organizaciones (
    id,
    codigo_tenant,
    slug,
    nombre_comercial,
    razon_social,
    email_admin,
    categoria_id,
    plan_actual,
    zona_horaria,
    idioma,
    moneda,
    activo
) VALUES (
    1,
    'org_admin_principal',
    'admin',
    'Administración',
    'Organización Principal',
    'admin@plataforma.local',
    1,
    'custom',
    'America/Mexico_City',
    'es',
    'MXN',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Asegurar que la secuencia continúe después del ID 1
SELECT setval('organizaciones_id_seq', GREATEST(1, (SELECT MAX(id) FROM organizaciones)));

-- ====================================================================
-- SUSCRIPCIÓN PARA LA ORGANIZACIÓN DEL SUPER_ADMIN
-- ====================================================================
-- El super_admin tiene plan "custom" con todos los módulos habilitados
-- Sin fecha de expiración (100 años en el futuro)
-- ====================================================================

INSERT INTO subscripciones (
    organizacion_id,
    plan_id,
    precio_actual,
    fecha_inicio,
    fecha_proximo_pago,
    estado,
    activa,
    periodo_facturacion,
    auto_renovacion,
    modulos_activos
) VALUES (
    1,  -- Org del super_admin
    (SELECT id FROM planes_subscripcion WHERE codigo_plan = 'custom'),
    0.00,  -- Sin costo
    NOW(),
    NOW() + INTERVAL '100 years',  -- No expira
    'activa',
    true,
    'mensual',
    true,
    '{"core": true, "agendamiento": true, "inventario": true, "pos": true, "comisiones": true, "chatbots": true, "marketplace": true}'::jsonb
) ON CONFLICT (organizacion_id) DO NOTHING;
