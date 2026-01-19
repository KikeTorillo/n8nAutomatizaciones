/**
 * ====================================================================
 * MODELO DOCUMENTO CLIENTE
 * ====================================================================
 *
 * Fase 4B - Documentos de Cliente (Ene 2026)
 * CRUD para documentos asociados a clientes
 * Basado en DocumentoEmpleadoModel
 *
 * ====================================================================
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');

class DocumentoClienteModel {

    /**
     * Crear un nuevo documento de cliente
     */
    static async crear(data) {
        return await RLSContextManager.query(data.organizacion_id, async (db) => {
            const query = `
                INSERT INTO cliente_documentos (
                    organizacion_id, cliente_id, archivo_storage_id,
                    tipo_documento, nombre, descripcion,
                    nombre_archivo, mime_type, tamano_bytes,
                    fecha_emision, fecha_vencimiento,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `;

            const values = [
                data.organizacion_id,
                data.cliente_id,
                data.archivo_storage_id || null,
                data.tipo_documento,
                data.nombre,
                data.descripcion || null,
                data.nombre_archivo || null,
                data.mime_type || null,
                data.tamano_bytes || null,
                data.fecha_emision || null,
                data.fecha_vencimiento || null,
                data.creado_por || null
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23503') {
                    if (error.constraint?.includes('cliente')) {
                        ErrorHelper.throwNotFound('El cliente especificado no existe');
                    }
                    if (error.constraint?.includes('archivo_storage')) {
                        ErrorHelper.throwNotFound('El archivo de storage especificado no existe');
                    }
                }
                if (error.code === '23514') {
                    ErrorHelper.throwValidation('Tipo de documento no válido');
                }
                throw error;
            }
        });
    }

    /**
     * Listar documentos de un cliente con filtros
     */
    static async listarPorCliente(organizacionId, clienteId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                tipo = null,
                verificado = null,
                estado_vencimiento = null,
                limite = 50,
                offset = 0
            } = filtros;

            let query = `
                SELECT
                    d.*,
                    a.url_publica as archivo_url,
                    a.nombre_original as archivo_nombre_storage,
                    a.mime_type as archivo_mime_storage,
                    a.tamano_bytes as archivo_tamano_storage,
                    uv.nombre as verificado_por_nombre,
                    uc.nombre as creado_por_nombre,
                    CASE
                        WHEN d.fecha_vencimiento IS NULL THEN 'sin_vencimiento'
                        WHEN d.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
                        WHEN d.fecha_vencimiento <= CURRENT_DATE + 30 THEN 'por_vencer'
                        ELSE 'vigente'
                    END as estado_vencimiento,
                    CASE
                        WHEN d.fecha_vencimiento IS NOT NULL
                        THEN d.fecha_vencimiento - CURRENT_DATE
                        ELSE NULL
                    END as dias_para_vencer
                FROM cliente_documentos d
                LEFT JOIN archivos_storage a ON a.id = d.archivo_storage_id
                LEFT JOIN usuarios uv ON uv.id = d.verificado_por
                LEFT JOIN usuarios uc ON uc.id = d.creado_por
                WHERE d.organizacion_id = $1
                    AND d.cliente_id = $2
                    AND d.eliminado_en IS NULL
                    AND d.activo = true
            `;

            const values = [organizacionId, clienteId];
            let contador = 3;

            if (tipo) {
                query += ` AND d.tipo_documento = $${contador}`;
                values.push(tipo);
                contador++;
            }

            if (verificado !== null) {
                query += ` AND d.verificado = $${contador}`;
                values.push(verificado);
                contador++;
            }

            if (estado_vencimiento) {
                switch (estado_vencimiento) {
                    case 'vencido':
                        query += ` AND d.fecha_vencimiento < CURRENT_DATE`;
                        break;
                    case 'por_vencer':
                        query += ` AND d.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + 30`;
                        break;
                    case 'vigente':
                        query += ` AND d.fecha_vencimiento > CURRENT_DATE + 30`;
                        break;
                    case 'sin_vencimiento':
                        query += ` AND d.fecha_vencimiento IS NULL`;
                        break;
                }
            }

            query += ` ORDER BY d.creado_en DESC LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limite, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtener documento por ID
     */
    static async obtenerPorId(organizacionId, documentoId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    d.*,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email,
                    a.url_publica as archivo_url,
                    a.nombre_original as archivo_nombre_storage,
                    a.mime_type as archivo_mime_storage,
                    a.tamano_bytes as archivo_tamano_storage,
                    a.bucket as archivo_bucket,
                    a.path as archivo_ruta,
                    uv.nombre as verificado_por_nombre,
                    uc.nombre as creado_por_nombre,
                    CASE
                        WHEN d.fecha_vencimiento IS NULL THEN 'sin_vencimiento'
                        WHEN d.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
                        WHEN d.fecha_vencimiento <= CURRENT_DATE + 30 THEN 'por_vencer'
                        ELSE 'vigente'
                    END as estado_vencimiento,
                    CASE
                        WHEN d.fecha_vencimiento IS NOT NULL
                        THEN d.fecha_vencimiento - CURRENT_DATE
                        ELSE NULL
                    END as dias_para_vencer
                FROM cliente_documentos d
                JOIN clientes c ON c.id = d.cliente_id
                LEFT JOIN archivos_storage a ON a.id = d.archivo_storage_id
                LEFT JOIN usuarios uv ON uv.id = d.verificado_por
                LEFT JOIN usuarios uc ON uc.id = d.creado_por
                WHERE d.id = $1
                    AND d.organizacion_id = $2
                    AND d.eliminado_en IS NULL
            `;

            const result = await db.query(query, [documentoId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar documento
     */
    static async actualizar(organizacionId, documentoId, datos) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = [
                'tipo_documento', 'nombre', 'descripcion',
                'fecha_emision', 'fecha_vencimiento'
            ];

            const campos = [];
            const valores = [];
            let contador = 1;

            for (const [campo, valor] of Object.entries(datos)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    campos.push(`${campo} = $${contador}`);
                    valores.push(valor);
                    contador++;
                }
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos válidos para actualizar');
            }

            const query = `
                UPDATE cliente_documentos
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                    AND eliminado_en IS NULL
                RETURNING *
            `;

            valores.push(documentoId, organizacionId);

            const result = await db.query(query, valores);
            ErrorHelper.throwIfNotFound(result.rows[0], 'Documento');
            return result.rows[0];
        });
    }

    /**
     * Eliminar documento (soft delete)
     */
    static async eliminar(organizacionId, documentoId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE cliente_documentos
                SET activo = false,
                    eliminado_en = NOW(),
                    eliminado_por = $3
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING id
            `;

            const result = await db.query(query, [documentoId, organizacionId, usuarioId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Verificar/desverificar documento
     */
    static async verificar(organizacionId, documentoId, verificado, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE cliente_documentos
                SET verificado = $3,
                    verificado_por = CASE WHEN $3 = true THEN $4::INTEGER ELSE NULL END,
                    verificado_en = CASE WHEN $3 = true THEN NOW() ELSE NULL END,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING *
            `;

            const result = await db.query(query, [
                documentoId, organizacionId, verificado, usuarioId
            ]);
            ErrorHelper.throwIfNotFound(result.rows[0], 'Documento');
            return result.rows[0];
        });
    }

    /**
     * Contar documentos por estado para un cliente
     */
    static async contarPorEstado(organizacionId, clienteId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM contar_documentos_cliente($1)
            `;

            const result = await db.query(query, [clienteId]);
            const row = result.rows[0];

            return {
                total: parseInt(row?.total) || 0,
                verificados: parseInt(row?.verificados) || 0,
                pendientes: parseInt(row?.pendientes) || 0,
                por_vencer: parseInt(row?.por_vencer) || 0
            };
        });
    }

    /**
     * Listar documentos por vencer de toda la organización
     */
    static async listarPorVencer(organizacionId, dias = 30) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM get_documentos_por_vencer($1, $2)
            `;

            const result = await db.query(query, [organizacionId, dias]);
            return result.rows;
        });
    }

    /**
     * Actualizar archivo asociado
     */
    static async actualizarArchivo(organizacionId, documentoId, archivoStorageId, metadatos = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE cliente_documentos
                SET archivo_storage_id = $3,
                    nombre_archivo = COALESCE($4, nombre_archivo),
                    mime_type = COALESCE($5, mime_type),
                    tamano_bytes = COALESCE($6, tamano_bytes),
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING *
            `;

            const result = await db.query(query, [
                documentoId,
                organizacionId,
                archivoStorageId,
                metadatos.nombre_archivo || null,
                metadatos.mime_type || null,
                metadatos.tamano_bytes || null
            ]);
            ErrorHelper.throwIfNotFound(result.rows[0], 'Documento');
            return result.rows[0];
        });
    }

    /**
     * Obtener tipos de documento disponibles
     */
    static async obtenerTipos(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT * FROM v_tipos_documento_cliente`;
            const result = await db.query(query);
            return result.rows;
        });
    }
}

module.exports = DocumentoClienteModel;
