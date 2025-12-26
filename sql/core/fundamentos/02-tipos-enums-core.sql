-- ====================================================================
-- 🏗️ MÓDULO: FUNDAMENTOS - TIPOS Y ENUMERACIONES CORE
-- ====================================================================
--
-- Descripción: ENUMs GENÉRICOS para cualquier SaaS multi-tenant
-- Dependencias: Ninguna (archivo base)
-- Orden: 02 (después de extensiones)
--
-- ⚠️ IMPORTANTE: SOLO incluir ENUMs UNIVERSALES
-- ENUMs específicos de dominio van en templates/
--
-- Contenido:
-- - rol_usuario ENUM (6 niveles de acceso - UNIVERSAL)
-- - plan_tipo ENUM (4 planes de subscripción - UNIVERSAL)
-- - estado_subscripcion ENUM (5 estados - UNIVERSAL)
-- - plataforma_chatbot ENUM (7 plataformas - UNIVERSAL)
--
-- ❌ REMOVIDOS (movidos a templates/):
-- - industria_tipo → tabla dinámica categorias_industria
-- - estado_cita → templates/scheduling-saas/
-- - estado_franja → templates/scheduling-saas/
-- - tipo_profesional → tabla dinámica en templates/
--
-- Fecha creación: 18 Noviembre 2025 (Refactor para SaaS Starter Kit)
-- ====================================================================

-- ====================================================================
-- 👥 ENUM ROL_USUARIO - JERARQUÍA DE PERMISOS
-- ====================================================================
-- Define los 6 niveles de acceso del sistema SaaS con jerarquía clara.
-- Cada rol tiene permisos específicos y restricciones definidas.
--
-- 🔑 JERARQUÍA DE ROLES (de mayor a menor privilegio):
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE rol_usuario AS ENUM (
    -- 🔴 NIVEL 1: SUPER ADMINISTRADOR
    'super_admin',    -- • Acceso total al sistema y todas las organizaciones
                      -- • Puede gestionar configuraciones globales
                      -- • No requiere organizacion_id (único rol global)
                      -- • Acceso a métricas y configuraciones del sistema
                      -- • Puede crear, modificar y eliminar organizaciones

    -- 🟠 NIVEL 2: ADMINISTRADOR DE ORGANIZACIÓN
    'admin',          -- • Acceso completo a SU organización únicamente
                      -- • Puede gestionar usuarios, configuraciones
                      -- • Acceso a reportes y métricas de la organización
                      -- • Puede modificar configuración de marca y planes

    -- 🟡 NIVEL 3: PROPIETARIO DEL NEGOCIO
    'propietario',    -- • Dueño del negocio con permisos operativos completos
                      -- • Puede gestionar empleados
                      -- • Acceso a reportes básicos
                      -- • Configuración operativa

    -- 🟢 NIVEL 4: EMPLEADO
    'empleado',       -- • Acceso limitado a funciones operativas
                      -- • Puede gestionar sus propias tareas
                      -- • Acceso de lectura limitado
                      -- • Sin acceso a configuraciones administrativas

    -- 🔵 NIVEL 5: CLIENTE FINAL
    'cliente',        -- • Acceso muy limitado, principalmente lectura
                      -- • Puede ver sus propios datos
                      -- • Sin acceso a datos de otros clientes
                      -- • Interfaz simplificada para autoservicio

    -- 🤖 NIVEL 6: USUARIO BOT (SISTEMA)
    'bot'             -- • Usuario automático para integraciones
                      -- • Creado automáticamente según necesidad
                      -- • Acceso limitado a endpoints específicos
                      -- • Solo operaciones definidas por el sistema
                      -- • No puede acceder a configuraciones administrativas
);

COMMENT ON TYPE rol_usuario IS 
'Roles de usuario del sistema con jerarquía de permisos definida. 
Usado en RLS y validación de acceso en toda la aplicación.';

