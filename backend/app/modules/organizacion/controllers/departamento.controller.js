/**
 * Controller de Departamentos usando BaseCrudController
 * Migrado de 269 lineas a ~60 usando patron factory
 *
 * @module organizacion/controllers/departamento.controller
 */

const { createCrudController, withTreeMethods } = require('../../../utils/BaseCrudController');
const asyncHandler = require('../../../middleware/asyncHandler');
const DepartamentoModel = require('../models/departamento.model');
const PuestoModel = require('../models/puesto.model');
const logger = require('../../../utils/logger');

// Controller base con operaciones CRUD estandar
const baseController = createCrudController({
  Model: DepartamentoModel,
  resourceName: 'Departamento',
  filterSchema: {
    activo: 'boolean',
    parent_id: 'int_nullable'
  },
  allowedOrderFields: ['nombre', 'codigo', 'creado_en']
});

// Extender con metodos de arbol (obtenerArbol)
const controllerConArbol = withTreeMethods(baseController, DepartamentoModel, 'Departamento');

/**
 * POST /departamentos/seed-catalogos
 * Crea departamentos y puestos de ejemplo para la organizacion
 */
const seedCatalogos = asyncHandler(async (req, res) => {
  const organizacionId = req.tenant.organizacionId;
  const { forzar = false } = req.body;

  // Verificar si ya existen departamentos
  const departamentosExistentes = await DepartamentoModel.listar(organizacionId, { limit: 1 });

  if (departamentosExistentes.length > 0 && !forzar) {
    return res.status(400).json({
      success: false,
      error: 'Ya existen departamentos en esta organizacion. Usa { "forzar": true } para agregar de todos modos.'
    });
  }

  // Definir catalogos genericos para negocios de servicios
  const departamentosBase = [
    { nombre: 'Direccion General', codigo: 'DIR', descripcion: 'Alta direccion y toma de decisiones estrategicas' },
    { nombre: 'Operaciones', codigo: 'OPS', descripcion: 'Prestacion de servicios y atencion al cliente' },
    { nombre: 'Administracion', codigo: 'ADM', descripcion: 'Gestion administrativa y financiera' },
    { nombre: 'Recepcion', codigo: 'REC', descripcion: 'Atencion al cliente y agendamiento' },
    { nombre: 'Marketing', codigo: 'MKT', descripcion: 'Promocion y comunicacion' }
  ];

  // ✅ FIX v2.1: Crear departamentos en paralelo con Promise.all
  const departamentosMap = {};

  const departamentosResults = await Promise.all(
    departamentosBase.map(async (dep) => {
      try {
        const creado = await DepartamentoModel.crear(organizacionId, dep);
        departamentosMap[dep.codigo] = creado.id;
        return creado;
      } catch (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          logger.warn(`Departamento ${dep.nombre} ya existe, saltando...`);
          return null;
        }
        throw error;
      }
    })
  );

  const departamentosCreados = departamentosResults.filter(d => d !== null);

  // Definir puestos asociados a departamentos
  const puestosBase = [
    { nombre: 'Director General', codigo: 'DIR-01', departamento: 'DIR', descripcion: 'Lider de la organizacion' },
    { nombre: 'Gerente de Operaciones', codigo: 'OPS-01', departamento: 'OPS', descripcion: 'Responsable de la operacion diaria' },
    { nombre: 'Profesional Senior', codigo: 'OPS-02', departamento: 'OPS', descripcion: 'Profesional con experiencia' },
    { nombre: 'Profesional Junior', codigo: 'OPS-03', departamento: 'OPS', descripcion: 'Profesional en formacion' },
    { nombre: 'Asistente de Servicio', codigo: 'OPS-04', departamento: 'OPS', descripcion: 'Apoyo en servicios' },
    { nombre: 'Contador', codigo: 'ADM-01', departamento: 'ADM', descripcion: 'Gestion contable y fiscal' },
    { nombre: 'Asistente Administrativo', codigo: 'ADM-02', departamento: 'ADM', descripcion: 'Apoyo administrativo general' },
    { nombre: 'Recepcionista', codigo: 'REC-01', departamento: 'REC', descripcion: 'Atencion al cliente y citas' },
    { nombre: 'Community Manager', codigo: 'MKT-01', departamento: 'MKT', descripcion: 'Gestion de redes sociales' },
    { nombre: 'Asistente de Marketing', codigo: 'MKT-02', departamento: 'MKT', descripcion: 'Apoyo en campanas' }
  ];

  // ✅ FIX v2.1: Crear puestos en paralelo con Promise.all
  const puestosResults = await Promise.all(
    puestosBase.map(async (puesto) => {
      const departamentoId = departamentosMap[puesto.departamento];

      try {
        const creado = await PuestoModel.crear(organizacionId, {
          nombre: puesto.nombre,
          codigo: puesto.codigo,
          descripcion: puesto.descripcion,
          departamento_id: departamentoId || null
        });
        return creado;
      } catch (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          logger.warn(`Puesto ${puesto.nombre} ya existe, saltando...`);
          return null;
        }
        throw error;
      }
    })
  );

  const puestosCreados = puestosResults.filter(p => p !== null);

  logger.info(`Seed de catalogos completado`, {
    organizacionId,
    departamentosCreados: departamentosCreados.length,
    puestosCreados: puestosCreados.length,
    usuario: req.user.email
  });

  res.status(201).json({
    success: true,
    message: `Catalogos creados: ${departamentosCreados.length} departamentos, ${puestosCreados.length} puestos`,
    data: {
      departamentos: departamentosCreados,
      puestos: puestosCreados
    }
  });
});

// Exportar controller con todos los metodos
module.exports = {
  ...controllerConArbol,
  seedCatalogos
};
