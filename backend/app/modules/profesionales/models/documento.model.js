/**
 * DocumentoEmpleadoModel - Enero 2026
 * Gestión de documentos de empleados (identificaciones, contratos, certificados)
 * Fase 2 del Plan de Empleados Competitivo
 */
const RLSContextManager = require('../../../utils/rlsContextManager');

class DocumentoEmpleadoModel {

    /**
     * Crea un nuevo documento de empleado
     * @param {Object} data - Datos del documento
     * @returns {Promise<Object>} Documento creado
     */
    static async crear(data) {
        return await RLSContextManager.query(data.organizacion_id, async (db) => {
            const query = `
                INSERT INTO documentos_empleado (
                    organizacion_id, profesional_id, archivo_storage_id,
                    tipo_documento, nombre, descripcion, numero_documento,
                    fecha_emision, fecha_vencimiento,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;

            const values = [
                data.organizacion_id,
                data.profesional_id,
                data.archivo_storage_id || null,
                data.tipo_documento,
                data.nombre,
                data.descripcion || null,
                data.numero_documento || null,
                data.fecha_emision || null,
                data.fecha_vencimiento || null,
                data.creado_por || null
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23503') {
                    if (error.constraint?.includes('profesional')) {
                        throw new Error('El profesional especificado no existe');
                    }
                    if (error.constraint?.includes('archivo_storage')) {
                        throw new Error('El archivo de storage especificado no existe');
                    }
                }
                if (error.code === '23514') {
                    if (error.constraint?.includes('fechas_documento')) {
                        throw new Error('La fecha de vencimiento debe ser posterior a la fecha de emisión');
                    }
                    if (error.constraint?.includes('nombre_documento')) {
                        throw new Error('El nombre del documento debe tener al menos 3 caracteres');
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Lista documentos de un profesional con filtros opcionales
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de documentos
     */
    static async listarPorProfesional(organizacionId, profesionalId, filtros = {}) {
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
                    a.nombre_original as archivo_nombre,
                    a.mime_type as archivo_mime,
                    a.tamano_bytes as archivo_tamano,
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
                FROM documentos_empleado d
                LEFT JOIN archivos_storage a ON a.id = d.archivo_storage_id
                LEFT JOIN usuarios uv ON uv.id = d.verificado_por
                LEFT JOIN usuarios uc ON uc.id = d.creado_por
                WHERE d.organizacion_id = $1
                    AND d.profesional_id = $2
                    AND d.eliminado_en IS NULL
                    AND d.activo = true
            `;

            const values = [organizacionId, profesionalId];
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
     * Obtiene un documento por su ID
     * @param {number} organizacionId - ID de la organización
     * @param {number} documentoId - ID del documento
     * @returns {Promise<Object|null>} Documento o null
     */
    static async obtenerPorId(organizacionId, documentoId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    d.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    a.url_publica as archivo_url,
                    a.nombre_original as archivo_nombre,
                    a.mime_type as archivo_mime,
                    a.tamano_bytes as archivo_tamano,
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
                FROM documentos_empleado d
                JOIN profesionales p ON p.id = d.profesional_id
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
     * Actualiza un documento existente
     * @param {number} organizacionId - ID de la organización
     * @param {number} documentoId - ID del documento
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>} Documento actualizado
     */
    static async actualizar(organizacionId, documentoId, datos) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = [
                'tipo_documento', 'nombre', 'descripcion',
                'numero_documento', 'fecha_emision', 'fecha_vencimiento'
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
                throw new Error('No hay campos válidos para actualizar');
            }

            const query = `
                UPDATE documentos_empleado
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                    AND eliminado_en IS NULL
                RETURNING *
            `;

            valores.push(documentoId, organizacionId);

            const result = await db.query(query, valores);

            if (result.rows.length === 0) {
                throw new Error('Documento no encontrado');
            }

            return result.rows[0];
        });
    }

