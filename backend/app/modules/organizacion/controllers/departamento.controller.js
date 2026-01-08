const DepartamentoModel = require('../models/departamento.model');
const PuestoModel = require('../models/puesto.model');
const logger = require('../../../utils/logger');

class DepartamentoController {

    /**
     * POST /departamentos
     */
    static async crear(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const data = req.body;

            const departamento = await DepartamentoModel.crear(organizacionId, data);

            logger.info(`Departamento creado: ${departamento.nombre}`, {
                organizacionId,
                departamentoId: departamento.id,
                usuario: req.user.email
            });

            res.status(201).json({
                success: true,
                data: departamento
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /departamentos
     */
    static async listar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const filtros = {
                activo: req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : null,
                parent_id: req.query.parent_id !== undefined ? parseInt(req.query.parent_id) : null,
                limit: parseInt(req.query.limit) || 100,
                offset: parseInt(req.query.offset) || 0
            };

            const departamentos = await DepartamentoModel.listar(organizacionId, filtros);

            res.json({
                success: true,
                data: departamentos,
                meta: {
                    total: departamentos.length,
                    limit: filtros.limit,
                    offset: filtros.offset
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /departamentos/arbol
     */
    static async obtenerArbol(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const arbol = await DepartamentoModel.obtenerArbol(organizacionId);

            res.json({
                success: true,
                data: arbol
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /departamentos/:id
     */
    static async obtenerPorId(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;

            const departamento = await DepartamentoModel.buscarPorId(organizacionId, id);

            if (!departamento) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento no encontrado'
                });
            }

            res.json({
                success: true,
                data: departamento
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /departamentos/:id
     */
    static async actualizar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;
            const data = req.body;

            const departamento = await DepartamentoModel.actualizar(organizacionId, id, data);

            logger.info(`Departamento actualizado: ${departamento.nombre}`, {
                organizacionId,
                departamentoId: id,
                usuario: req.user.email
            });

            res.json({
                success: true,
                data: departamento
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /departamentos/:id
     */
    static async eliminar(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { id } = req.params;

            const eliminado = await DepartamentoModel.eliminar(organizacionId, id);

            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    error: 'Departamento no encontrado'
                });
            }

            logger.info(`Departamento eliminado: ${id}`, {
                organizacionId,
                departamentoId: id,
                usuario: req.user.email
            });

            res.json({
                success: true,
                message: 'Departamento eliminado correctamente'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /departamentos/seed-catalogos
     * Crea departamentos y puestos de ejemplo para la organización
     */
    static async seedCatalogos(req, res, next) {
        try {
            const organizacionId = req.tenant.organizacionId;
            const { forzar = false } = req.body;

            // Verificar si ya existen departamentos
            const departamentosExistentes = await DepartamentoModel.listar(organizacionId, { limit: 1 });

            if (departamentosExistentes.length > 0 && !forzar) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existen departamentos en esta organización. Usa { "forzar": true } para agregar de todos modos.'
                });
            }

            // Definir catálogos genéricos para negocios de servicios
            const departamentosBase = [
                { nombre: 'Dirección General', codigo: 'DIR', descripcion: 'Alta dirección y toma de decisiones estratégicas' },
                { nombre: 'Operaciones', codigo: 'OPS', descripcion: 'Prestación de servicios y atención al cliente' },
                { nombre: 'Administración', codigo: 'ADM', descripcion: 'Gestión administrativa y financiera' },
                { nombre: 'Recepción', codigo: 'REC', descripcion: 'Atención al cliente y agendamiento' },
                { nombre: 'Marketing', codigo: 'MKT', descripcion: 'Promoción y comunicación' }
            ];

            // Crear departamentos
            const departamentosCreados = [];
            const departamentosMap = {};

            for (const dep of departamentosBase) {
                try {
                    const creado = await DepartamentoModel.crear(organizacionId, dep);
                    departamentosCreados.push(creado);
                    departamentosMap[dep.codigo] = creado.id;
                } catch (error) {
                    // Si ya existe (por código o nombre), continuar
                    if (error.message.includes('duplicate') || error.code === '23505') {
                        logger.warn(`Departamento ${dep.nombre} ya existe, saltando...`);
                        continue;
                    }
                    throw error;
                }
            }

            // Definir puestos asociados a departamentos
            const puestosBase = [
                { nombre: 'Director General', codigo: 'DIR-01', departamento: 'DIR', descripcion: 'Líder de la organización' },
                { nombre: 'Gerente de Operaciones', codigo: 'OPS-01', departamento: 'OPS', descripcion: 'Responsable de la operación diaria' },
                { nombre: 'Profesional Senior', codigo: 'OPS-02', departamento: 'OPS', descripcion: 'Profesional con experiencia' },
                { nombre: 'Profesional Junior', codigo: 'OPS-03', departamento: 'OPS', descripcion: 'Profesional en formación' },
                { nombre: 'Asistente de Servicio', codigo: 'OPS-04', departamento: 'OPS', descripcion: 'Apoyo en servicios' },
                { nombre: 'Contador', codigo: 'ADM-01', departamento: 'ADM', descripcion: 'Gestión contable y fiscal' },
                { nombre: 'Asistente Administrativo', codigo: 'ADM-02', departamento: 'ADM', descripcion: 'Apoyo administrativo general' },
                { nombre: 'Recepcionista', codigo: 'REC-01', departamento: 'REC', descripcion: 'Atención al cliente y citas' },
                { nombre: 'Community Manager', codigo: 'MKT-01', departamento: 'MKT', descripcion: 'Gestión de redes sociales' },
                { nombre: 'Asistente de Marketing', codigo: 'MKT-02', departamento: 'MKT', descripcion: 'Apoyo en campañas' }
            ];

            // Crear puestos
            const puestosCreados = [];

            for (const puesto of puestosBase) {
                const departamentoId = departamentosMap[puesto.departamento];

                try {
                    const creado = await PuestoModel.crear(organizacionId, {
                        nombre: puesto.nombre,
                        codigo: puesto.codigo,
                        descripcion: puesto.descripcion,
                        departamento_id: departamentoId || null
                    });
                    puestosCreados.push(creado);
                } catch (error) {
                    // Si ya existe, continuar
                    if (error.message.includes('duplicate') || error.code === '23505') {
                        logger.warn(`Puesto ${puesto.nombre} ya existe, saltando...`);
                        continue;
                    }
                    throw error;
                }
            }

            logger.info(`Seed de catálogos completado`, {
                organizacionId,
                departamentosCreados: departamentosCreados.length,
                puestosCreados: puestosCreados.length,
                usuario: req.user.email
            });

            res.status(201).json({
                success: true,
                message: `Catálogos creados: ${departamentosCreados.length} departamentos, ${puestosCreados.length} puestos`,
                data: {
                    departamentos: departamentosCreados,
                    puestos: puestosCreados
                }
            });
        } catch (error) {
            next(error);
        }
    }

}

module.exports = DepartamentoController;
