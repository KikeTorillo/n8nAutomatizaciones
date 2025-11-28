/**
 * @fileoverview Servicio de generación de Tickets PDF para POS
 * @description Genera tickets en formato térmico (58mm / 80mm) usando PDFKit
 * @version 1.0.0
 * @date Noviembre 2025
 */

const PDFDocument = require('pdfkit');

/**
 * Configuraciones de tamaño de papel térmico
 * 1mm = 2.83465 puntos
 */
const PAPER_SIZES = {
    '58mm': {
        width: 164,  // 58mm en puntos
        margin: 10,
        fontSize: {
            title: 12,
            header: 9,
            body: 8,
            footer: 7
        }
    },
    '80mm': {
        width: 227,  // 80mm en puntos
        margin: 15,
        fontSize: {
            title: 14,
            header: 10,
            body: 9,
            footer: 8
        }
    }
};

class TicketPDFService {

    /**
     * Genera un ticket PDF para una venta
     * @param {Object} data - Datos de la venta
     * @param {Object} data.venta - Información de la venta
     * @param {Array} data.items - Items de la venta
     * @param {Object} data.organizacion - Datos de la organización
     * @param {Object} options - Opciones de generación
     * @param {string} options.paperSize - '58mm' o '80mm' (default: '80mm')
     * @returns {Promise<Buffer>} Buffer del PDF generado
     */
    static async generarTicket(data, options = {}) {
        const { venta, items, organizacion } = data;
        const paperSize = options.paperSize || '80mm';
        const config = PAPER_SIZES[paperSize];

        return new Promise((resolve, reject) => {
            try {
                const chunks = [];

                // Crear documento sin altura fija (se ajusta al contenido)
                const doc = new PDFDocument({
                    size: [config.width, 800], // Altura máxima, se recortará
                    margins: {
                        top: config.margin,
                        bottom: config.margin,
                        left: config.margin,
                        right: config.margin
                    },
                    bufferPages: true
                });

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const contentWidth = config.width - (config.margin * 2);
                let y = config.margin;

                // ========================================
                // ENCABEZADO - Datos del negocio
                // ========================================
                doc.font('Helvetica-Bold')
                   .fontSize(config.fontSize.title)
                   .text(organizacion.nombre_comercial || 'Mi Negocio', config.margin, y, {
                       width: contentWidth,
                       align: 'center'
                   });
                y += config.fontSize.title + 4;

                if (organizacion.direccion) {
                    doc.font('Helvetica')
                       .fontSize(config.fontSize.footer)
                       .text(organizacion.direccion, config.margin, y, {
                           width: contentWidth,
                           align: 'center'
                       });
                    y += config.fontSize.footer + 2;
                }

                if (organizacion.telefono) {
                    doc.text(`Tel: ${organizacion.telefono}`, config.margin, y, {
                        width: contentWidth,
                        align: 'center'
                    });
                    y += config.fontSize.footer + 2;
                }

                if (organizacion.rfc_nif) {
                    doc.text(`RFC: ${organizacion.rfc_nif}`, config.margin, y, {
                        width: contentWidth,
                        align: 'center'
                    });
                    y += config.fontSize.footer + 2;
                }

                // Línea separadora
                y += 4;
                doc.moveTo(config.margin, y)
                   .lineTo(config.width - config.margin, y)
                   .stroke();
                y += 8;

                // ========================================
                // INFORMACIÓN DE LA VENTA
                // ========================================
                doc.font('Helvetica-Bold')
                   .fontSize(config.fontSize.header)
                   .text('TICKET DE VENTA', config.margin, y, {
                       width: contentWidth,
                       align: 'center'
                   });
                y += config.fontSize.header + 6;

                doc.font('Helvetica')
                   .fontSize(config.fontSize.body);

                // Folio
                doc.font('Helvetica-Bold')
                   .text(`Folio: ${venta.folio}`, config.margin, y);
                y += config.fontSize.body + 2;

                // Fecha y hora
                const fechaVenta = new Date(venta.fecha_venta);
                const fechaFormateada = fechaVenta.toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
                const horaFormateada = fechaVenta.toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                doc.font('Helvetica')
                   .text(`Fecha: ${fechaFormateada}  Hora: ${horaFormateada}`, config.margin, y);
                y += config.fontSize.body + 2;

                // Cliente (si existe)
                if (venta.cliente_nombre) {
                    doc.text(`Cliente: ${venta.cliente_nombre}`, config.margin, y);
                    y += config.fontSize.body + 2;
                }

                // Atendió (profesional o usuario)
                const atendio = venta.profesional_nombre || venta.usuario_nombre || 'N/A';
                doc.text(`Atendió: ${atendio}`, config.margin, y);
                y += config.fontSize.body + 4;

                // Línea separadora
                doc.moveTo(config.margin, y)
                   .lineTo(config.width - config.margin, y)
                   .stroke();
                y += 6;

                // ========================================
                // DETALLE DE PRODUCTOS
                // ========================================
                doc.font('Helvetica-Bold')
                   .fontSize(config.fontSize.body);

                // Encabezado de columnas
                const colCant = config.margin;
                const colDesc = config.margin + 25;
                const colPrecio = config.width - config.margin - 45;
                const colTotal = config.width - config.margin - 5;

                doc.text('Cant', colCant, y, { width: 20 });
                doc.text('Descripción', colDesc, y, { width: 80 });
                doc.text('Precio', colPrecio, y, { width: 40, align: 'right' });
                y += config.fontSize.body + 4;

                // Línea bajo encabezado
                doc.moveTo(config.margin, y)
                   .lineTo(config.width - config.margin, y)
                   .lineWidth(0.5)
                   .stroke();
                y += 4;

                // Items
                doc.font('Helvetica')
                   .fontSize(config.fontSize.body);

                for (const item of items) {
                    const cantidad = item.cantidad;
                    const nombre = this._truncarTexto(item.nombre_producto || item.producto_nombre, 18);
                    const precioUnit = parseFloat(item.precio_unitario || 0);
                    const subtotal = parseFloat(item.subtotal || 0);

                    // Línea 1: Cantidad y nombre
                    doc.text(cantidad.toString(), colCant, y, { width: 20 });
                    doc.text(nombre, colDesc, y, { width: colPrecio - colDesc - 5 });
                    doc.text(`$${subtotal.toFixed(2)}`, colPrecio, y, { width: 45, align: 'right' });
                    y += config.fontSize.body + 1;

                    // Línea 2: Precio unitario (si hay descuento)
                    if (item.descuento_monto > 0 || item.descuento_porcentaje > 0) {
                        doc.fontSize(config.fontSize.footer)
                           .text(`  @$${precioUnit.toFixed(2)} - Desc: $${(item.descuento_monto || 0).toFixed(2)}`, colDesc, y);
                        y += config.fontSize.footer + 1;
                        doc.fontSize(config.fontSize.body);
                    }

                    y += 2;
                }

                // Línea separadora
                y += 2;
                doc.moveTo(config.margin, y)
                   .lineTo(config.width - config.margin, y)
                   .stroke();
                y += 6;

                // ========================================
                // TOTALES
                // ========================================
                const labelX = config.margin + 20;
                const valueX = config.width - config.margin - 5;

                // Subtotal
                doc.font('Helvetica')
                   .text('Subtotal:', labelX, y);
                doc.text(`$${parseFloat(venta.subtotal || 0).toFixed(2)}`, valueX - 50, y, {
                    width: 50,
                    align: 'right'
                });
                y += config.fontSize.body + 2;

                // Descuento (si aplica)
                if (parseFloat(venta.descuento_monto || 0) > 0) {
                    const descLabel = venta.descuento_porcentaje
                        ? `Descuento (${venta.descuento_porcentaje}%):`
                        : 'Descuento:';
                    doc.text(descLabel, labelX, y);
                    doc.text(`-$${parseFloat(venta.descuento_monto).toFixed(2)}`, valueX - 50, y, {
                        width: 50,
                        align: 'right'
                    });
                    y += config.fontSize.body + 2;
                }

                // Impuestos (si aplica)
                if (parseFloat(venta.impuestos || 0) > 0) {
                    doc.text('IVA:', labelX, y);
                    doc.text(`$${parseFloat(venta.impuestos).toFixed(2)}`, valueX - 50, y, {
                        width: 50,
                        align: 'right'
                    });
                    y += config.fontSize.body + 2;
                }

                // TOTAL
                y += 2;
                doc.font('Helvetica-Bold')
                   .fontSize(config.fontSize.header);
                doc.text('TOTAL:', labelX, y);
                doc.text(`$${parseFloat(venta.total || 0).toFixed(2)}`, valueX - 60, y, {
                    width: 60,
                    align: 'right'
                });
                y += config.fontSize.header + 4;

                // Método de pago
                doc.font('Helvetica')
                   .fontSize(config.fontSize.body);
                const metodoPago = this._formatearMetodoPago(venta.metodo_pago);
                doc.text(`Pago: ${metodoPago}`, labelX, y);
                y += config.fontSize.body + 2;

                // Monto pagado y cambio (si es efectivo)
                if (parseFloat(venta.monto_pagado || 0) > 0) {
                    doc.text(`Recibido: $${parseFloat(venta.monto_pagado).toFixed(2)}`, labelX, y);
                    y += config.fontSize.body + 2;

                    const cambio = parseFloat(venta.monto_pagado) - parseFloat(venta.total);
                    if (cambio > 0) {
                        doc.text(`Cambio: $${cambio.toFixed(2)}`, labelX, y);
                        y += config.fontSize.body + 2;
                    }
                }

                // Línea separadora
                y += 4;
                doc.moveTo(config.margin, y)
                   .lineTo(config.width - config.margin, y)
                   .stroke();
                y += 8;

                // ========================================
                // PIE DE TICKET
                // ========================================
                doc.font('Helvetica')
                   .fontSize(config.fontSize.footer);

                doc.text('¡Gracias por su compra!', config.margin, y, {
                    width: contentWidth,
                    align: 'center'
                });
                y += config.fontSize.footer + 2;

                doc.text('Conserve este ticket', config.margin, y, {
                    width: contentWidth,
                    align: 'center'
                });
                y += config.fontSize.footer + 10;

                // Timestamp de impresión
                const ahora = new Date();
                doc.fontSize(6)
                   .text(`Impreso: ${ahora.toLocaleString('es-MX')}`, config.margin, y, {
                       width: contentWidth,
                       align: 'center'
                   });

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Trunca texto si excede longitud máxima
     * @private
     */
    static _truncarTexto(texto, maxLength) {
        if (!texto) return '';
        if (texto.length <= maxLength) return texto;
        return texto.substring(0, maxLength - 2) + '..';
    }

    /**
     * Formatea el método de pago para mostrar
     * @private
     */
    static _formatearMetodoPago(metodo) {
        const metodos = {
            'efectivo': 'Efectivo',
            'tarjeta_debito': 'Tarjeta Débito',
            'tarjeta_credito': 'Tarjeta Crédito',
            'transferencia': 'Transferencia',
            'qr_mercadopago': 'QR Mercado Pago',
            'mixto': 'Mixto'
        };
        return metodos[metodo] || metodo || 'N/A';
    }
}

module.exports = TicketPDFService;
