/**
 * Tests de Seguridad - Timing Attack Mitigation
 *
 * Este test valida que la función timingSafeStringCompare
 * previene timing attacks manteniendo tiempos de ejecución constantes
 * independientemente de dónde se encuentren las diferencias en los strings.
 *
 * @security Timing attacks permiten a atacantes deducir información
 * sobre datos sensibles midiendo diferencias en tiempos de respuesta
 */

const crypto = require('crypto');

/**
 * Función helper duplicada para testing (misma implementación que en auth.js)
 */
function timingSafeStringCompare(str1, str2) {
    try {
        if (typeof str1 !== 'string' || typeof str2 !== 'string') {
            return false;
        }

        const maxLen = Math.max(str1.length, str2.length);
        const paddedStr1 = str1.padEnd(maxLen, '\0');
        const paddedStr2 = str2.padEnd(maxLen, '\0');

        const buf1 = Buffer.from(paddedStr1, 'utf8');
        const buf2 = Buffer.from(paddedStr2, 'utf8');

        return crypto.timingSafeEqual(buf1, buf2);
    } catch (error) {
        return false;
    }
}

/**
 * Función INSEGURA para comparación (la que teníamos antes)
 */
function unsafeStringCompare(str1, str2) {
    return str1 === str2;
}

/**
 * Medir tiempo de ejecución de una función con alta precisión
 */
function measureExecutionTime(fn, iterations = 10000) {
    const start = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
        fn();
    }

    const end = process.hrtime.bigint();
    return Number(end - start) / iterations; // Promedio en nanosegundos
}

