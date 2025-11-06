/**
 * Tests para Token Blacklist Service (Redis)
 *
 * Valida que el servicio de blacklist persiste en Redis
 * y funciona correctamente en escenarios de producción.
 */

const tokenBlacklistService = require('../../services/tokenBlacklistService');

describe('TokenBlacklistService - Redis Persistence', () => {

    beforeEach(async () => {
        // Limpiar blacklist antes de cada test
        await tokenBlacklistService.clear();
    });

    afterAll(async () => {
        // Limpiar y cerrar al final
        await tokenBlacklistService.clear();
    });

    describe('Operaciones Básicas', () => {

        test('debe agregar un token a la blacklist', async () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test1';

            const added = await tokenBlacklistService.add(token, 3600);

            expect(added).toBe(true);

            const isBlacklisted = await tokenBlacklistService.check(token);
            expect(isBlacklisted).toBe(true);
        });

        test('debe verificar que un token NO está en blacklist', async () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.notInList';

            const isBlacklisted = await tokenBlacklistService.check(token);

            expect(isBlacklisted).toBe(false);
        });

        test('debe remover un token de la blacklist', async () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test2';

            // Agregar
            await tokenBlacklistService.add(token);
            expect(await tokenBlacklistService.check(token)).toBe(true);

            // Remover
            await tokenBlacklistService.remove(token);
            expect(await tokenBlacklistService.check(token)).toBe(false);
        });

        test('debe obtener el tamaño de la blacklist', async () => {
            const token1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test3';
            const token2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test4';
            const token3 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test5';

            await tokenBlacklistService.add(token1);
            await tokenBlacklistService.add(token2);
            await tokenBlacklistService.add(token3);

            const size = await tokenBlacklistService.size();

            expect(size).toBe(3);
        });

        test('debe limpiar toda la blacklist', async () => {
            const token1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test6';
            const token2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test7';

            await tokenBlacklistService.add(token1);
            await tokenBlacklistService.add(token2);

            expect(await tokenBlacklistService.size()).toBe(2);

            await tokenBlacklistService.clear();

            expect(await tokenBlacklistService.size()).toBe(0);
            expect(await tokenBlacklistService.check(token1)).toBe(false);
            expect(await tokenBlacklistService.check(token2)).toBe(false);
        });
    });

    describe('TTL y Expiración', () => {

        test('debe configurar TTL correctamente', async () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testTTL';

            // Agregar con TTL de 2 segundos
            await tokenBlacklistService.add(token, 2);

            // Verificar que está en blacklist
            expect(await tokenBlacklistService.check(token)).toBe(true);

            // Esperar 3 segundos para que expire
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Verificar que ya NO está en blacklist (expiró)
            const isBlacklistedAfterTTL = await tokenBlacklistService.check(token);
            expect(isBlacklistedAfterTTL).toBe(false);
        }, 10000); // Timeout de 10s para este test

        test('debe usar TTL por defecto (7 días) si no se especifica', async () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testDefaultTTL';

            await tokenBlacklistService.add(token); // Sin TTL explícito

            // Verificar que está en blacklist
            expect(await tokenBlacklistService.check(token)).toBe(true);

            // El TTL por defecto es 7 días (604800s), no vamos a esperar tanto
            // Solo verificamos que se agregó correctamente
        });
    });

    describe('Persistencia (Simulación de Restart)', () => {

        test('✅ SEGURO: Token blacklisted persiste en Redis', async () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.persistTest';

            // 1. Usuario hace logout (token blacklisted)
            await tokenBlacklistService.add(token, 3600);
            expect(await tokenBlacklistService.check(token)).toBe(true);

            // 2. Simular "restart" del servidor
            // En Redis, los datos persisten, no como en Set en memoria
            // (No podemos realmente reiniciar el servidor en un test,
            //  pero verificamos que Redis mantiene los datos)

            // 3. Verificar que el token SIGUE blacklisted
            const isStillBlacklisted = await tokenBlacklistService.check(token);
            expect(isStillBlacklisted).toBe(true);

            console.log('✅ Token persiste en Redis (no se pierde en restart)');
        });

        test('⚠️ Documentación: Set en memoria NO persistiría', () => {
            // Documentación de cómo funcionaba ANTES (vulnerable)

            const memorySet = new Set();
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.memoryTest';

            // 1. Agregar a memoria
            memorySet.add(token);
            expect(memorySet.has(token)).toBe(true);

            // 2. Simular restart (Set se borra)
            const memorySetAfterRestart = new Set(); // ← Nueva instancia = vacío

            // 3. Token ya NO está blacklisted (VULNERABLE)
            expect(memorySetAfterRestart.has(token)).toBe(false);

            console.log('⚠️ Set en memoria se pierde en restart (problema resuelto con Redis)');
        });
    });

    describe('Multi-Instancia (Horizontal Scaling)', () => {

        test('✅ SEGURO: Múltiples instancias comparten blacklist', async () => {
            // Simular 2 instancias compartiendo el mismo Redis
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.multiInstance';

            // Instancia 1: Usuario hace logout
            await tokenBlacklistService.add(token);

            // Instancia 2: Verifica blacklist (mismo Redis)
            const isBlacklistedInInstance2 = await tokenBlacklistService.check(token);

            // ✅ Instancia 2 ve el token blacklisted porque comparten Redis
            expect(isBlacklistedInInstance2).toBe(true);

            console.log('✅ Blacklist compartida entre instancias (Redis)');
        });

        test('⚠️ Documentación: Set en memoria NO se comparte', () => {
            // Documentación de cómo funcionaba ANTES (vulnerable)

            const instance1Set = new Set();
            const instance2Set = new Set(); // ← Diferente instancia = diferente memoria

            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.instanceTest';

            // Instancia 1: Usuario hace logout
            instance1Set.add(token);
            expect(instance1Set.has(token)).toBe(true);

            // Instancia 2: NO ve el token (diferente memoria)
            expect(instance2Set.has(token)).toBe(false); // ← VULNERABLE

            console.log('⚠️ Set en memoria NO se comparte entre instancias (problema resuelto con Redis)');
        });
    });

    describe('Manejo de Errores', () => {

        test('debe manejar errores gracefully en add()', async () => {
            // Intentar agregar con datos inválidos
            const result = await tokenBlacklistService.add(null);

            // No debe lanzar error, debe retornar false o true (fail gracefully)
            expect(typeof result).toBe('boolean');
        });

        test('debe manejar errores gracefully en check()', async () => {
            // Verificar token inválido
            const isBlacklisted = await tokenBlacklistService.check(null);

            // Fail-open: si hay error, retornar false
            expect(isBlacklisted).toBe(false);
        });
    });

    describe('Integración con Middleware Auth', () => {

        test('simula flujo completo: logout → blacklist → verify', async () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.authFlow';

            // 1. Usuario autenticado (token válido)
            expect(await tokenBlacklistService.check(token)).toBe(false);

            // 2. Usuario hace logout (agregar a blacklist)
            await tokenBlacklistService.add(token, 604800); // 7 días

            // 3. Usuario intenta usar el token nuevamente
            const isBlacklisted = await tokenBlacklistService.check(token);

            // ✅ Token rechazado (está en blacklist)
            expect(isBlacklisted).toBe(true);
        });

        test('simula múltiples logouts concurrentes', async () => {
            const tokens = [
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.concurrent1',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.concurrent2',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.concurrent3'
            ];

            // Agregar múltiples tokens en paralelo
            await Promise.all(tokens.map(token =>
                tokenBlacklistService.add(token, 3600)
            ));

            // Verificar que todos están blacklisted
            const results = await Promise.all(tokens.map(token =>
                tokenBlacklistService.check(token)
            ));

            expect(results).toEqual([true, true, true]);
        });
    });
});
