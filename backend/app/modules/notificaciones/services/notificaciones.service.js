/**
 * Servicio de Notificaciones
 * Logica de negocio para crear y gestionar notificaciones
 *
 * @module modules/notificaciones/services/notificaciones.service
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class NotificacionesService {
  /**
   * Crear notificacion para un usuario
   */
  static async crear({
    organizacionId,
    usuarioId,
    tipo,
    categoria,
    titulo,
    mensaje,
    nivel = 'info',
    icono = null,
    accionUrl = null,
    accionTexto = null,
    entidadTipo = null,
    entidadId = null,
    expiraEn = null
  }) {
    const query = `
      SELECT crear_notificacion($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) as id
    `;

    const result = await RLSContextManager.withBypass(async () => {
      return await RLSContextManager.query(
        organizacionId,
        query,
        [
          organizacionId,
          usuarioId,
          tipo,
          categoria,
          titulo,
          mensaje,
          nivel,
          icono,
          accionUrl,
          accionTexto,
          entidadTipo,
          entidadId,
          expiraEn
        ]
      );
    });

    const notificacionId = result.rows[0]?.id;

    if (notificacionId) {
      logger.info(`[Notificaciones] Creada notificacion ${notificacionId} para usuario ${usuarioId}`);
    }

    return notificacionId;
  }

  /**
   * Crear notificacion masiva para multiples usuarios
   */
  static async crearMasiva({
    organizacionId,
    usuarioIds,
    tipo,
    categoria,
    titulo,
    mensaje,
    nivel = 'info',
    icono = null,
    accionUrl = null
  }) {
    const query = `
      SELECT crear_notificacion_masiva($1, $2, $3, $4, $5, $6, $7, $8, $9) as total
    `;

    const result = await RLSContextManager.withBypass(async () => {
      return await RLSContextManager.query(
        organizacionId,
        query,
        [
          organizacionId,
          usuarioIds,
          tipo,
          categoria,
          titulo,
          mensaje,
          nivel,
          icono,
          accionUrl
        ]
      );
    });

    const total = result.rows[0]?.total || 0;
    logger.info(`[Notificaciones] Creadas ${total} notificaciones masivas`);

    return total;
  }

  /**
   * Notificar a todos los admins de una organizacion
   */
  static async notificarAdmins({
    organizacionId,
    tipo,
    categoria,
    titulo,
    mensaje,
    nivel = 'info',
    icono = null,
    accionUrl = null
  }) {
    // Obtener IDs de admins (Ene 2026: JOIN con tabla roles)
    const adminsQuery = `
      SELECT u.id FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.organizacion_id = $1
        AND r.codigo = 'admin'
        AND u.activo = TRUE
    `;

    const adminsResult = await RLSContextManager.withBypass(async () => {
      return await RLSContextManager.query(organizacionId, adminsQuery, [organizacionId]);
    });

    const usuarioIds = adminsResult.rows.map(r => r.id);

    if (usuarioIds.length === 0) {
      return 0;
    }

    return await this.crearMasiva({
      organizacionId,
      usuarioIds,
      tipo,
      categoria,
      titulo,
      mensaje,
      nivel,
      icono,
      accionUrl
    });
  }

  /**
   * Notificaciones especificas para eventos del sistema
   */
  static async notificarCitaNueva(cita, cliente, profesional, servicio) {
    if (!profesional.usuario_id) return null;

    return await this.crear({
      organizacionId: cita.organizacion_id,
      usuarioId: profesional.usuario_id,
      tipo: 'cita_nueva',
      categoria: 'citas',
      titulo: 'Nueva cita agendada',
      mensaje: `${cliente.nombre} agendo ${servicio.nombre} para el ${this.formatearFecha(cita.fecha_cita)} a las ${this.formatearHora(cita.hora_inicio)}`,
      nivel: 'info',
      icono: 'calendar-plus',
      accionUrl: `/citas/${cita.id}`,
      accionTexto: 'Ver cita',
      entidadTipo: 'cita',
      entidadId: cita.id
    });
  }

  static async notificarCitaCancelada(cita, cliente, profesional) {
    if (!profesional.usuario_id) return null;

    return await this.crear({
      organizacionId: cita.organizacion_id,
      usuarioId: profesional.usuario_id,
      tipo: 'cita_cancelada',
      categoria: 'citas',
      titulo: 'Cita cancelada',
      mensaje: `${cliente.nombre} cancelo su cita del ${this.formatearFecha(cita.fecha_cita)}`,
      nivel: 'warning',
      icono: 'calendar-x',
      accionUrl: `/citas/${cita.id}`,
      entidadTipo: 'cita',
      entidadId: cita.id
    });
  }

  static async notificarStockBajo(producto, stockActual, stockMinimo) {
    const esAgotado = stockActual <= 0;

    return await this.notificarAdmins({
      organizacionId: producto.organizacion_id,
      tipo: esAgotado ? 'stock_agotado' : 'stock_bajo',
      categoria: 'inventario',
      titulo: esAgotado ? 'Stock agotado' : 'Stock bajo',
      mensaje: `${producto.nombre}: ${stockActual} unidades${!esAgotado ? ` (minimo: ${stockMinimo})` : ''}`,
      nivel: esAgotado ? 'error' : 'warning',
      icono: esAgotado ? 'package-x' : 'package-minus',
      accionUrl: `/inventario/productos/${producto.id}`
    });
  }

  static async notificarResenaNueva(resena) {
    const esNegativa = resena.calificacion <= 2;

    return await this.notificarAdmins({
      organizacionId: resena.organizacion_id,
      tipo: esNegativa ? 'resena_negativa' : 'resena_nueva',
      categoria: 'marketplace',
      titulo: `Nueva resena de ${resena.calificacion} estrellas`,
      mensaje: resena.comentario
        ? `${resena.nombre_autor || 'Cliente'}: "${resena.comentario.substring(0, 100)}${resena.comentario.length > 100 ? '...' : ''}"`
        : `${resena.nombre_autor || 'Cliente'} dejo una resena`,
      nivel: esNegativa ? 'warning' : 'info',
      icono: 'star',
      accionUrl: '/marketplace/resenas'
    });
  }

  static async notificarBienvenida(usuario) {
    return await this.crear({
      organizacionId: usuario.organizacion_id,
      usuarioId: usuario.id,
      tipo: 'sistema_bienvenida',
      categoria: 'sistema',
      titulo: 'Bienvenido a Nexo',
      mensaje: 'Tu cuenta ha sido creada exitosamente. Explora las funciones disponibles desde el menu lateral.',
      nivel: 'success',
      icono: 'hand-wave',
      accionUrl: '/dashboard'
    });
  }

  /**
   * Helpers para formatear fechas
   */
  static formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
  }

  static formatearHora(hora) {
    if (!hora) return '';
    // hora viene como string HH:MM:SS
    return hora.substring(0, 5);
  }
}

module.exports = NotificacionesService;