-- ====================================================================
-- 💰 ENUM PLAN_TIPO - PLANES DE SUBSCRIPCIÓN SAAS
-- ====================================================================
-- Modelo de Negocio Estilo Odoo (Nov 2025):
-- • free: 1 App gratis a elegir, usuarios ilimitados
-- • pro: Todas las apps, $249 MXN/usuario/mes
-- • custom: Plan personalizado (precio negociado)
-- • trial: Período de prueba 14 días
-- • basico/profesional: LEGACY (inactivos)
--
-- 💡 NOTA: Los límites específicos se definen en tabla planes_subscripcion
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE plan_tipo AS ENUM (
    'trial',              -- Plan de prueba gratuito (14 días)
                          -- • Acceso a todas las apps para evaluar
                          -- • Límites reducidos
                          -- • Sin compromiso de pago

    'free',               -- Plan Free: 1 App gratis a elegir
                          -- • Usuario elige: Agendamiento, Inventario o POS
                          -- • Sin límites dentro de la app elegida
                          -- • Usuarios ilimitados, para siempre

    'pro',                -- Plan Pro: Todas las apps incluidas
                          -- • $249 MXN/usuario/mes (~$15 USD)
                          -- • Sin límites
                          -- • Soporte prioritario

    'basico',             -- [LEGACY] Plan básico para negocios pequeños
                          -- • NO disponible para nuevos clientes
                          -- • Solo clientes existentes

    'profesional',        -- [LEGACY] Plan avanzado para negocios en crecimiento
                          -- • NO disponible para nuevos clientes
                          -- • Solo clientes existentes

    'custom'              -- Plan personalizado con características específicas
                          -- • Límites personalizados
                          -- • Funcionalidades a medida
                          -- • Precios negociados
);

COMMENT ON TYPE plan_tipo IS 
'Tipos de planes de subscripción disponibles en el sistema. 
Los límites específicos (usuarios, recursos, etc.) se configuran 
en la tabla planes_subscripcion.';

-- ====================================================================
-- 📊 ENUM ESTADO_SUBSCRIPCION - CICLO DE VIDA DE SUBSCRIPCIONES
-- ====================================================================
-- Controla el estado actual de la subscripción de cada organización.
-- Impacta directamente en el acceso a funcionalidades del sistema.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_subscripcion AS ENUM (
    'activa',             -- Subscripción pagada y funcional
                          -- • Acceso completo según el plan
                          -- • Todas las funcionalidades disponibles
                          -- • Sin restricciones

    'suspendida',         -- Temporalmente suspendida
                          -- • Acceso de solo lectura
                          -- • No se pueden crear nuevos recursos
                          -- • Motivo: problemas técnicos o administrativos

    'cancelada',          -- Cancelada por el cliente
                          -- • Acceso limitado a exportación de datos
                          -- • No se pueden crear recursos
                          -- • Datos se preservan según política

    'trial',              -- En período de prueba gratuito
                          -- • Acceso completo según límites de trial
                          -- • Fecha de expiración definida
                          -- • Conversión automática o manual a plan pago

    'morosa'              -- Falta de pago, acceso limitado
                          -- • Solo lectura
                          -- • Notificaciones de pago pendiente
                          -- • Suspensión automática tras período de gracia
);

COMMENT ON TYPE estado_subscripcion IS 
'Estados del ciclo de vida de una subscripción. 
Determina el nivel de acceso y restricciones aplicadas 
a la organización en el sistema.';

-- ====================================================================
-- 🤖 ENUM PLATAFORMA_CHATBOT - PLATAFORMAS DE MENSAJERÍA
-- ====================================================================
-- Define las plataformas de chatbot soportadas para integraciones.
-- Usado en configuración de chatbots y credenciales.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE plataforma_chatbot AS ENUM (
    'telegram',           -- Telegram Bot API
                          -- • Bot token-based
                          -- • Webhooks o polling
                          -- • Rich media support

    'whatsapp',           -- WhatsApp Business Cloud API
                          -- • Meta Graph API v18.0+
                          -- • Webhooks obligatorios
                          -- • Plantillas pre-aprobadas

    'messenger',          -- Facebook Messenger
                          -- • Meta Graph API
                          -- • Webhooks
                          -- • Integración con páginas FB

    'instagram',          -- Instagram Direct Messages
                          -- • Meta Graph API
                          -- • Webhooks
                          -- • Integración con perfiles comerciales

    'discord',            -- Discord Bot API
                          -- • Bot token-based
                          -- • Gateway + REST API
                          -- • Slash commands support

    'slack',              -- Slack Bot API
                          -- • OAuth 2.0
                          -- • Webhooks + Events API
                          -- • App integrations

    'custom'              -- Plataforma personalizada o API genérica
                          -- • Configuración manual
                          -- • Webhooks custom
);

