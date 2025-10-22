/**
 * Tests de Integración E2E - Flujo de Onboarding
 *
 * Valida el flujo completo de onboarding usando endpoints reales:
 * 1. POST /organizaciones/register → Crea org + admin + token
 * 2. POST /profesionales → Crea profesional
 * 3. POST /horarios-profesionales/semanales-estandar → Crea horarios batch
 * 4. POST /servicios → Crea servicio asociado
 */

const request = require('supertest');
const saasApp = require('../../app');
const app = saasApp.getExpressApp();
const { cleanAllTables } = require('../helpers/db-helper');

describe('E2E - Flujo de Onboarding Completo', () => {
    let client;

    beforeAll(async () => {
        client = await global.testPool.connect();
        await cleanAllTables(client);
    });

    afterAll(async () => {
        await cleanAllTables(client);
        client.release();
    });

    describe('TC-01: Onboarding Completo Exitoso (Org + Admin + Profesional + Horarios + Servicio)', () => {
        let token;
        let organizacionId;
        let profesionalId;
        let servicioId;

        test('Paso 1: Registrar organización y admin → Obtener token', async () => {
            const response = await request(app)
                .post('/api/v1/organizaciones/register')
                .send({
                    organizacion: {
                        nombre_comercial: 'Barbería E2E Test',
                        tipo_industria: 'barberia',
                        plan: 'basico'
                    },
                    admin: {
                        nombre: 'Admin',
                        apellidos: 'E2E Test',
                        email: 'admin.e2e@test.com',
                        password: 'TestPass123!'
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('organizacion');
            expect(response.body.data).toHaveProperty('admin');
            expect(response.body.data.admin).toHaveProperty('token');

            // Guardar datos para siguientes pasos
            token = response.body.data.admin.token;
            organizacionId = response.body.data.organizacion.id;

            expect(token).toBeDefined();
            expect(organizacionId).toBeGreaterThan(0);

            // Validar estructura de organización
            expect(response.body.data.organizacion).toMatchObject({
                nombre_comercial: 'Barbería E2E Test',
                tipo_industria: 'barberia',
                plan_actual: 'basico',
                activo: true
            });

            // Validar estructura de admin
            expect(response.body.data.admin).toMatchObject({
                nombre: 'Admin',
                apellidos: 'E2E Test',
                email: 'admin.e2e@test.com',
                rol: 'admin'
            });
        });

        test('Paso 2: Crear profesional usando token del paso 1', async () => {
            const response = await request(app)
                .post('/api/v1/profesionales')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nombre_completo: 'Carlos Rodríguez',
                    tipo_profesional_id: 1, // barbero
                    email: 'carlos.e2e@test.com',
                    telefono: '5512345678',
                    activo: true
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');

            // Guardar profesional_id para siguientes pasos
            profesionalId = response.body.data.id;

            expect(profesionalId).toBeGreaterThan(0);
            expect(response.body.data).toMatchObject({
                organizacion_id: organizacionId, // RLS asignó automáticamente
                nombre_completo: 'Carlos Rodríguez',
                tipo_profesional_id: 1, // barbero
                email: 'carlos.e2e@test.com',
                activo: true
            });
        });

        test('Paso 3: Crear horarios semanales estándar (Lun-Vie) usando token', async () => {
            const response = await request(app)
                .post('/api/v1/horarios-profesionales/semanales-estandar')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    profesional_id: profesionalId,
                    dias: [1, 2, 3, 4, 5], // Lunes a Viernes
                    hora_inicio: '09:00',
                    hora_fin: '18:00',
                    tipo_horario: 'regular',
                    nombre_horario: 'Horario Laboral'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('horarios_creados');
            expect(response.body.data).toHaveProperty('horarios');

            // Validar que se crearon 5 horarios (Lun-Vie)
            expect(response.body.data.horarios_creados).toBe(5);
            expect(response.body.data.horarios).toHaveLength(5);

            // Validar estructura de cada horario
            response.body.data.horarios.forEach((horario, index) => {
                expect(horario).toMatchObject({
                    dia_semana: index + 1, // 1=Lun, 2=Mar, ..., 5=Vie
                    permite_citas: true,
                    activo: true
                });
                expect(horario.hora_inicio).toContain('09:00');
                expect(horario.hora_fin).toContain('18:00');
            });
        });

        test('Paso 4: Crear servicio asociado al profesional usando token', async () => {
            const response = await request(app)
                .post('/api/v1/servicios')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nombre: 'Corte Clásico E2E',
                    descripcion: 'Corte de cabello tradicional',
                    precio: 150.00,
                    duracion_minutos: 30,
                    profesionales_ids: [profesionalId], // Asociar con profesional creado
                    activo: true
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');

            // Guardar servicio_id
            servicioId = response.body.data.id;

            expect(servicioId).toBeGreaterThan(0);
            expect(response.body.data).toMatchObject({
                organizacion_id: organizacionId, // RLS asignó automáticamente
                nombre: 'Corte Clásico E2E',
                precio: "150.00", // PostgreSQL NUMERIC retorna como string
                duracion_minutos: 30,
                activo: true
            });

            // Validar que el profesional está asociado
            expect(response.body.data.profesionales).toHaveLength(1);
            expect(response.body.data.profesionales[0].id).toBe(profesionalId);
        });

        test('Validación Final: Token sigue siendo válido y puede acceder a dashboard', async () => {
            // Validar que el token sigue siendo válido obteniendo la organización
            const response = await request(app)
                .get(`/api/v1/organizaciones/${organizacionId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(organizacionId);
        });

        test('Validación Final: Base de datos contiene todos los registros', async () => {
            // Validar organizaciones
            const orgResult = await client.query(
                'SELECT COUNT(*) as count FROM organizaciones WHERE id = $1',
                [organizacionId]
            );
            expect(parseInt(orgResult.rows[0].count)).toBe(1);

            // Validar usuarios
            const userResult = await client.query(
                'SELECT COUNT(*) as count FROM usuarios WHERE organizacion_id = $1 AND rol = $2',
                [organizacionId, 'admin']
            );
            expect(parseInt(userResult.rows[0].count)).toBe(1);

            // Validar subscripciones
            const subsResult = await client.query(
                'SELECT COUNT(*) as count FROM subscripciones WHERE organizacion_id = $1',
                [organizacionId]
            );
            expect(parseInt(subsResult.rows[0].count)).toBe(1);

            // Validar profesionales
            const profResult = await client.query(
                'SELECT COUNT(*) as count FROM profesionales WHERE id = $1 AND organizacion_id = $2',
                [profesionalId, organizacionId]
            );
            expect(parseInt(profResult.rows[0].count)).toBe(1);

            // Validar horarios (debe haber 5: Lun-Vie)
            const horarioResult = await client.query(
                'SELECT COUNT(*) as count FROM horarios_profesionales WHERE profesional_id = $1 AND activo = true',
                [profesionalId]
            );
            expect(parseInt(horarioResult.rows[0].count)).toBe(5);

            // Validar servicios
            const servResult = await client.query(
                'SELECT COUNT(*) as count FROM servicios WHERE id = $1 AND organizacion_id = $2',
                [servicioId, organizacionId]
            );
            expect(parseInt(servResult.rows[0].count)).toBe(1);

            // Validar asociación servicio-profesional
            const assocResult = await client.query(
                'SELECT COUNT(*) as count FROM servicios_profesionales WHERE servicio_id = $1 AND profesional_id = $2',
                [servicioId, profesionalId]
            );
            expect(parseInt(assocResult.rows[0].count)).toBe(1);
        });
    });

    describe('TC-02: Onboarding Mínimo (Solo Org + Admin)', () => {
        let token;
        let organizacionId;

        beforeAll(async () => {
            await cleanAllTables(client);

            // Crear organización y admin en beforeAll para que el token sea válido
            const response = await request(app)
                .post('/api/v1/organizaciones/register')
                .send({
                    organizacion: {
                        nombre_comercial: 'Negocio Mínimo E2E',
                        tipo_industria: 'consultorio_medico',
                        plan: 'trial'
                    },
                    admin: {
                        nombre: 'Admin',
                        apellidos: 'Mínimo',
                        email: `admin.minimo.${Date.now()}@test.com`,
                        password: 'TestPass123!'
                    }
                });

            token = response.body.data.admin.token;
            organizacionId = response.body.data.organizacion.id;
        });

        test('Verificar que la organización y admin fueron creados exitosamente', async () => {
            expect(token).toBeDefined();
            expect(organizacionId).toBeGreaterThan(0);
        });

        test('Usuario puede hacer login y acceder a dashboard', async () => {
            const response = await request(app)
                .get(`/api/v1/organizaciones/${organizacionId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('Base de datos NO contiene profesionales ni servicios', async () => {
            // Validar que NO hay profesionales
            const profResult = await client.query(
                'SELECT COUNT(*) as count FROM profesionales WHERE organizacion_id = $1',
                [organizacionId]
            );
            expect(parseInt(profResult.rows[0].count)).toBe(0);

            // Validar que NO hay servicios
            const servResult = await client.query(
                'SELECT COUNT(*) as count FROM servicios WHERE organizacion_id = $1',
                [organizacionId]
            );
            expect(parseInt(servResult.rows[0].count)).toBe(0);

            // Validar que NO hay horarios
            const horarioResult = await client.query(
                'SELECT COUNT(*) as count FROM horarios_profesionales hp ' +
                'JOIN profesionales p ON hp.profesional_id = p.id ' +
                'WHERE p.organizacion_id = $1',
                [organizacionId]
            );
            expect(parseInt(horarioResult.rows[0].count)).toBe(0);
        });
    });

    describe('TC-03: Onboarding con Profesional pero Sin Servicio', () => {
        let token;
        let organizacionId;
        let profesionalId;

        beforeAll(async () => {
            await cleanAllTables(client);

            // Paso 1: Crear organización y admin
            const orgResponse = await request(app)
                .post('/api/v1/organizaciones/register')
                .send({
                    organizacion: {
                        nombre_comercial: 'Negocio Parcial E2E',
                        tipo_industria: 'spa',
                        plan: 'basico'
                    },
                    admin: {
                        nombre: 'Admin',
                        apellidos: 'Parcial',
                        email: `admin.parcial.${Date.now()}@test.com`,
                        password: 'TestPass123!'
                    }
                });

            token = orgResponse.body.data.admin.token;
            organizacionId = orgResponse.body.data.organizacion.id;

            // Paso 2: Crear profesional
            const profResponse = await request(app)
                .post('/api/v1/profesionales')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nombre_completo: 'Masajista E2E',
                    tipo_profesional_id: 10, // masajista (compatible con spa)
                    telefono: '5587654321', // Teléfono válido
                    activo: true
                })
                .expect(201);

            profesionalId = profResponse.body.data.id;

            // Paso 3: Crear horarios
            await request(app)
                .post('/api/v1/horarios-profesionales/semanales-estandar')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    profesional_id: profesionalId,
                    dias: [1, 2, 3], // Solo Lun, Mar, Mie
                    hora_inicio: '10:00',
                    hora_fin: '17:00',
                    tipo_horario: 'regular'
                });
        });

        test('Verificar que organización, admin, profesional y horarios fueron creados', async () => {
            expect(token).toBeDefined();
            expect(organizacionId).toBeGreaterThan(0);
            expect(profesionalId).toBeGreaterThan(0);
        });

        test('NO crear servicio → Usuario puede seguir usando el sistema', async () => {
            // Validar que puede acceder a su organización
            const response = await request(app)
                .get(`/api/v1/organizaciones/${organizacionId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
        });

        test('Base de datos contiene: org, admin, profesional, horarios. NO servicio', async () => {
            // ✅ Tiene profesional
            const profResult = await client.query(
                'SELECT COUNT(*) as count FROM profesionales WHERE id = $1',
                [profesionalId]
            );
            expect(parseInt(profResult.rows[0].count)).toBe(1);

            // ✅ Tiene horarios (3 días)
            const horarioResult = await client.query(
                'SELECT COUNT(*) as count FROM horarios_profesionales WHERE profesional_id = $1',
                [profesionalId]
            );
            expect(parseInt(horarioResult.rows[0].count)).toBe(3);

            // ❌ NO tiene servicios
            const servResult = await client.query(
                'SELECT COUNT(*) as count FROM servicios WHERE organizacion_id = $1',
                [organizacionId]
            );
            expect(parseInt(servResult.rows[0].count)).toBe(0);
        });
    });

    describe('TC-04: Validación de Seguridad - Token Inválido', () => {
        beforeAll(async () => {
            await cleanAllTables(client);
        });

        test('Intentar crear profesional sin token → 401 Unauthorized', async () => {
            const response = await request(app)
                .post('/api/v1/profesionales')
                .send({
                    nombre_completo: 'Test',
                    tipo_profesional_id: 1 // barbero
                });

            expect(response.status).toBe(401);
        });

        test('Intentar crear profesional con token inválido → 401 Unauthorized', async () => {
            const response = await request(app)
                .post('/api/v1/profesionales')
                .set('Authorization', 'Bearer token_falso_12345')
                .send({
                    nombre_completo: 'Test',
                    tipo_profesional_id: 1 // barbero
                });

            expect(response.status).toBe(401);
        });
    });

    describe('TC-05: Validación de Email Duplicado', () => {
        const emailDuplicado = 'duplicado@test.com';

        beforeAll(async () => {
            await cleanAllTables(client);
        });

        test('Crear primera organización con email específico → Exitoso', async () => {
            const response = await request(app)
                .post('/api/v1/organizaciones/register')
                .send({
                    organizacion: {
                        nombre_comercial: `Primera Org ${Date.now()}`,
                        tipo_industria: 'barberia',
                        plan: 'basico'
                    },
                    admin: {
                        nombre: 'Admin',
                        apellidos: 'Uno',
                        email: emailDuplicado,
                        password: 'TestPass123!'
                    }
                });

            expect(response.status).toBe(201);
        });

        test('Intentar crear segunda organización con mismo email → 409 Conflict', async () => {
            const response = await request(app)
                .post('/api/v1/organizaciones/register')
                .send({
                    organizacion: {
                        nombre_comercial: `Segunda Org ${Date.now()}`,
                        tipo_industria: 'spa',
                        plan: 'basico'
                    },
                    admin: {
                        nombre: 'Admin',
                        apellidos: 'Dos',
                        email: emailDuplicado, // ❌ Email duplicado
                        password: 'TestPass123!'
                    }
                });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('administrador ya está registrado');
        });
    });
});
