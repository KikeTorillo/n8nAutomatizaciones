/**
 * @fileoverview Servicio de Onboarding
 * @description Maneja la creación de organizaciones y configuración inicial
 * @version 1.0.0
 *
 * Responsabilidades:
 * - Completar onboarding de usuarios OAuth/registro
 * - Crear organización con configuración inicial
 * - Crear profesional vinculado (si aplica)
 * - Emitir eventos para efectos secundarios (dogfooding, rutas inventario)
 *
 * Este servicio usa el sistema de eventos para desacoplar:
 * - DogfoodingService (crear cliente en Nexo Team)
 * - RutasOperacionModel (crear rutas default)
 */

const logger = require('../utils/logger');
const RLSContextManager = require('../utils/rlsContextManager');
const SecureRandom = require('../utils/helpers/SecureRandom');
const { ErrorHelper } = require('../utils/helpers');
const authEvents = require('../events/authEvents');

class OnboardingService {

    /**
     * Completa el onboarding de un usuario creando su organización
     *
     * @param {number} userId - ID del usuario
     * @param {Object} orgData - Datos de la organización
     * @param {string} orgData.nombre_negocio - Nombre del negocio
     * @param {string} orgData.industria - Código de industria/categoría
     * @param {number|null} orgData.estado_id - ID del estado
     * @param {number|null} orgData.ciudad_id - ID de la ciudad
     * @param {boolean} orgData.soy_profesional - Si el usuario es profesional
     * @param {Object} orgData.modulos - Módulos seleccionados por el usuario
     * @returns {Promise<Object>} { usuario, organizacion }
     */
    static async completar(userId, orgData) {
        const {
            nombre_negocio,
            industria,
            estado_id,
            ciudad_id,
            soy_profesional = true,
            modulos = {}
        } = orgData;

        // Construir módulos activos con core siempre activo
        const modulosActivos = this._resolverModulos(modulos);

        const result = await RLSContextManager.transactionWithBypass(async (db) => {
            // 1. Obtener y validar usuario
            const usuario = await this._obtenerYValidarUsuario(db, userId);

            // 2. Resolver categoría desde industria
            const categoria_id = await this._resolverCategoria(db, industria);

            // 3. Crear organización
            const organizacion = await this._crearOrganizacion(db, {
                nombre_negocio,
                email_admin: usuario.email,
                categoria_id,
                estado_id,
                ciudad_id,
                modulosActivos
            });

            // 4. Asegurar roles default y obtener rol admin
            await db.query(`SELECT crear_roles_default_organizacion($1)`, [organizacion.id]);

            const rolResult = await db.query(
                `SELECT id, codigo, nombre, nivel_jerarquia FROM roles WHERE codigo = 'admin' AND organizacion_id = $1 LIMIT 1`,
                [organizacion.id]
            );
            const rol = rolResult.rows[0];

            if (!rol) {
                logger.error('[OnboardingService] No se encontró rol admin para org', {
                    organizacion_id: organizacion.id
                });
            }

            // 5. Actualizar usuario con organización y rol
            await db.query(`
                UPDATE usuarios
                SET organizacion_id = $1,
                    rol_id = $2,
                    onboarding_completado = TRUE,
                    actualizado_en = NOW()
                WHERE id = $3
            `, [organizacion.id, rol?.id, userId]);

            // 6. Crear profesional si corresponde
            if (soy_profesional) {
                await this._crearProfesionalVinculado(db, organizacion.id, usuario);
            }

            logger.info('[OnboardingService] Onboarding completado', {
                usuario_id: userId,
                organizacion_id: organizacion.id
            });

            return {
                usuario: {
                    id: userId,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    apellidos: usuario.apellidos,
                    organizacion_id: organizacion.id,
                    onboarding_completado: true,
                    rol_id: rol?.id,
                    rol_codigo: rol?.codigo,
                    rol_nombre: rol?.nombre,
                    nivel_jerarquia: rol?.nivel_jerarquia
                },
                organizacion
            };
        });

        // Emitir evento para efectos secundarios (dogfooding, rutas, etc.)
        if (result?.organizacion) {
            authEvents.emitOrganizacionCreada(result.organizacion, result.usuario);
        }

        return result;
    }

