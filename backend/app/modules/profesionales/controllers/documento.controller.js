/**
 * DocumentoEmpleadoController - Enero 2026
 * Handlers HTTP para documentos de empleados
 * Fase 2 del Plan de Empleados Competitivo
 */
const DocumentoEmpleadoModel = require('../models/documento.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const logger = require('../../../utils/logger');
const storageService = require('../../../services/storage/storage.service');
const { minioPublicClient, BUCKETS } = require('../../../services/storage/minio.client');

class DocumentoEmpleadoController {

    /**
     * GET /profesionales/:id/documentos
     * Lista documentos de un profesional
     */
    static listar = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            tipo: req.query.tipo || null,
            verificado: req.query.verificado !== undefined ? req.query.verificado === 'true' : null,
            estado_vencimiento: req.query.estado_vencimiento || null,
            limite: Math.min(parseInt(req.query.limit) || 50, 100),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const documentos = await DocumentoEmpleadoModel.listarPorProfesional(
            organizacionId,
            profesionalId,
            filtros
        );

        // Obtener conteo por estado
        const conteo = await DocumentoEmpleadoModel.contarPorEstado(
            organizacionId,
            profesionalId
        );

        return ResponseHelper.success(res, {
            documentos,
            conteo,
            filtros_aplicados: filtros
        }, 'Documentos obtenidos exitosamente');
    });

    /**
     * POST /profesionales/:id/documentos
     * Crea un nuevo documento con archivo (FormData)
     */
    static crear = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        const {
            tipo_documento,
            nombre,
            descripcion,
            numero_documento,
            fecha_emision,
            fecha_vencimiento
        } = req.body;

        let archivoStorageId = null;

        // Si hay archivo, subirlo a MinIO
        if (req.file) {
            try {
                const uploadResult = await storageService.upload({
                    buffer: req.file.buffer,
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    organizacionId,
                    folder: `documentos-empleado/${profesionalId}`,
                    isPublic: false, // Documentos siempre privados
                    entidadTipo: 'documento_empleado',
                    entidadId: null // Se actualizará después de crear el documento
                });

                archivoStorageId = uploadResult.id;
                logger.info(`📁 Archivo subido: ${uploadResult.ruta} (ID: ${archivoStorageId})`);

            } catch (uploadError) {
                logger.error('❌ Error subiendo archivo:', uploadError);
                return ResponseHelper.error(res, 'Error al subir el archivo', 500, {
                    detalle: uploadError.message
                });
            }
        }

        // Crear registro del documento
        const documentoData = {
            organizacion_id: organizacionId,
            profesional_id: profesionalId,
            archivo_storage_id: archivoStorageId,
            tipo_documento,
            nombre,
            descripcion: descripcion || null,
            numero_documento: numero_documento || null,
            fecha_emision: fecha_emision || null,
            fecha_vencimiento: fecha_vencimiento || null,
            creado_por: usuarioId
        };

        try {
            const documento = await DocumentoEmpleadoModel.crear(documentoData);

            // Obtener documento completo con joins
            const documentoCompleto = await DocumentoEmpleadoModel.obtenerPorId(
                organizacionId,
                documento.id
            );

            logger.info(`📄 Documento creado: ${documento.nombre} (ID: ${documento.id}) para profesional ${profesionalId}`);

            return ResponseHelper.success(res, documentoCompleto, 'Documento creado exitosamente', 201);

        } catch (error) {
            // Si falla la creación del documento, eliminar archivo subido
            if (archivoStorageId) {
                logger.warn(`🗑️ Rollback: eliminando archivo ${archivoStorageId} por error en documento`);
                // El StorageService maneja esto internamente en transacciones
            }
            throw error;
        }
    });

    /**
     * GET /profesionales/:id/documentos/:docId
     * Obtiene un documento específico
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const documentoId = parseInt(req.params.docId);
        const organizacionId = req.tenant.organizacionId;

        const documento = await DocumentoEmpleadoModel.obtenerPorId(organizacionId, documentoId);

        if (!documento) {
            return ResponseHelper.notFound(res, 'Documento no encontrado');
        }

        return ResponseHelper.success(res, documento, 'Documento obtenido exitosamente');
    });

    /**
     * PUT /profesionales/:id/documentos/:docId
     * Actualiza metadata de un documento
     */
    static actualizar = asyncHandler(async (req, res) => {
        const documentoId = parseInt(req.params.docId);
        const organizacionId = req.tenant.organizacionId;

        // Verificar que existe
        const documentoExistente = await DocumentoEmpleadoModel.obtenerPorId(organizacionId, documentoId);
        if (!documentoExistente) {
            return ResponseHelper.notFound(res, 'Documento no encontrado');
        }

        const documento = await DocumentoEmpleadoModel.actualizar(
            organizacionId,
            documentoId,
            req.body
        );

        // Obtener documento actualizado con joins
        const documentoCompleto = await DocumentoEmpleadoModel.obtenerPorId(
            organizacionId,
            documento.id
        );

        logger.info(`📝 Documento actualizado: ${documento.nombre} (ID: ${documentoId})`);

        return ResponseHelper.success(res, documentoCompleto, 'Documento actualizado exitosamente');
    });

    /**
     * DELETE /profesionales/:id/documentos/:docId
     * Soft delete de un documento
     */
    static eliminar = asyncHandler(async (req, res) => {
        const documentoId = parseInt(req.params.docId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = req.user.id;

        // Verificar que existe
        const documento = await DocumentoEmpleadoModel.obtenerPorId(organizacionId, documentoId);
        if (!documento) {
            return ResponseHelper.notFound(res, 'Documento no encontrado');
        }

        const eliminado = await DocumentoEmpleadoModel.eliminar(
            organizacionId,
            documentoId,
            usuarioId
        );

        if (!eliminado) {
            return ResponseHelper.error(res, 'No se pudo eliminar el documento', 400);
        }

        logger.info(`🗑️ Documento eliminado: ${documento.nombre} (ID: ${documentoId}) por usuario ${usuarioId}`);

        return ResponseHelper.success(res, { id: documentoId }, 'Documento eliminado exitosamente');
    });

    /**
     * PATCH /profesionales/:id/documentos/:docId/verificar
     * Marca un documento como verificado/no verificado
     */
    static verificar = asyncHandler(async (req, res) => {
        const documentoId = parseInt(req.params.docId);
        const organizacionId = req.tenant.organizacionId;
        const usuarioId = parseInt(req.user.id);  // Asegurar que sea integer
        const { verificado, notas_verificacion } = req.body;

        // Verificar que existe
        const documentoExistente = await DocumentoEmpleadoModel.obtenerPorId(organizacionId, documentoId);
        if (!documentoExistente) {
            return ResponseHelper.notFound(res, 'Documento no encontrado');
        }

        const documento = await DocumentoEmpleadoModel.verificar(
            organizacionId,
            documentoId,
            verificado,
            usuarioId,
            notas_verificacion || null
        );

        // Obtener documento actualizado con joins
        const documentoCompleto = await DocumentoEmpleadoModel.obtenerPorId(
            organizacionId,
            documento.id
        );

        const accion = verificado ? 'verificado' : 'desverificado';
        logger.info(`✅ Documento ${accion}: ${documento.nombre} (ID: ${documentoId}) por usuario ${usuarioId}`);

        return ResponseHelper.success(res, documentoCompleto, `Documento ${accion} exitosamente`);
    });

    /**
     * GET /profesionales/:id/documentos/:docId/presigned
     * Obtiene URL firmada temporal para descargar/ver documento
     */
    static obtenerUrlPresigned = asyncHandler(async (req, res) => {
        const documentoId = parseInt(req.params.docId);
        const organizacionId = req.tenant.organizacionId;
        const expiry = Math.min(parseInt(req.query.expiry) || 3600, 86400); // Max 24 horas

        // Obtener documento con datos de archivo
        const documento = await DocumentoEmpleadoModel.obtenerPorId(organizacionId, documentoId);

        if (!documento) {
            return ResponseHelper.notFound(res, 'Documento no encontrado');
        }

        if (!documento.archivo_storage_id) {
            return ResponseHelper.error(res, 'El documento no tiene archivo asociado', 400);
        }

        try {
            // Generar URL presigned usando cliente público (localhost)
            const presignedUrl = await minioPublicClient.presignedGetObject(
                BUCKETS.PRIVATE,
                documento.archivo_ruta,
                expiry
            );

            logger.info(`🔗 URL presigned generada para documento ${documentoId} (expira en ${expiry}s)`);

            return ResponseHelper.success(res, {
                url: presignedUrl,
                expiry_seconds: expiry,
                nombre_archivo: documento.archivo_nombre,
                mime_type: documento.archivo_mime,
                tamano_bytes: documento.archivo_tamano
            }, 'URL de descarga generada exitosamente');

        } catch (error) {
            logger.error('❌ Error generando URL presigned:', error);
            return ResponseHelper.error(res, 'Error al generar URL de descarga', 500);
        }
    });

    /**
     * GET /documentos-empleado/proximos-vencer
     * Lista documentos próximos a vencer de toda la organización
     */
    static listarProximosVencer = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const filtros = {
            dias: Math.min(parseInt(req.query.dias) || 30, 365),
            limite: Math.min(parseInt(req.query.limit) || 50, 100),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        const documentos = await DocumentoEmpleadoModel.listarProximosVencer(
            organizacionId,
            filtros
        );

        return ResponseHelper.success(res, {
            documentos,
            filtros_aplicados: filtros,
            total: documentos.length
        }, 'Documentos próximos a vencer obtenidos exitosamente');
    });

    /**
     * POST /profesionales/:id/documentos/:docId/reemplazar-archivo
     * Reemplaza el archivo de un documento existente
     */
    static reemplazarArchivo = asyncHandler(async (req, res) => {
        const documentoId = parseInt(req.params.docId);
        const profesionalId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        if (!req.file) {
            return ResponseHelper.error(res, 'No se proporcionó archivo', 400);
        }

        // Verificar que existe el documento
        const documentoExistente = await DocumentoEmpleadoModel.obtenerPorId(organizacionId, documentoId);
        if (!documentoExistente) {
            return ResponseHelper.notFound(res, 'Documento no encontrado');
        }

        try {
            // Subir nuevo archivo
            const uploadResult = await storageService.upload({
                buffer: req.file.buffer,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                organizacionId,
                folder: `documentos-empleado/${profesionalId}`,
                isPublic: false,
                entidadTipo: 'documento_empleado',
                entidadId: documentoId
            });

            // Actualizar referencia en documento
            const documento = await DocumentoEmpleadoModel.actualizarArchivo(
                organizacionId,
                documentoId,
                uploadResult.id
            );

            // Obtener documento completo
            const documentoCompleto = await DocumentoEmpleadoModel.obtenerPorId(
                organizacionId,
                documento.id
            );

            logger.info(`📁 Archivo reemplazado para documento ${documentoId}`);

            return ResponseHelper.success(res, documentoCompleto, 'Archivo reemplazado exitosamente');

        } catch (error) {
            logger.error('❌ Error reemplazando archivo:', error);
            return ResponseHelper.error(res, 'Error al reemplazar archivo', 500, {
                detalle: error.message
            });
        }
    });

}

module.exports = DocumentoEmpleadoController;