COMMENT ON TYPE plataforma_chatbot IS 
'Plataformas de mensajería soportadas para chatbots con IA. 
Cada plataforma tiene sus propios requisitos de configuración 
y credenciales en la tabla chatbot_credentials.';

-- ====================================================================
-- 👷 ENUM TIPO_EMPLEADO - ELIMINADO (Dic 2025)
-- ====================================================================
-- NOTA: Este ENUM fue eliminado porque no tenía función práctica.
-- La jerarquía de supervisión ahora se determina por el ROL del usuario:
--   - admin/propietario pueden supervisar
--   - empleado no puede supervisar
-- ====================================================================

-- ====================================================================
-- 📋 ENUM ESTADO_LABORAL - ESTADO DEL EMPLEADO
-- ====================================================================
-- Estados del ciclo laboral del empleado.
-- Impacta en disponibilidad para citas y acceso al sistema.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_laboral AS ENUM (
    'activo',             -- Trabajando normalmente
                          -- • Puede atender citas
                          -- • Acceso completo según rol

    'vacaciones',         -- En período vacacional
                          -- • No disponible para citas
                          -- • Sin acceso temporal al sistema

    'incapacidad',        -- Incapacidad médica
                          -- • No disponible para citas
                          -- • Puede tener acceso limitado

    'suspendido',         -- Suspensión temporal
                          -- • No disponible para citas
                          -- • Sin acceso al sistema

    'baja'                -- Ya no trabaja en la organización
                          -- • Registro histórico
                          -- • Sin acceso al sistema
                          -- • Requiere fecha_baja
);

COMMENT ON TYPE estado_laboral IS
'Estados del ciclo laboral del empleado. Impacta disponibilidad y acceso.
Estado "baja" requiere fecha_baja obligatoria.';

-- ====================================================================
-- 📄 ENUM TIPO_CONTRATACION - TIPO DE CONTRATO
-- ====================================================================
-- Modalidad de contratación del empleado.
-- Para gestión de nómina y RRHH.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE tipo_contratacion AS ENUM (
    'tiempo_completo',    -- Jornada completa (40+ hrs/semana)
                          -- • Beneficios completos
                          -- • Salario fijo mensual

    'medio_tiempo',       -- Media jornada (20 hrs/semana aprox)
                          -- • Beneficios proporcionales
                          -- • Horario reducido

    'temporal',           -- Contrato temporal
                          -- • Fecha de término definida
                          -- • Para cubrir ausencias o proyectos

    'contrato',           -- Por contrato/proyecto
                          -- • Entregables específicos
                          -- • Duración definida

    'freelance'           -- Independiente
                          -- • Honorarios por servicio
                          -- • Sin relación laboral formal
);

COMMENT ON TYPE tipo_contratacion IS
'Modalidad de contratación del empleado. Para gestión de nómina y RRHH.';

-- ====================================================================
-- 👤 ENUM GENERO - GÉNERO DEL EMPLEADO
-- ====================================================================
-- Género para información personal del empleado.
-- Opcional, con opción de no especificar.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE genero AS ENUM (
    'masculino',          -- Masculino
    'femenino',           -- Femenino
    'otro',               -- Otro / No binario
    'no_especificado'     -- Prefiere no especificar (default)
);

COMMENT ON TYPE genero IS
'Género del empleado. Campo opcional con default "no_especificado".';

-- ====================================================================
-- 📝 NOTAS FINALES
-- ====================================================================
-- • Estos ENUMs son UNIVERSALES para cualquier SaaS
-- • NO agregar ENUMs específicos de dominio aquí
-- • Para ENUMs de dominio, usar carpeta templates/
-- • Para catálogos dinámicos, usar tablas en lugar de ENUMs
-- ====================================================================
