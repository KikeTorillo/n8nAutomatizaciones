/**
 * API Modules - Re-exports centralizados
 *
 * Cada API ha sido extraída a su propio archivo para mejor mantenibilidad.
 * Este índice re-exporta todas las APIs para imports centralizados.
 *
 * Uso:
 *   import { authApi, clientesApi } from '@/services/api/modules';
 *   // O desde el archivo principal:
 *   import { authApi, clientesApi } from '@/services/api/endpoints';
 */

// Auth y Sistema
export { authApi } from './auth.api';
export { organizacionesApi } from './organizaciones.api';
export { usuariosApi } from './usuarios.api';
export { modulosApi } from './modulos.api';
export { permisosApi } from './permisos.api';
export { notificacionesApi } from './notificaciones.api';
export { planesApi } from './planes.api';
export { subscripcionesApi } from './subscripciones.api';
export { mercadopagoApi } from './mercadopago.api';

// Profesionales y RRHH
export { profesionalesApi } from './profesionales.api';
export { onboardingEmpleadosApi } from './onboarding-empleados.api';
export { habilidadesApi } from './habilidades.api';
export { departamentosApi } from './departamentos.api';
export { puestosApi } from './puestos.api';
export { categoriasProfesionalApi } from './categorias-profesional.api';
export { vacacionesApi } from './vacaciones.api';
export { incapacidadesApi } from './incapacidades.api';
export { motivosSalidaApi } from './motivos-salida.api';
export { ubicacionesTrabajoApi } from './ubicaciones-trabajo.api';
export { categoriasPagoApi } from './categorias-pago.api';

// Clientes y CRM
export { clientesApi } from './clientes.api';
export { oportunidadesApi } from './oportunidades.api';

// Agendamiento
export { serviciosApi } from './servicios.api';
export { horariosApi } from './horarios.api';
export { citasApi } from './citas.api';
export { bloqueosApi } from './bloqueos.api';
export { tiposBloqueoApi } from './tipos-bloqueo.api';
export { recordatoriosApi } from './recordatorios.api';
export { configuracionAgendamientoApi } from './configuracion-agendamiento.api';

// Inventario
export { inventarioApi } from './inventario.api';
export { ordenesCompraApi } from './ordenes-compra.api';
export { conteosApi } from './conteos.api';
export { ajustesMasivosApi } from './ajustes-masivos.api';
export { landedCostsApi } from './landed-costs.api';
export { listasPreciosApi } from './listas-precios.api';

// Almacén
export { operacionesAlmacenApi } from './operaciones-almacen.api';
export { batchPickingApi } from './batch-picking.api';
export { configuracionAlmacenApi } from './configuracion-almacen.api';
export { paquetesApi } from './paquetes.api';
export { consignaApi } from './consigna.api';
export { dropshipApi } from './dropship.api';
export { reordenApi } from './reorden.api';

// POS
export { posApi } from './pos.api';

// Comisiones
export { comisionesApi } from './comisiones.api';

// Contabilidad
export { contabilidadApi } from './contabilidad.api';
export { monedasApi } from './monedas.api';

// Sucursales
export { sucursalesApi } from './sucursales.api';

// Ubicaciones
export { ubicacionesApi } from './ubicaciones.api';

// Workflows
export { workflowsApi } from './workflows.api';
export { workflowDesignerApi } from './workflow-designer.api';

// Custom Fields
export { customFieldsApi } from './custom-fields.api';

// Storage
export { storageApi } from './storage.api';

// Comunicación
export { whatsappApi } from './whatsapp.api';
export { chatbotsApi } from './chatbots.api';

// Eventos Digitales
export { invitacionesApi } from './invitaciones.api';
export { eventosDigitalesApi } from './eventos-digitales.api';

// Website
export { websiteApi } from './website.api';

// Marketplace
export { marketplaceApi } from './marketplace.api';