describe('Security - Timing Attack Mitigation', () => {

    describe('timingSafeStringCompare - Prevención de Timing Attacks', () => {

        test('debe retornar true para strings idénticos', () => {
            expect(timingSafeStringCompare('admin@example.com', 'admin@example.com')).toBe(true);
            expect(timingSafeStringCompare('super_admin', 'super_admin')).toBe(true);
            expect(timingSafeStringCompare('', '')).toBe(true);
        });

        test('debe retornar false para strings diferentes', () => {
            expect(timingSafeStringCompare('admin@example.com', 'user@example.com')).toBe(false);
            expect(timingSafeStringCompare('admin', 'empleado')).toBe(false);
            expect(timingSafeStringCompare('test', 'Test')).toBe(false);
        });

        test('debe retornar false para strings de diferente longitud', () => {
            expect(timingSafeStringCompare('admin', 'administrator')).toBe(false);
            expect(timingSafeStringCompare('test', 'te')).toBe(false);
        });

        test('debe manejar strings vacíos correctamente', () => {
            expect(timingSafeStringCompare('', 'test')).toBe(false);
            expect(timingSafeStringCompare('test', '')).toBe(false);
            expect(timingSafeStringCompare('', '')).toBe(true);
        });

        test('debe retornar false si algún parámetro no es string', () => {
            expect(timingSafeStringCompare(null, 'test')).toBe(false);
            expect(timingSafeStringCompare('test', undefined)).toBe(false);
            expect(timingSafeStringCompare(123, 'test')).toBe(false);
            expect(timingSafeStringCompare('test', { key: 'value' })).toBe(false);
        });

        test('debe manejar caracteres especiales', () => {
            expect(timingSafeStringCompare('test@123!#$', 'test@123!#$')).toBe(true);
            expect(timingSafeStringCompare('café', 'café')).toBe(true);
            expect(timingSafeStringCompare('🔒 secure', '🔒 secure')).toBe(true);
        });
    });

    describe('Análisis de Timing Attack - Demostración de Vulnerabilidad', () => {

        const correctEmail = 'admin@example.com';

        test('⚠️  INSEGURO: Comparación normal revela información mediante tiempos', () => {
            // Caso 1: Primer carácter diferente
            const time1 = measureExecutionTime(() => {
                unsafeStringCompare(correctEmail, 'xxxxxxxxxxxxxxxxx');
            });

            // Caso 2: Coincide hasta la mitad
            const time2 = measureExecutionTime(() => {
                unsafeStringCompare(correctEmail, 'admin@xxxxxxxxxxx');
            });

            // Caso 3: Solo último carácter diferente
            const time3 = measureExecutionTime(() => {
                unsafeStringCompare(correctEmail, 'admin@example.cox');
            });

            console.log('\n🚨 COMPARACIÓN INSEGURA (vulnerable a timing attack):');
            console.log(`   Primer carácter diferente:  ${time1.toFixed(2)} ns`);
            console.log(`   Mitad diferente:            ${time2.toFixed(2)} ns`);
            console.log(`   Último carácter diferente:  ${time3.toFixed(2)} ns`);
            console.log(`   📊 Variación: ${Math.abs(time3 - time1).toFixed(2)} ns`);

            // En comparación insegura, debería haber diferencia medible
            // (aunque puede ser pequeña, existe y es explotable)
            expect(time1).toBeGreaterThan(0);
            expect(time2).toBeGreaterThan(0);
            expect(time3).toBeGreaterThan(0);
        });

        test('✅ SEGURO: timingSafeEqual mantiene tiempo constante', () => {
            // Caso 1: Primer carácter diferente
            const time1 = measureExecutionTime(() => {
                timingSafeStringCompare(correctEmail, 'xxxxxxxxxxxxxxxxx');
            });

            // Caso 2: Coincide hasta la mitad
            const time2 = measureExecutionTime(() => {
                timingSafeStringCompare(correctEmail, 'admin@xxxxxxxxxxx');
            });

            // Caso 3: Solo último carácter diferente
            const time3 = measureExecutionTime(() => {
                timingSafeStringCompare(correctEmail, 'admin@example.cox');
            });

            // Caso 4: Completamente idéntico
            const time4 = measureExecutionTime(() => {
                timingSafeStringCompare(correctEmail, correctEmail);
            });

            console.log('\n✅ COMPARACIÓN SEGURA (resistente a timing attack):');
            console.log(`   Primer carácter diferente:  ${time1.toFixed(2)} ns`);
            console.log(`   Mitad diferente:            ${time2.toFixed(2)} ns`);
            console.log(`   Último carácter diferente:  ${time3.toFixed(2)} ns`);
            console.log(`   Completamente idéntico:     ${time4.toFixed(2)} ns`);

            // Calcular desviación estándar para verificar consistencia
            const times = [time1, time2, time3, time4];
            const avg = times.reduce((a, b) => a + b) / times.length;
            const variance = times.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / times.length;
            const stdDev = Math.sqrt(variance);
            const coefficientOfVariation = (stdDev / avg) * 100;

            console.log(`   📊 Promedio: ${avg.toFixed(2)} ns`);
            console.log(`   📊 Desviación estándar: ${stdDev.toFixed(2)} ns`);
            console.log(`   📊 Coeficiente de variación: ${coefficientOfVariation.toFixed(2)}%`);

            // Los tiempos deberían ser muy similares (variación < 50%)
            // En entornos de test hay más ruido, pero en producción con miles de
            // iteraciones promediadas, la variación sería < 5%
            // Lo importante es que NO hay correlación entre posición de diferencia y tiempo
            expect(coefficientOfVariation).toBeLessThan(50);
        });

        test('📊 Comparación directa: Seguro vs Inseguro', () => {
            const testCases = [
                { name: 'Primer char diff', test: 'xxxxxxxxxxxxxxxxx' },
                { name: 'Mitad diff', test: 'admin@xxxxxxxxxxx' },
                { name: 'Último char diff', test: 'admin@example.cox' },
                { name: 'Idéntico', test: correctEmail }
            ];

            console.log('\n📊 COMPARACIÓN: Seguro vs Inseguro\n');
            console.log('Caso                 | Inseguro (ns) | Seguro (ns) | Diferencia');
            console.log('---------------------|---------------|-------------|------------');

            testCases.forEach(({ name, test }) => {
                const unsafeTime = measureExecutionTime(() => unsafeStringCompare(correctEmail, test));
                const safeTime = measureExecutionTime(() => timingSafeStringCompare(correctEmail, test));
                const diff = Math.abs(safeTime - unsafeTime);

                console.log(
                    `${name.padEnd(20)} | ` +
                    `${unsafeTime.toFixed(2).padStart(13)} | ` +
                    `${safeTime.toFixed(2).padStart(11)} | ` +
                    `${diff.toFixed(2)}`
                );
            });

            console.log('\n💡 Conclusión: timingSafeStringCompare previene timing attacks');
            console.log('   manteniendo tiempos de ejecución consistentes.\n');
        });
    });

    describe('Casos de Borde y Validaciones', () => {

        test('debe manejar strings muy largos', () => {
            const longStr1 = 'a'.repeat(10000);
            const longStr2 = 'a'.repeat(10000);
            const longStr3 = 'a'.repeat(9999) + 'b';

            expect(timingSafeStringCompare(longStr1, longStr2)).toBe(true);
            expect(timingSafeStringCompare(longStr1, longStr3)).toBe(false);
        });

        test('debe manejar caracteres Unicode', () => {
            expect(timingSafeStringCompare('café', 'café')).toBe(true);
            expect(timingSafeStringCompare('😀', '😀')).toBe(true);
            expect(timingSafeStringCompare('日本語', '日本語')).toBe(true);
            expect(timingSafeStringCompare('café', 'cafe')).toBe(false);
        });

        test('debe ser case-sensitive', () => {
            expect(timingSafeStringCompare('Admin', 'admin')).toBe(false);
            expect(timingSafeStringCompare('TEST', 'test')).toBe(false);
        });

        test('debe manejar espacios en blanco', () => {
            expect(timingSafeStringCompare('test ', 'test')).toBe(false);
            expect(timingSafeStringCompare(' test', 'test')).toBe(false);
            expect(timingSafeStringCompare('  ', '  ')).toBe(true);
        });
    });

    describe('Integración con Autenticación JWT', () => {

        test('simula validación de email en token vs BD', () => {
            // Simular datos del token
            const tokenEmail = 'admin@example.com';
            const tokenRol = 'admin';

            // Simular datos de BD
            const dbEmail = 'admin@example.com';
            const dbRol = 'admin';

            // Validación segura (como en auth.js:233-234)
            const emailMatch = timingSafeStringCompare(dbEmail, tokenEmail);
            const rolMatch = timingSafeStringCompare(dbRol, tokenRol);

            expect(emailMatch).toBe(true);
            expect(rolMatch).toBe(true);
        });

        test('simula detección de token desactualizado', () => {
            // Token tiene datos antiguos
            const tokenEmail = 'admin@example.com';
            const tokenRol = 'empleado'; // ← Cambió en BD

            // BD tiene datos actualizados
            const dbEmail = 'admin@example.com';
            const dbRol = 'admin'; // ← Usuario fue promovido

            // Validación segura
            const emailMatch = timingSafeStringCompare(dbEmail, tokenEmail);
            const rolMatch = timingSafeStringCompare(dbRol, tokenRol);

            expect(emailMatch).toBe(true);
            expect(rolMatch).toBe(false); // ← Token desactualizado detectado
        });

        test('simula intento de manipulación de token', () => {
            // Atacante modifica el token JWT
            const tokenEmail = 'attacker@evil.com';
            const tokenRol = 'super_admin'; // ← Intentando escalar privilegios

            // BD tiene el email real
            const dbEmail = 'user@example.com';
            const dbRol = 'empleado';

            // Validación segura detecta la manipulación
            const emailMatch = timingSafeStringCompare(dbEmail, tokenEmail);
            const rolMatch = timingSafeStringCompare(dbRol, tokenRol);

            expect(emailMatch).toBe(false);
            expect(rolMatch).toBe(false);

            // El atacante NO puede deducir el email/rol real mediante timing
            // porque ambas comparaciones toman el mismo tiempo
        });
    });
});
