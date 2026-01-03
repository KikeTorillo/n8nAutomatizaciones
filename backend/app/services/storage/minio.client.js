/**
 * Cliente MinIO para almacenamiento de archivos
 * Compatible con API S3
 *
 * @module services/storage/minio.client
 */

const Minio = require('minio');
const logger = require('../../utils/logger');

// ============================================
// CONFIGURACIÓN DEL CLIENTE
// ============================================

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin123'
});

/**
 * Cliente MinIO para generar URLs presigned accesibles desde el navegador
 * Usa el endpoint público (localhost) en lugar del interno (minio)
 * IMPORTANTE: region está configurado para evitar llamadas de red al generar URLs
 */
const minioPublicClient = new Minio.Client({
  endPoint: process.env.MINIO_PUBLIC_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
  region: 'us-east-1' // Evita llamada de red para obtener región
});

// ============================================
// CONFIGURACIÓN DE BUCKETS
// ============================================

const BUCKETS = {
  PUBLIC: process.env.MINIO_BUCKET_PUBLIC || 'nexo-public',
  PRIVATE: process.env.MINIO_BUCKET_PRIVATE || 'nexo-private',
  TEMP: process.env.MINIO_BUCKET_TEMP || 'nexo-temp'
};

// ============================================
// POLÍTICAS DE BUCKET
// ============================================

/**
 * Política de lectura pública para bucket público
 * Permite acceso GET a cualquier objeto sin autenticación
 */
function getPublicReadPolicy(bucketName) {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`]
      }
    ]
  };
}

// ============================================
// INICIALIZACIÓN DE BUCKETS
// ============================================

/**
 * Inicializa los buckets requeridos al arrancar la aplicación
 * - nexo-public: Archivos públicos (logos, imágenes de productos)
 * - nexo-private: Archivos privados (exports, documentos)
 * - nexo-temp: Archivos temporales (auto-delete 24h)
 *
 * @returns {Promise<void>}
 */
async function initializeBuckets() {
  const bucketsConfig = [
    { name: BUCKETS.PUBLIC, policy: 'public-read' },
    { name: BUCKETS.PRIVATE, policy: 'private' },
    { name: BUCKETS.TEMP, policy: 'private' }
  ];

  logger.info('[MinIO] Verificando buckets...');

  for (const bucket of bucketsConfig) {
    try {
      const exists = await minioClient.bucketExists(bucket.name);

      if (!exists) {
        await minioClient.makeBucket(bucket.name);
        logger.info(`[MinIO] Bucket creado: ${bucket.name}`);

        // Aplicar política de lectura pública si corresponde
        if (bucket.policy === 'public-read') {
          const policy = getPublicReadPolicy(bucket.name);
          await minioClient.setBucketPolicy(bucket.name, JSON.stringify(policy));
          logger.info(`[MinIO] Política public-read aplicada a: ${bucket.name}`);
        }
      } else {
        logger.debug(`[MinIO] Bucket existente: ${bucket.name}`);
      }
    } catch (error) {
      logger.error(`[MinIO] Error inicializando bucket ${bucket.name}:`, error.message);
      throw error;
    }
  }

  logger.info('[MinIO] Todos los buckets verificados correctamente');
}

/**
 * Verifica la conexión con MinIO
 * @returns {Promise<boolean>}
 */
async function checkConnection() {
  try {
    await minioClient.listBuckets();
    return true;
  } catch (error) {
    logger.error('[MinIO] Error de conexión:', error.message);
    return false;
  }
}

/**
 * Obtiene estadísticas de un bucket
 * @param {string} bucketName - Nombre del bucket
 * @returns {Promise<Object>}
 */
async function getBucketStats(bucketName) {
  const objects = [];
  const stream = minioClient.listObjects(bucketName, '', true);

  return new Promise((resolve, reject) => {
    let totalSize = 0;
    let count = 0;

    stream.on('data', (obj) => {
      totalSize += obj.size || 0;
      count++;
    });

    stream.on('end', () => {
      resolve({
        bucket: bucketName,
        objectCount: count,
        totalSizeBytes: totalSize,
        totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
      });
    });

    stream.on('error', reject);
  });
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  minioClient,
  minioPublicClient,
  BUCKETS,
  initializeBuckets,
  checkConnection,
  getBucketStats,
  getPublicReadPolicy
};
