-- ====================================================================
-- 🎭 TIPOS Y ENUMERACIONES DEL SISTEMA SAAS
-- ====================================================================
--
-- Este archivo contiene todas las definiciones de tipos personalizados
-- y enumeraciones utilizadas en el sistema SaaS de agendamiento.
--
-- 📊 CONTENIDO:
-- • 9 ENUMs especializados para dominio de negocio
-- • Tipos personalizados reutilizables
-- • Documentación completa de valores y casos de uso
--
-- 🔄 ORDEN DE EJECUCIÓN: #1 (Requerido antes de crear tablas)
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
                      -- • Puede gestionar plantillas globales de servicios
                      -- • No requiere organizacion_id (único rol global)
                      -- • Acceso a métricas y configuraciones del sistema
                      -- • Puede crear, modificar y eliminar organizaciones

    -- 🟠 NIVEL 2: ADMINISTRADOR DE ORGANIZACIÓN
    'admin',          -- • Acceso completo a SU organización únicamente
                      -- • Puede gestionar usuarios, servicios y configuraciones
                      -- • Acceso a reportes y métricas de la organización
                      -- • Puede modificar configuración de marca y planes

    -- 🟡 NIVEL 3: PROPIETARIO DEL NEGOCIO
    'propietario',    -- • Dueño del negocio con permisos operativos completos
                      -- • Puede gestionar empleados y servicios
                      -- • Acceso a citas, clientes y reportes básicos
                      -- • Configuración de horarios y disponibilidad

    -- 🟢 NIVEL 4: EMPLEADO
    'empleado',       -- • Acceso limitado a funciones operativas
                      -- • Puede gestionar sus propias citas y horarios
                      -- • Acceso de solo lectura a clientes asignados
                      -- • Sin acceso a configuraciones administrativas

    -- 🔵 NIVEL 5: CLIENTE FINAL
    'cliente',        -- • Acceso muy limitado, principalmente lectura
                      -- • Puede ver sus propias citas y servicios
                      -- • Sin acceso a datos de otros clientes
                      -- • Interfaz simplificada para autoservicio

    -- 🤖 NIVEL 6: USUARIO BOT (SISTEMA)
    'bot'             -- • Usuario automático para chatbots de IA
                      -- • Creado automáticamente al crear una organización
                      -- • Acceso limitado a endpoints específicos para chatbots
                      -- • Solo operaciones de lectura y creación de citas/clientes
                      -- • No puede acceder a configuraciones administrativas
);

-- 📝 NOTAS IMPORTANTES SOBRE ROLES:
-- • La jerarquía permite herencia de permisos hacia abajo
-- • Solo super_admin puede tener organizacion_id = NULL
-- • Los roles se validan en RLS y en la aplicación
-- • Cambios de rol requieren validación adicional

-- ====================================================================
-- 🏭 ENUM INDUSTRIA_TIPO - SECTORES EMPRESARIALES SOPORTADOS
-- ====================================================================
-- Define los sectores de industria soportados por el sistema.
-- Cada industria tiene plantillas de servicios y validaciones específicas.
--
-- 📊 INDUSTRIAS ACTUALES: 11 sectores de servicios
-- 🔮 EXPANSIÓN: Fácil agregar nuevos sectores sin romper compatibilidad
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE industria_tipo AS ENUM (
    'barberia',           -- Barberías y peluquerías masculinas
    'salon_belleza',      -- Salones de belleza y peluquerías
    'estetica',           -- Centros de estética y tratamientos faciales
    'spa',                -- Spas y centros de relajación
    'podologia',          -- Consultorios podológicos
    'consultorio_medico', -- Consultorios médicos generales
    'academia',           -- Academias de enseñanza (idiomas, música, etc.)
    'taller_tecnico',     -- Talleres técnicos (autos, electrónicos, etc.)
    'centro_fitness',     -- Gimnasios y centros de fitness
    'veterinaria',        -- Clínicas veterinarias
    'otro'                -- Otras industrias no categorizadas
);