    /**
     * Soft delete de un documento
     * @param {number} organizacionId - ID de la organización
     * @param {number} documentoId - ID del documento
     * @param {number} usuarioId - ID del usuario que elimina
     * @returns {Promise<boolean>} true si se eliminó
     */
    static async eliminar(organizacionId, documentoId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE documentos_empleado
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
     * Marca un documento como verificado o no verificado
     * @param {number} organizacionId - ID de la organización
     * @param {number} documentoId - ID del documento
     * @param {boolean} verificado - Estado de verificación
     * @param {number} usuarioId - ID del usuario que verifica
     * @param {string} notas - Notas de verificación
     * @returns {Promise<Object>} Documento actualizado
     */
    static async verificar(organizacionId, documentoId, verificado, usuarioId, notas = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE documentos_empleado
                SET verificado = $3,
                    verificado_por = CASE WHEN $3 = true THEN $4::INTEGER ELSE NULL END,
                    verificado_en = CASE WHEN $3 = true THEN NOW() ELSE NULL END,
                    notas_verificacion = $5,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING *
            `;

            const result = await db.query(query, [
                documentoId, organizacionId, verificado, usuarioId, notas
            ]);

            if (result.rows.length === 0) {
                throw new Error('Documento no encontrado');
            }

            return result.rows[0];
        });
    }

    /**
     * Lista documentos próximos a vencer de toda la organización
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de documentos próximos a vencer
     */
    static async listarProximosVencer(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                dias = 30,
                limite = 50,
                offset = 0
            } = filtros;

            const query = `
                SELECT
                    d.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    p.telefono as profesional_telefono,
                    a.nombre_original as archivo_nombre,
                    (d.fecha_vencimiento - CURRENT_DATE) as dias_para_vencer
                FROM documentos_empleado d
                JOIN profesionales p ON p.id = d.profesional_id
                LEFT JOIN archivos_storage a ON a.id = d.archivo_storage_id
                WHERE d.organizacion_id = $1
                    AND d.eliminado_en IS NULL
                    AND d.activo = true
                    AND d.fecha_vencimiento IS NOT NULL
                    AND d.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + $2
                    AND p.activo = true
                    AND p.eliminado_en IS NULL
                ORDER BY d.fecha_vencimiento ASC
                LIMIT $3 OFFSET $4
            `;

            const result = await db.query(query, [organizacionId, dias, limite, offset]);
            return result.rows;
        });
    }

    /**
     * Cuenta documentos por estado para un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @returns {Promise<Object>} Conteo por estado
     */
    static async contarPorEstado(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(*) FILTER (WHERE fecha_vencimiento IS NULL) as sin_vencimiento,
                    COUNT(*) FILTER (WHERE fecha_vencimiento < CURRENT_DATE) as vencidos,
                    COUNT(*) FILTER (WHERE fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) as por_vencer,
                    COUNT(*) FILTER (WHERE fecha_vencimiento > CURRENT_DATE + 30) as vigentes,
                    COUNT(*) FILTER (WHERE verificado = true) as verificados,
                    COUNT(*) FILTER (WHERE verificado = false) as pendientes_verificacion,
                    COUNT(*) as total
                FROM documentos_empleado
                WHERE organizacion_id = $1
                    AND profesional_id = $2
                    AND eliminado_en IS NULL
                    AND activo = true
            `;

            const result = await db.query(query, [organizacionId, profesionalId]);
            const row = result.rows[0];

            return {
                sin_vencimiento: parseInt(row.sin_vencimiento) || 0,
                vencidos: parseInt(row.vencidos) || 0,
                por_vencer: parseInt(row.por_vencer) || 0,
                vigentes: parseInt(row.vigentes) || 0,
                verificados: parseInt(row.verificados) || 0,
                pendientes_verificacion: parseInt(row.pendientes_verificacion) || 0,
                total: parseInt(row.total) || 0
            };
        });
    }

    /**
     * Actualiza el archivo asociado a un documento
     * @param {number} organizacionId - ID de la organización
     * @param {number} documentoId - ID del documento
     * @param {number} archivoStorageId - ID del nuevo archivo
     * @returns {Promise<Object>} Documento actualizado
     */
    static async actualizarArchivo(organizacionId, documentoId, archivoStorageId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE documentos_empleado
                SET archivo_storage_id = $3,
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING *
            `;

            const result = await db.query(query, [documentoId, organizacionId, archivoStorageId]);

            if (result.rows.length === 0) {
                throw new Error('Documento no encontrado');
            }

            return result.rows[0];
        });
    }

}

module.exports = DocumentoEmpleadoModel;
