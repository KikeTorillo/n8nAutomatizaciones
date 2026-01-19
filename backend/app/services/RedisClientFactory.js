/**
 * @fileoverview Factory para clientes Redis
 *
 * Centraliza la creación y gestión de clientes Redis para evitar
 * código duplicado entre servicios (tokenBlacklist, permisosCache, etc.)
 *
 * Bases de datos Redis:
 * - DB 3: Token blacklist
 * - DB 4: Cache de permisos
 * - DB 5: Cache general
 *
 * @author Backend Team
 * @version 1.0.0
 * @since 2026-01-18
 */

const redis = require('redis');
const logger = require('../utils/logger');

/**
 * Factory para crear y gestionar clientes Redis
 *
 * Mantiene un pool de clientes por base de datos para reutilización
 * y proporciona fallback en memoria cuando Redis no está disponible.
 *
 * @class RedisClientFactory
 */
class RedisClientFactory {
    /** @type {Map<string, import('redis').RedisClientType>} Clientes Redis por DB */
    static clients = new Map();

    /** @type {Map<string, Map>} Stores de fallback por servicio */
    static fallbackStores = new Map();

    /** @type {Map<string, boolean>} Listeners registrados por cliente */
    static listenersRegistered = new Map();

    /**
     * Obtiene o crea un cliente Redis para una base de datos específica
     *
     * @async
     * @param {number} database - Número de BD Redis (3=blacklist, 4=permisos, 5=cache)
     * @param {string} serviceName - Nombre del servicio para logs
     * @returns {Promise<import('redis').RedisClientType|null>} Cliente Redis o null si no disponible
     *
     * @example
     * const client = await RedisClientFactory.getClient(4, 'PermisosCacheService');
     * if (client) {
     *   await client.set('key', 'value');
     * }
     */
    static async getClient(database, serviceName) {
        const key = `db${database}`;

        // Retornar cliente existente si ya está conectado
        if (this.clients.has(key)) {
            const existingClient = this.clients.get(key);
            if (existingClient && existingClient.isOpen) {
                return existingClient;
            }
            // Cliente cerrado, limpiar y reconectar
            this.clients.delete(key);
            this.listenersRegistered.delete(key);
        }

        // Redis no configurado
        if (!process.env.REDIS_HOST) {
            logger.info(`[${serviceName}] Redis no configurado, usando fallback en memoria`);
            return null;
        }

        try {
            const client = redis.createClient({
                socket: {
                    host: process.env.REDIS_HOST,
                    port: parseInt(process.env.REDIS_PORT) || 6379
                },
                password: process.env.REDIS_PASSWORD || undefined,
                database
            });

            // Registrar listeners solo una vez por cliente
            if (!this.listenersRegistered.get(key)) {
                client.on('error', (err) => {
                    logger.error(`[Redis:${serviceName}] Error`, { error: err.message });
                });

                client.on('ready', () => {
                    logger.info(`[Redis:${serviceName}] Conectado (DB ${database})`);
                });

                client.on('reconnecting', () => {
                    logger.debug(`[Redis:${serviceName}] Reconectando...`);
                });

                this.listenersRegistered.set(key, true);
            }

            await client.connect();
            this.clients.set(key, client);

            logger.debug(`[RedisClientFactory] Cliente creado`, {
                serviceName,
                database,
                host: process.env.REDIS_HOST
            });

            return client;
        } catch (error) {
            logger.error(`[${serviceName}] Error conectando Redis`, {
                error: error.message,
                database
            });
            return null;
        }
    }

    /**
     * Crea un cliente duplicado para Pub/Sub
     *
     * Redis requiere un cliente separado para suscripciones porque
     * un cliente suscrito no puede ejecutar otros comandos.
     *
     * @async
     * @param {number} database - Número de BD Redis
     * @param {string} serviceName - Nombre del servicio para logs
     * @returns {Promise<import('redis').RedisClientType|null>} Cliente duplicado o null
     *
     * @example
     * const subscriber = await RedisClientFactory.createSubscriber(4, 'PermisosPubSub');
     * await subscriber.subscribe('channel', (message) => handleMessage(message));
     */
    static async createSubscriber(database, serviceName) {
        const mainClient = await this.getClient(database, serviceName);
        if (!mainClient) {
            return null;
        }

        try {
            const subscriber = mainClient.duplicate();
            await subscriber.connect();

            logger.debug(`[RedisClientFactory] Subscriber creado`, {
                serviceName,
                database
            });

            return subscriber;
        } catch (error) {
            logger.error(`[${serviceName}] Error creando subscriber`, {
                error: error.message,
                database
            });
            return null;
        }
    }

    /**
     * Obtiene store en memoria como fallback
     *
     * @param {string} serviceName - Nombre del servicio
     * @returns {Map} Store de fallback en memoria
     *
     * @example
     * const fallback = RedisClientFactory.getFallbackStore('TokenBlacklist');
     * fallback.set('token123', { timestamp: Date.now() });
     */
    static getFallbackStore(serviceName) {
        if (!this.fallbackStores.has(serviceName)) {
            this.fallbackStores.set(serviceName, new Map());
        }
        return this.fallbackStores.get(serviceName);
    }

    /**
     * Verifica si Redis está disponible para una BD específica
     *
     * @param {number} database - Número de BD Redis
     * @returns {boolean} true si el cliente está conectado y listo
     */
    static isAvailable(database) {
        const key = `db${database}`;
        const client = this.clients.get(key);
        return client?.isOpen ?? false;
    }

    /**
     * Cierra un cliente Redis específico
     *
     * @async
     * @param {number} database - Número de BD Redis
     */
    static async closeClient(database) {
        const key = `db${database}`;
        const client = this.clients.get(key);

        if (client && client.isOpen) {
            try {
                client.removeAllListeners();
                await client.quit();
                logger.debug(`[RedisClientFactory] Cliente cerrado (DB ${database})`);
            } catch (e) {
                logger.warn(`[RedisClientFactory] Error cerrando cliente DB ${database}`, {
                    error: e.message
                });
            }
        }

        this.clients.delete(key);
        this.listenersRegistered.delete(key);
    }

    /**
     * Cierra todos los clientes Redis
     *
     * Debe llamarse durante el graceful shutdown del servidor.
     *
     * @async
     */
    static async closeAll() {
        logger.info('[RedisClientFactory] Cerrando todos los clientes...');

        for (const [key, client] of this.clients) {
            try {
                if (client && client.isOpen) {
                    client.removeAllListeners();
                    await client.quit();
                    logger.debug(`[RedisClientFactory] Cliente ${key} cerrado`);
                }
            } catch (e) {
                logger.warn(`[RedisClientFactory] Error cerrando ${key}`, { error: e.message });
            }
        }

        this.clients.clear();
        this.listenersRegistered.clear();
        this.fallbackStores.clear();

        logger.info('[RedisClientFactory] Todos los clientes cerrados');
    }
}

module.exports = RedisClientFactory;