-- ====================================================================
-- 💰 ENUM PLAN_TIPO - PLANES DE SUBSCRIPCIÓN SAAS
-- ====================================================================
-- Define los 4 niveles de planes de subscripción con características
-- diferenciadas según el tamaño y necesidades del negocio.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE plan_tipo AS ENUM (
    'trial',              -- Plan de prueba gratuito (30 días típico)
    'basico',             -- Plan básico para negocios pequeños
    'profesional',        -- Plan avanzado para negocios en crecimiento
    'custom'              -- Plan personalizado con características específicas
);

-- ====================================================================
-- 📊 ENUM ESTADO_SUBSCRIPCION - CICLO DE VIDA DE SUBSCRIPCIONES
-- ====================================================================
-- Controla el estado actual de la subscripción de cada organización.
-- Impacta directamente en el acceso a funcionalidades del sistema.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_subscripcion AS ENUM (
    'activa',             -- Subscripción pagada y funcional
    'suspendida',         -- Temporalmente suspendida (problemas técnicos)
    'cancelada',          -- Cancelada por el cliente
    'trial',              -- En período de prueba gratuito
    'morosa'              -- Falta de pago, acceso limitado
);

-- ====================================================================
-- 📅 ENUM ESTADO_CITA - CICLO DE VIDA DE CITAS
-- ====================================================================
-- Define los 6 estados posibles de una cita desde su creación
-- hasta su finalización. Usado para workflow y reportes.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_cita AS ENUM (
    'pendiente',          -- Cita creada, esperando confirmación
    'confirmada',         -- Cita confirmada por el cliente
    'en_curso',           -- Cita en progreso (cliente presente)
    'completada',         -- Cita finalizada exitosamente
    'cancelada',          -- Cita cancelada (por cliente o negocio)
    'no_asistio'          -- Cliente no se presentó (no-show)
);

-- ====================================================================
-- ⏰ ENUM ESTADO_FRANJA - DISPONIBILIDAD HORARIA
-- ====================================================================
-- Controla la disponibilidad de franjas horarias específicas.
-- Usado para el sistema de reservas y gestión de calendario.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_franja AS ENUM (
    'disponible',         -- Franja libre para agendar
    'reservado_temporal', -- Reserva temporal (carrito de compras)
    'ocupado',            -- Franja con cita confirmada
    'bloqueado'           -- Franja bloqueada (descanso, mantenimiento)
);

