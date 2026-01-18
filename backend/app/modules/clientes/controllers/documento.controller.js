/**
 * ====================================================================
 * CONTROLLER DE DOCUMENTOS CLIENTE
 * ====================================================================
 *
 * Fase 4B - Documentos de Cliente (Ene 2026)
 * CRUD para documentos asociados a clientes
 *
 * ====================================================================
 */

const DocumentoClienteModel = require('../models/documento.model');
const ClienteModel = require('../models/cliente.model');
const { ResponseHelper } = require('../../../utils/helpers');
const asyncHandler = require('../../../middleware/asyncHandler');
const storageService = require('../../../services/storage/storage.service');

class DocumentoClienteController {

    /**
     * Listar documentos de un cliente
     * GET /clientes/:clienteId/documentos
     */
    static listar = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;
        const { tipo, verificado, estado_vencimiento, limite = 50, offset = 0 } = req.query;

        const documentos = await DocumentoClienteModel.listarPorCliente(
            req.tenant.organizacionId,
            parseInt(clienteId),
            {
                tipo,
                verificado: verificado !== undefined ? verificado === 'true' : null,
                estado_vencimiento,
                limite: Math.min(parseInt(limite), 100),
                offset: parseInt(offset)
            }
        );

        return ResponseHelper.success(res, documentos, 'Documentos listados exitosamente');
    });

    /**
     * Obtener documento por ID
     * GET /clientes/:clienteId/documentos/:documentoId
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const { documentoId } = req.params;

        const documento = await DocumentoClienteModel.obtenerPorId(
            req.tenant.organizacionId,
            parseInt(documentoId)
        );

        if (!documento) {
            return ResponseHelper.notFound(res, 'Documento no encontrado');
        }

        return ResponseHelper.success(res, documento, 'Documento obtenido exitosamente');
    });

    /**
     * Crear documento (con o sin archivo)
     * POST /clientes/:clienteId/documentos
     */
    static crear = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Verificar que el cliente existe
        const cliente = await ClienteModel.buscarPorId(organizacionId, parseInt(clienteId));
        if (!cliente) {
            return ResponseHelper.notFound(res, 'Cliente no encontrado');
        }

        let archivoStorageId = null;
        let metadatos = {};

        // Si hay archivo subido
        if (req.file) {
            try {
                // Subir a MinIO
                const archivoSubido = await storageService.upload({
                    buffer: req.file.buffer,
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    organizacionId,
                    folder: `clientes/${clienteId}/documentos`,
                    isPublic: false,
                    entidadTipo: 'cliente_documento',
                    entidadId: parseInt(clienteId)
                });

                archivoStorageId = archivoSubido.id;
                metadatos = {
                    nombre_archivo: req.file.originalname,
                    mime_type: req.file.mimetype,
                    tamano_bytes: req.file.size
                };
            } catch (error) {
                console.error('Error al subir archivo:', error);
                return ResponseHelper.error(res, 'Error al subir el archivo', 500);
            }
        }

        const documentoData = {
            organizacion_id: organizacionId,
            cliente_id: parseInt(clienteId),
            archivo_storage_id: archivoStorageId,
            tipo_documento: req.body.tipo_documento,
            nombre: req.body.nombre,
            descripcion: req.body.descripcion || null,
            fecha_emision: req.body.fecha_emision || null,
            fecha_vencimiento: req.body.fecha_vencimiento || null,
            creado_por: req.user?.id || null,
            ...metadatos
        };

        const nuevoDocumento = await DocumentoClienteModel.crear(documentoData);

        return ResponseHelper.success(res, nuevoDocumento, 'Documento creado exitosamente', 201);
    });

    /**
     * Actualizar documento
     * PUT /clientes/:clienteId/documentos/:documentoId
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { documentoId } = req.params;

        const documentoActualizado = await DocumentoClienteModel.actualizar(
            req.tenant.organizacionId,
            parseInt(documentoId),
            req.body
        );

        return ResponseHelper.success(res, documentoActualizado, 'Documento actualizado exitosamente');
    });

    /**
     * Eliminar documento
     * DELETE /clientes/:clienteId/documentos/:documentoId
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { documentoId } = req.params;

        const eliminado = await DocumentoClienteModel.eliminar(
            req.tenant.organizacionId,
            parseInt(documentoId),
            req.user?.id
        );

        if (!eliminado) {
            return ResponseHelper.notFound(res, 'Documento no encontrado');
        }

        return ResponseHelper.success(res, null, 'Documento eliminado exitosamente');
    });

    /**
     * Verificar/desverificar documento
     * PATCH /clientes/:clienteId/documentos/:documentoId/verificar
     */
    static verificar = asyncHandler(async (req, res) => {
        const { documentoId } = req.params;
        const { verificado } = req.body;

        const documentoVerificado = await DocumentoClienteModel.verificar(
            req.tenant.organizacionId,
            parseInt(documentoId),
            verificado,
            req.user?.id
        );

        return ResponseHelper.success(
            res,
            documentoVerificado,
            `Documento ${verificado ? 'verificado' : 'desverificado'} exitosamente`
        );
    });

    /**
     * Contar documentos de un cliente
     * GET /clientes/:clienteId/documentos/conteo
     */
    static contarDocumentos = asyncHandler(async (req, res) => {
        const { clienteId } = req.params;

        const conteo = await DocumentoClienteModel.contarPorEstado(
            req.tenant.organizacionId,
            parseInt(clienteId)
        );

        return ResponseHelper.success(res, conteo, 'Conteo de documentos obtenido exitosamente');
    });

    /**
     * Obtener URL presigned para descargar documento
     * GET /clientes/:clienteId/documentos/:documentoId/presigned
     */
    static obtenerPresigned = asyncHandler(async (req, res) => {
        const { documentoId } = req.params;
        const { expiry = 3600 } = req.query; // 1 hora por defecto

        const documento = await DocumentoClienteModel.obtenerPorId(
            req.tenant.organizacionId,
            parseInt(documentoId)
        );

        if (!documento) {
            return ResponseHelper.notFound(res, 'Documento no encontrado');
        }

        if (!documento.archivo_storage_id) {
            return ResponseHelper.error(res, 'Este documento no tiene archivo asociado', 400);
        }

        try {
            const presignedUrl = await storageService.getPresignedUrl(
                documento.archivo_bucket,
                documento.archivo_ruta,
                parseInt(expiry)
            );

            return ResponseHelper.success(res, {
                url: presignedUrl,
                expiry: parseInt(expiry),
                nombre_archivo: documento.nombre_archivo || documento.archivo_nombre_storage
            }, 'URL generada exitosamente');
        } catch (error) {
            console.error('Error al generar URL presigned:', error);
            return ResponseHelper.error(res, 'Error al generar URL de descarga', 500);
        }
    });

    /**
     * Obtener tipos de documento disponibles
     * GET /clientes/documentos/tipos
     */
    static obtenerTipos = asyncHandler(async (req, res) => {
        const tipos = await DocumentoClienteModel.obtenerTipos(req.tenant.organizacionId);
        return ResponseHelper.success(res, tipos, 'Tipos de documento obtenidos exitosamente');
    });

    /**
     * Listar documentos por vencer de la organización
     * GET /clientes/documentos/por-vencer
     */
    static listarPorVencer = asyncHandler(async (req, res) => {
        const { dias = 30 } = req.query;

        const documentos = await DocumentoClienteModel.listarPorVencer(
            req.tenant.organizacionId,
            parseInt(dias)
        );

        return ResponseHelper.success(res, documentos, 'Documentos por vencer obtenidos exitosamente');
    });

    /**
     * Subir/reemplazar archivo de un documento existente
     * POST /clientes/:clienteId/documentos/:documentoId/archivo
     */
    static subirArchivo = asyncHandler(async (req, res) => {
        const { clienteId, documentoId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        if (!req.file) {
            return ResponseHelper.error(res, 'No se proporcionó ningún archivo', 400);
        }

        // Verificar que el documento existe
        const documento = await DocumentoClienteModel.obtenerPorId(
            organizacionId,
            parseInt(documentoId)
        );

        if (!documento) {
            return ResponseHelper.notFound(res, 'Documento no encontrado');
        }

        try {
            // Subir a MinIO
            const archivoSubido = await storageService.upload({
                buffer: req.file.buffer,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                organizacionId,
                folder: `clientes/${clienteId}/documentos`,
                isPublic: false,
                entidadTipo: 'cliente_documento',
                entidadId: parseInt(clienteId)
            });

            // Actualizar documento con nuevo archivo
            const documentoActualizado = await DocumentoClienteModel.actualizarArchivo(
                organizacionId,
                parseInt(documentoId),
                archivoSubido.id,
                {
                    nombre_archivo: req.file.originalname,
                    mime_type: req.file.mimetype,
                    tamano_bytes: req.file.size
                }
            );

            return ResponseHelper.success(res, documentoActualizado, 'Archivo subido exitosamente');
        } catch (error) {
            console.error('Error al subir archivo:', error);
            return ResponseHelper.error(res, 'Error al subir el archivo', 500);
        }
    });
}

module.exports = DocumentoClienteController;