    /**
     * Crea una organización (sin vincular usuario)
     * Útil para crear organizaciones programáticamente
     *
     * @param {Object} orgData - Datos de la organización
     * @returns {Promise<Object>} Organización creada
     */
    static async crearOrganizacion(orgData) {
        return await RLSContextManager.withBypass(async (db) => {
            return await this._crearOrganizacion(db, orgData);
        });
    }

    // ========================================================================
    // MÉTODOS PRIVADOS
    // ========================================================================

    /**
     * Resuelve módulos activos con dependencias
     * @private
     */
    static _resolverModulos(modulos) {
        const modulosActivos = { core: true };

        // Agregar módulos seleccionados
        Object.entries(modulos).forEach(([key, value]) => {
            if (value === true) {
                modulosActivos[key] = true;
            }
        });

        // Auto-resolver dependencias
        if (modulosActivos.pos && !modulosActivos.inventario) {
            modulosActivos.inventario = true;
        }
        if (modulosActivos.marketplace && !modulosActivos.agendamiento) {
            modulosActivos.agendamiento = true;
        }
        if (modulosActivos.chatbots && !modulosActivos.agendamiento) {
            modulosActivos.agendamiento = true;
        }

        return modulosActivos;
    }

    /**
     * Obtiene y valida usuario para onboarding
     * @private
     */
    static async _obtenerYValidarUsuario(db, userId) {
        const result = await db.query(
            'SELECT id, email, nombre, apellidos, onboarding_completado FROM usuarios WHERE id = $1',
            [userId]
        );

        ErrorHelper.throwIfNotFound(result.rows[0], 'Usuario');

        const usuario = result.rows[0];

        if (usuario.onboarding_completado) {
            ErrorHelper.throwConflict('El onboarding ya fue completado');
        }

        return usuario;
    }

    /**
     * Resuelve ID de categoría desde código de industria
     * @private
     */
    static async _resolverCategoria(db, industria) {
        if (!industria) return null;

        const result = await db.query(
            'SELECT id FROM categorias WHERE codigo = $1 AND activo = TRUE LIMIT 1',
            [industria]
        );

        return result.rows[0]?.id || null;
    }

    /**
     * Crea la organización en la base de datos
     * @private
     */
    static async _crearOrganizacion(db, data) {
        const {
            nombre_negocio,
            email_admin,
            categoria_id,
            estado_id,
            ciudad_id,
            modulosActivos
        } = data;

        // Generar código de tenant único
        const codigoTenant = `org-${Date.now().toString(36)}`;
        const slug = nombre_negocio
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50) + '-' + SecureRandom.slugSuffix(4);

        const result = await db.query(`
            INSERT INTO organizaciones (
                codigo_tenant, slug, nombre_comercial, razon_social,
                email_admin, categoria_id, estado_id, ciudad_id,
                activo, modulos_activos
            ) VALUES ($1, $2, $3, $3, $4, $5, $6, $7, TRUE, $8)
            RETURNING id, codigo_tenant, slug, nombre_comercial
        `, [codigoTenant, slug, nombre_negocio, email_admin, categoria_id, estado_id, ciudad_id, modulosActivos]);

        return result.rows[0];
    }

    /**
     * Crea profesional vinculado al usuario
     * @private
     */
    static async _crearProfesionalVinculado(db, organizacionId, usuario) {
        const nombreCompleto = usuario.nombre +
            (usuario.apellidos ? ' ' + usuario.apellidos : '');

        await db.query(`
            INSERT INTO profesionales (
                organizacion_id, nombre_completo, email,
                usuario_id, activo
            ) VALUES ($1, $2, $3, $4, TRUE)
        `, [
            organizacionId,
            nombreCompleto,
            usuario.email,
            usuario.id
        ]);

        logger.info('[OnboardingService] Profesional vinculado creado', {
            organizacion_id: organizacionId,
            usuario_id: usuario.id
        });
    }
}

module.exports = OnboardingService;