-- ====================================================================
-- 👨‍⚕️ ENUM TIPO_PROFESIONAL - ROLES ESPECIALIZADOS POR INDUSTRIA
-- ====================================================================
-- Define los tipos de profesionales según la industria específica.
-- Cada valor está mapeado a una o más industrias compatibles.
--
-- 🎯 OBJETIVO: Garantizar consistencia entre el tipo de profesional
-- y la industria de la organización a la que pertenece.
--
-- 🔗 MAPEO INDUSTRIA → PROFESIONALES:
-- • barberia → barbero, estilista_masculino, estilista
-- • salon_belleza → estilista, colorista, manicurista
-- • estetica → esteticista, cosmetologo
-- • spa → masajista, terapeuta, aromaterapeuta
-- • podologia → podologo, asistente_podologia
-- • consultorio_medico → doctor_general, enfermero, recepcionista_medica
-- • academia → instructor, profesor, tutor
-- • taller_tecnico → tecnico_auto, tecnico_electronico, mecanico
-- • centro_fitness → entrenador_personal, instructor_yoga, nutricionista
-- • veterinaria → veterinario, asistente_veterinario, groomer
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE tipo_profesional AS ENUM (
    -- 💈 BARBERÍA Y PELUQUERÍA MASCULINA
    'barbero',                    -- Barbero tradicional
    'estilista_masculino',        -- Estilista especializado en hombres

    -- 💄 SALÓN DE BELLEZA
    'estilista',                  -- Estilista general
    'colorista',                  -- Especialista en coloración
    'manicurista',                -- Especialista en uñas
    'peinados_eventos',           -- Especialista en peinados para eventos

    -- ✨ ESTÉTICA
    'esteticista',                -- Profesional en tratamientos faciales
    'cosmetologo',                -- Especialista en cosmética avanzada
    'depilacion_laser',           -- Especialista en depilación láser

    -- 🧘 SPA Y RELAJACIÓN
    'masajista',                  -- Terapeuta de masajes
    'terapeuta_spa',              -- Terapeuta integral de spa
    'aromaterapeuta',             -- Especialista en aromaterapia
    'reflexologo',                -- Especialista en reflexología

    -- 🦶 PODOLOGÍA
    'podologo',                   -- Podólogo certificado
    'asistente_podologia',        -- Asistente de podología

    -- 🏥 CONSULTORIO MÉDICO
    'doctor_general',             -- Médico general
    'enfermero',                  -- Enfermero certificado
    'recepcionista_medica',       -- Recepcionista especializada

    -- 📚 ACADEMIA
    'instructor',                 -- Instructor general
    'profesor',                   -- Profesor especializado
    'tutor',                      -- Tutor personalizado

    -- 🔧 TALLER TÉCNICO
    'tecnico_auto',               -- Técnico automotriz
    'tecnico_electronico',        -- Técnico en electrónicos
    'mecanico',                   -- Mecánico general
    'soldador',                   -- Especialista en soldadura

    -- 💪 CENTRO FITNESS
    'entrenador_personal',        -- Entrenador personal certificado
    'instructor_yoga',            -- Instructor de yoga
    'instructor_pilates',         -- Instructor de pilates
    'nutricionista',              -- Nutricionista deportivo

    -- 🐕 VETERINARIA
    'veterinario',                -- Veterinario certificado
    'asistente_veterinario',      -- Asistente veterinario
    'groomer',                    -- Especialista en grooming

    -- 🔄 GENÉRICO
    'otro'                        -- Otros tipos no categorizados
);

-- ====================================================================
-- 🤖 ENUM PLATAFORMA_CHATBOT - PLATAFORMAS DE MENSAJERÍA SOPORTADAS
-- ====================================================================
-- Define las plataformas de mensajería donde se pueden desplegar
-- chatbots de IA para cada organización.
--
-- 📱 PLATAFORMAS ACTUALES: 7 canales principales
-- 🔮 EXPANSIÓN: Diseñado para agregar nuevas plataformas fácilmente
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE plataforma_chatbot AS ENUM (
    'telegram',           -- Telegram Bot API (bot_token)
    'whatsapp',           -- WhatsApp via Evolution API
    'instagram',          -- Instagram Direct Messages via Graph API
    'facebook_messenger', -- Facebook Messenger via Graph API
    'slack',              -- Slack Bot API
    'discord',            -- Discord Bot
    'otro'                -- Otras plataformas personalizadas
);

COMMENT ON TYPE plataforma_chatbot IS 'Plataformas de mensajería soportadas para chatbots de IA';

-- ====================================================================
-- 🟢 ENUM ESTADO_CHATBOT - CICLO DE VIDA DE CHATBOTS
-- ====================================================================
-- Define los estados del ciclo de vida de un chatbot desde su
-- configuración inicial hasta su desactivación.
--
-- 🔄 WORKFLOW: configurando → activo → pausado/error → desactivado
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_chatbot AS ENUM (
    'configurando',    -- En proceso de configuración inicial (credential + workflow)
    'activo',          -- Funcionando correctamente y procesando mensajes
    'error',           -- Error en workflow, credential inválida o API caída
    'pausado',         -- Pausado temporalmente por el usuario
    'desactivado'      -- Desactivado permanentemente (credential eliminada)
);

COMMENT ON TYPE estado_chatbot IS 'Estados del ciclo de vida de un chatbot de IA';
