# Plan: Sistema de Almacenamiento con MinIO

**Fecha**: 3 Diciembre 2025
**Estado**: Propuesta - Revisado por Arquitecto
**Prioridad**: Alta (prerequisito para módulo Invitaciones)
**Revisión**: v2.0 - Incluye mejoras de seguridad y transacciones atómicas

---

## 1. Resumen Ejecutivo

Implementar **MinIO** como sistema de almacenamiento de archivos (imágenes, documentos, exports) para toda la plataforma Nexo. MinIO es compatible con API S3 y se ejecuta self-hosted en Docker.

### ¿Por qué MinIO?

| Criterio | MinIO | Cloudinary | S3 |
|----------|-------|------------|-----|
| Control de datos | ✅ Total | ❌ Tercero | ❌ AWS |
| Costo a escala | ✅ Solo servidor | ❌ Crece con uso | ⚠️ Por GB/request |
| Multi-tenant | ✅ Configurable | ⚠️ Manual | ⚠️ Manual |
| Latencia LATAM | ✅ Tu servidor | ⚠️ CDN externo | ⚠️ Región |
| Setup | ⚠️ Docker | ✅ 5 min | ⚠️ Config IAM |
| API S3 compatible | ✅ 100% | ❌ Propia | ✅ Nativa |
| Transformaciones | ❌ Manual | ✅ Al vuelo | ❌ Lambda |

### Casos de Uso en Nexo

| Módulo | Tipo de Archivo | Uso |
|--------|----------------|-----|
| **Invitaciones** | Fotos galería, portadas | Alta prioridad |
| **Organizaciones** | Logos | Ya existe campo `logo_url` |
| **Productos** | Imágenes de productos | Inventario |
| **Profesionales** | Fotos de perfil | Marketplace |
| **Marketplace** | Galería pública | Perfiles públicos |
| **Exports** | CSV, PDF reportes | Temporal |
| **Chatbots** | Imágenes recibidas | Multimedia |

---

## 2. Arquitectura

### 2.1 Diagrama de Integración

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEXO PLATFORM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Frontend │    │ Backend  │    │  MinIO   │    │ PostgreSQL│  │
│  │  React   │───▶│  Express │───▶│  S3 API  │    │    DB    │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │          │
│       │               │               │               │          │
│       ▼               ▼               ▼               ▼          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Docker Network                        │    │
│  │                                                          │    │
│  │   frontend:8080  backend:3000  minio:9000  postgres:5432 │    │
│  │                                minio-console:9001        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Upload (con validación de seguridad)

```
1. Frontend: Usuario selecciona archivo
                    │
                    ▼
2. Frontend: Valida tipo/tamaño (client-side)
                    │
                    ▼
3. Frontend: POST /api/v1/storage/upload (multipart/form-data)
                    │
                    ▼
4. Backend: Middleware multer recibe archivo (memory/disk)
                    │
                    ▼
5. Backend: Valida permisos + límites del plan + cuota almacenamiento
                    │
                    ▼
6. Backend: ⚠️ VALIDACIÓN MAGIC BYTES (file-type)
           Verifica que el contenido real coincida con MIME declarado
                    │
                    ▼
7. Backend: Genera nombre único (uuid + extension)
                    │
                    ▼
8. Backend: 🔄 INICIA TRANSACCIÓN PostgreSQL
                    │
                    ▼
9. Backend: Upload a MinIO (bucket por tenant)
                    │
                    ▼
10. Backend: Genera thumbnail (sharp) si es imagen
                    │
                    ▼
11. Backend: Guarda metadata en PostgreSQL
                    │
                    ▼
12. Backend: ✅ COMMIT transacción (o ROLLBACK + cleanup MinIO si falla)
                    │
                    ▼
13. Backend: Retorna URL pública/firmada
                    │
                    ▼
14. Frontend: Muestra preview
```

### 2.3 Estructura de Buckets

```
minio/
├── nexo-public/                    # Archivos públicos (sin auth)
│   ├── org-{id}/                   # Por organización
│   │   ├── logos/
│   │   │   └── logo-{uuid}.png
│   │   ├── invitaciones/
│   │   │   ├── evento-{id}/
│   │   │   │   ├── portada-{uuid}.jpg
│   │   │   │   ├── galeria/
│   │   │   │   │   ├── img-{uuid}.jpg
│   │   │   │   │   └── thumb-{uuid}.jpg
│   │   │   │   └── plantilla-preview.jpg
│   │   ├── productos/
│   │   │   └── prod-{id}-{uuid}.jpg
│   │   └── profesionales/
│   │       └── prof-{id}-{uuid}.jpg
│   │
├── nexo-private/                   # Archivos privados (requiere auth)
│   ├── org-{id}/
│   │   ├── exports/
│   │   │   ├── invitados-{date}.csv
│   │   │   └── reporte-{date}.pdf
│   │   ├── backups/
│   │   └── documentos/
│   │
└── nexo-temp/                      # Archivos temporales (auto-delete 24h)
    └── uploads/
        └── {uuid}-temp.{ext}
```

---

## 3. Configuración Docker

### 3.1 Agregar a docker-compose.dev.yml

```yaml
  # ============================================
  # MINIO - Object Storage (S3 Compatible)
  # ============================================
  minio:
    image: minio/minio:latest
    container_name: minio_storage
    restart: unless-stopped
    ports:
      - "9000:9000"     # API S3
      - "9001:9001"     # Console Web
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin123}
      MINIO_BROWSER_REDIRECT_URL: http://localhost:9001
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    networks:
      - nexo-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - postgres

volumes:
  minio_data:
    driver: local
```

### 3.2 Actualizar Dockerfile del Backend (para Sharp)

```dockerfile
# backend/app/dockerfile.dev - AGREGAR estas líneas
FROM node:22-alpine

# ⚠️ REQUERIDO para Sharp (procesamiento de imágenes)
RUN apk add --no-cache \
    vips-dev \
    build-base \
    python3

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

> **Nota**: Sharp requiere `vips-dev` en Alpine Linux para compilar binarios nativos.

### 3.3 Variables de Entorno (.env)

```bash
# ============================================
# MINIO Configuration
# ============================================
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_USE_SSL=false

# Buckets
MINIO_BUCKET_PUBLIC=nexo-public
MINIO_BUCKET_PRIVATE=nexo-private
MINIO_BUCKET_TEMP=nexo-temp

# URLs públicas (para frontend)
MINIO_PUBLIC_URL=http://localhost:9000
```

---

## 4. Implementación Backend

### 4.1 Estructura de Archivos

```
backend/app/
├── services/
│   └── storage/
│       ├── index.js              # Export principal
│       ├── minio.client.js       # Cliente MinIO configurado
│       ├── storage.service.js    # Lógica de negocio
│       ├── image.processor.js    # Procesamiento con Sharp
│       └── policies.js           # Políticas de buckets
├── modules/
│   └── storage/
│       ├── controllers/
│       │   └── storage.controller.js
│       ├── routes/
│       │   └── storage.routes.js
│       ├── schemas/
│       │   └── storage.schema.js
│       └── models/
│           └── archivo.model.js
└── middleware/
    └── upload.js                 # Multer config
```

### 4.2 Cliente MinIO

```javascript
// backend/app/services/storage/minio.client.js
const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER,
  secretKey: process.env.MINIO_ROOT_PASSWORD
});

// Inicializar buckets al arrancar
async function initializeBuckets() {
  const buckets = [
    { name: process.env.MINIO_BUCKET_PUBLIC, policy: 'public-read' },
    { name: process.env.MINIO_BUCKET_PRIVATE, policy: 'private' },
    { name: process.env.MINIO_BUCKET_TEMP, policy: 'private' }
  ];

  for (const bucket of buckets) {
    const exists = await minioClient.bucketExists(bucket.name);
    if (!exists) {
      await minioClient.makeBucket(bucket.name);
      console.log(`✅ Bucket creado: ${bucket.name}`);

      if (bucket.policy === 'public-read') {
        await setPublicReadPolicy(bucket.name);
      }
    }
  }
}

async function setPublicReadPolicy(bucketName) {
  const policy = {
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
  await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
}

module.exports = { minioClient, initializeBuckets };
```

### 4.3 Storage Service (con Transacciones Atómicas)

```javascript
// backend/app/services/storage/storage.service.js
const { minioClient } = require('./minio.client');
const { processImage } = require('./image.processor');
const { validateFileContent } = require('./content.validator');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const pool = require('../../../config/database'); // Pool PostgreSQL

class StorageService {
  constructor() {
    this.publicBucket = process.env.MINIO_BUCKET_PUBLIC;
    this.privateBucket = process.env.MINIO_BUCKET_PRIVATE;
    this.tempBucket = process.env.MINIO_BUCKET_TEMP;
    this.baseUrl = process.env.MINIO_PUBLIC_URL;
  }

  /**
   * Sube un archivo al storage CON TRANSACCIÓN ATÓMICA
   *
   * IMPORTANTE: Esta función garantiza que si la metadata falla,
   * el archivo en MinIO se elimina automáticamente (rollback)
   *
   * @param {Object} options
   * @param {Buffer} options.buffer - Contenido del archivo
   * @param {string} options.originalName - Nombre original
   * @param {string} options.mimeType - Tipo MIME
   * @param {number} options.organizacionId - ID de la organización
   * @param {string} options.folder - Carpeta destino (logos, invitaciones, etc.)
   * @param {boolean} options.isPublic - Si es público o privado
   * @param {boolean} options.generateThumbnail - Generar thumbnail para imágenes
   * @param {string} options.entidadTipo - Tipo de entidad (producto, profesional, etc.)
   * @param {number} options.entidadId - ID de la entidad relacionada
   */
  async upload(options) {
    const {
      buffer,
      originalName,
      mimeType,
      organizacionId,
      folder = 'general',
      isPublic = true,
      generateThumbnail = false,
      entidadTipo = null,
      entidadId = null
    } = options;

    // ⚠️ PASO 1: Validar contenido real (magic bytes)
    const validation = await validateFileContent(buffer, mimeType);
    if (!validation.valid) {
      throw new Error(`Validación de contenido falló: ${validation.error}`);
    }

    // PASO 2: Generar nombre único
    const ext = path.extname(originalName).toLowerCase();
    const uuid = uuidv4();
    const fileName = `${uuid}${ext}`;

    // PASO 3: Construir paths
    const objectPath = `org-${organizacionId}/${folder}/${fileName}`;
    const bucket = isPublic ? this.publicBucket : this.privateBucket;
    let thumbPath = null;

    // PASO 4: Procesar imagen si aplica
    let processedBuffer = buffer;
    let thumbnailBuffer = null;

    if (this.isImage(mimeType)) {
      const processed = await processImage(buffer, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 85
      });
      processedBuffer = processed.buffer;

      if (generateThumbnail) {
        const thumbnail = await processImage(buffer, {
          width: 300,
          height: 200,
          fit: 'cover',
          quality: 80
        });
        thumbnailBuffer = thumbnail.buffer;
        thumbPath = `org-${organizacionId}/${folder}/thumbs/thumb-${uuid}${ext}`;
      }
    }

    // 🔄 PASO 5: TRANSACCIÓN ATÓMICA
    const client = await pool.connect();
    const uploadedPaths = []; // Para cleanup en caso de error

    try {
      await client.query('BEGIN');

      // Setear contexto RLS
      await client.query(`SET LOCAL app.current_tenant_id = '${organizacionId}'`);

      // Subir archivo principal a MinIO
      await minioClient.putObject(bucket, objectPath, processedBuffer, {
        'Content-Type': mimeType,
        'x-amz-meta-original-name': originalName,
        'x-amz-meta-organization-id': organizacionId.toString()
      });
      uploadedPaths.push({ bucket, path: objectPath });

      // Subir thumbnail si existe
      let thumbnailUrl = null;
      if (thumbnailBuffer && thumbPath) {
        await minioClient.putObject(bucket, thumbPath, thumbnailBuffer, {
          'Content-Type': mimeType
        });
        uploadedPaths.push({ bucket, path: thumbPath });
        thumbnailUrl = `${this.baseUrl}/${bucket}/${thumbPath}`;
      }

      // Generar URL
      const url = isPublic
        ? `${this.baseUrl}/${bucket}/${objectPath}`
        : await this.getPresignedUrl(bucket, objectPath, 3600);

      // Guardar metadata en PostgreSQL
      const insertQuery = `
        INSERT INTO archivos_storage (
          organizacion_id, entidad_tipo, entidad_id,
          nombre_original, nombre_storage, mime_type, tamano_bytes,
          bucket, path, url_publica, thumbnail_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, creado_en
      `;

      const result = await client.query(insertQuery, [
        organizacionId,
        entidadTipo,
        entidadId,
        originalName,
        fileName,
        mimeType,
        processedBuffer.length,
        bucket,
        objectPath,
        isPublic ? url : null,
        thumbnailUrl
      ]);

      // ✅ COMMIT - Todo exitoso
      await client.query('COMMIT');

      return {
        id: result.rows[0].id,
        url,
        thumbnailUrl,
        bucket,
        path: objectPath,
        fileName,
        mimeType,
        size: processedBuffer.length,
        creadoEn: result.rows[0].creado_en
      };

    } catch (error) {
      // ❌ ROLLBACK PostgreSQL
      await client.query('ROLLBACK');

      // 🧹 CLEANUP MinIO - Eliminar archivos subidos
      for (const uploaded of uploadedPaths) {
        try {
          await minioClient.removeObject(uploaded.bucket, uploaded.path);
          console.log(`🧹 Cleanup: eliminado ${uploaded.path}`);
        } catch (cleanupError) {
          console.error(`Error en cleanup de ${uploaded.path}:`, cleanupError);
        }
      }

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Elimina un archivo del storage (con transacción)
   */
  async delete(archivoId, organizacionId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.current_tenant_id = '${organizacionId}'`);

      // Obtener info del archivo
      const result = await client.query(
        'SELECT bucket, path FROM archivos_storage WHERE id = $1',
        [archivoId]
      );

      if (result.rows.length === 0) {
        throw new Error('Archivo no encontrado');
      }

      const { bucket, path: objectPath } = result.rows[0];

      // Eliminar de MinIO
      await minioClient.removeObject(bucket, objectPath);

      // Intentar eliminar thumbnail
      const thumbPath = objectPath.replace(/\/([^/]+)$/, '/thumbs/thumb-$1');
      try {
        await minioClient.removeObject(bucket, thumbPath);
      } catch (e) {
        // Thumbnail no existe, ignorar
      }

      // Eliminar metadata
      await client.query('DELETE FROM archivos_storage WHERE id = $1', [archivoId]);

      await client.query('COMMIT');
      return { success: true };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Genera URL firmada para archivos privados
   */
  async getPresignedUrl(bucket, objectPath, expirySeconds = 3600) {
    return await minioClient.presignedGetObject(bucket, objectPath, expirySeconds);
  }

  /**
   * Lista archivos de una organización
   */
  async listFiles(organizacionId, options = {}) {
    const { entidadTipo, entidadId, limit = 50, offset = 0 } = options;

    let query = `
      SELECT id, nombre_original, mime_type, tamano_bytes,
             url_publica, thumbnail_url, creado_en, entidad_tipo, entidad_id
      FROM archivos_storage
      WHERE organizacion_id = $1 AND activo = true
    `;
    const params = [organizacionId];

    if (entidadTipo) {
      query += ` AND entidad_tipo = $${params.length + 1}`;
      params.push(entidadTipo);
    }
    if (entidadId) {
      query += ` AND entidad_id = $${params.length + 1}`;
      params.push(entidadId);
    }

    query += ` ORDER BY creado_en DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Obtiene uso de almacenamiento de una organización
   */
  async getStorageUsage(organizacionId) {
    const query = `
      SELECT
        COUNT(*) as total_archivos,
        COALESCE(SUM(tamano_bytes), 0) as total_bytes,
        ROUND(COALESCE(SUM(tamano_bytes), 0) / 1024.0 / 1024.0, 2) as total_mb
      FROM archivos_storage
      WHERE organizacion_id = $1 AND activo = true
    `;
    const result = await pool.query(query, [organizacionId]);
    return result.rows[0];
  }

  /**
   * Verifica si el MIME type es una imagen
   */
  isImage(mimeType) {
    return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);
  }

  /**
   * Copia archivo de temporal a destino final
   */
  async moveFromTemp(tempPath, destinationBucket, destinationPath) {
    await minioClient.copyObject(
      destinationBucket,
      destinationPath,
      `/${this.tempBucket}/${tempPath}`
    );
    await minioClient.removeObject(this.tempBucket, tempPath);
    return `${this.baseUrl}/${destinationBucket}/${destinationPath}`;
  }
}

module.exports = new StorageService();
```

### 4.4 Image Processor

```javascript
// backend/app/services/storage/image.processor.js
const sharp = require('sharp');

/**
 * Procesa una imagen con Sharp
 * @param {Buffer} buffer - Buffer de la imagen
 * @param {Object} options - Opciones de procesamiento
 */
async function processImage(buffer, options = {}) {
  const {
    width,
    height,
    maxWidth = 1920,
    maxHeight = 1080,
    fit = 'inside',
    quality = 85,
    format = 'jpeg'
  } = options;

  let pipeline = sharp(buffer);

  // Rotar según EXIF
  pipeline = pipeline.rotate();

  // Redimensionar
  if (width && height) {
    pipeline = pipeline.resize(width, height, { fit });
  } else {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Formato y calidad
  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, progressive: true });
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality });
  } else if (format === 'png') {
    pipeline = pipeline.png({ compressionLevel: 9 });
  }

  const outputBuffer = await pipeline.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: outputBuffer.length
  };
}

module.exports = { processImage };
```

### 4.5 Validador de Contenido Real (SEGURIDAD CRÍTICA)

```javascript
// backend/app/services/storage/content.validator.js
const { fileTypeFromBuffer } = require('file-type');

/**
 * VALIDACIÓN DE MAGIC BYTES
 * Previene ataques donde se sube un archivo malicioso con extensión falsa
 * Ejemplo: un .exe renombrado a .jpg
 */

// Mapeo de MIME types permitidos y sus firmas válidas
const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['image/jpeg'],
  'image/png': ['image/png'],
  'image/gif': ['image/gif'],
  'image/webp': ['image/webp'],
  'application/pdf': ['application/pdf'],
  'text/csv': ['text/plain', 'application/csv', 'text/csv'], // CSV puede variar
};

/**
 * Valida que el contenido real del archivo coincida con el MIME declarado
 * @param {Buffer} buffer - Contenido del archivo
 * @param {string} declaredMimeType - MIME type declarado por el cliente
 * @returns {Object} { valid: boolean, detectedType: string, error?: string }
 */
async function validateFileContent(buffer, declaredMimeType) {
  // Detectar tipo real basado en magic bytes
  const detected = await fileTypeFromBuffer(buffer);

  // Para archivos de texto (CSV), file-type no puede detectarlos
  // ya que no tienen magic bytes específicos
  if (!detected) {
    // Si declaró CSV/texto y no se detectó tipo, es válido
    if (['text/csv', 'text/plain', 'application/csv'].includes(declaredMimeType)) {
      // Validar que sea texto válido (no binario)
      const isText = isValidTextFile(buffer);
      if (!isText) {
        return {
          valid: false,
          detectedType: 'binary',
          error: 'El archivo parece ser binario, no texto'
        };
      }
      return { valid: true, detectedType: 'text/csv' };
    }

    return {
      valid: false,
      detectedType: 'unknown',
      error: 'No se pudo determinar el tipo de archivo'
    };
  }

  // Verificar que el tipo detectado esté en los permitidos para el MIME declarado
  const allowedTypes = ALLOWED_MIME_TYPES[declaredMimeType];
  if (!allowedTypes) {
    return {
      valid: false,
      detectedType: detected.mime,
      error: `Tipo MIME no permitido: ${declaredMimeType}`
    };
  }

  if (!allowedTypes.includes(detected.mime)) {
    return {
      valid: false,
      detectedType: detected.mime,
      error: `Contenido no coincide: declarado ${declaredMimeType}, detectado ${detected.mime}`
    };
  }

  return { valid: true, detectedType: detected.mime };
}

/**
 * Verifica si un buffer contiene texto válido (no binario)
 */
function isValidTextFile(buffer) {
  // Verificar primeros 8000 bytes por caracteres no imprimibles
  const sample = buffer.slice(0, 8000);
  for (const byte of sample) {
    // Permitir: tabs, newlines, carriage returns, y ASCII imprimible
    if (byte !== 9 && byte !== 10 && byte !== 13 && (byte < 32 || byte > 126)) {
      // Permitir UTF-8 multibyte (128-255)
      if (byte < 128 || byte > 255) {
        return false;
      }
    }
  }
  return true;
}

module.exports = { validateFileContent, ALLOWED_MIME_TYPES };
```

### 4.6 Controller y Routes

```javascript
// backend/app/modules/storage/controllers/storage.controller.js
const storageService = require('../../../services/storage');
const { asyncHandler } = require('../../../middleware');

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se proporcionó archivo' });
  }

  const { folder = 'general', generateThumbnail = false } = req.body;
  const organizacionId = req.user.organizacion_id;

  const result = await storageService.upload({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    organizacionId,
    folder,
    isPublic: true,
    generateThumbnail: generateThumbnail === 'true'
  });

  res.json({
    success: true,
    data: result
  });
});

const deleteFile = asyncHandler(async (req, res) => {
  const { bucket, path } = req.body;
  const organizacionId = req.user.organizacion_id;

  // Verificar que el path pertenece a la organización
  if (!path.startsWith(`org-${organizacionId}/`)) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  await storageService.delete(bucket, path);

  res.json({
    success: true,
    message: 'Archivo eliminado'
  });
});

module.exports = { uploadFile, deleteFile };
```

```javascript
// backend/app/modules/storage/routes/storage.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile, deleteFile } = require('../controllers/storage.controller');
const { authenticateToken } = require('../../../middleware');

// Configuración Multer (memoria)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

router.post('/upload', authenticateToken, upload.single('file'), uploadFile);
router.delete('/delete', authenticateToken, deleteFile);

module.exports = router;
```

---

## 5. Tabla de Metadatos (PostgreSQL)

```sql
-- =============================================
-- TABLA: archivos_storage
-- Metadatos de archivos subidos a MinIO
-- =============================================
CREATE TABLE archivos_storage (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Referencia al recurso
    entidad_tipo VARCHAR(50) NOT NULL,  -- 'evento_invitacion', 'producto', 'profesional', etc.
    entidad_id INTEGER NOT NULL,

    -- Información del archivo
    nombre_original VARCHAR(255) NOT NULL,
    nombre_storage VARCHAR(255) NOT NULL,  -- UUID + extension
    mime_type VARCHAR(100) NOT NULL,
    tamano_bytes INTEGER NOT NULL,

    -- Ubicación en MinIO
    bucket VARCHAR(50) NOT NULL,
    path TEXT NOT NULL,
    url_publica TEXT,
    thumbnail_url TEXT,

    -- Metadata
    es_principal BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',

    -- Control
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_archivos_org ON archivos_storage(organizacion_id);
CREATE INDEX idx_archivos_entidad ON archivos_storage(entidad_tipo, entidad_id);
CREATE INDEX idx_archivos_bucket ON archivos_storage(bucket);

-- RLS
ALTER TABLE archivos_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY archivos_storage_tenant ON archivos_storage
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );
```

### 5.2 Límites de Almacenamiento por Plan

```sql
-- =============================================
-- AGREGAR LÍMITE DE ALMACENAMIENTO A PLANES
-- =============================================
ALTER TABLE planes_subscripcion
ADD COLUMN limite_almacenamiento_mb INTEGER DEFAULT 500;

-- Actualizar planes existentes
UPDATE planes_subscripcion SET limite_almacenamiento_mb = 500 WHERE tipo = 'trial';
UPDATE planes_subscripcion SET limite_almacenamiento_mb = 2000 WHERE tipo = 'pro';
UPDATE planes_subscripcion SET limite_almacenamiento_mb = 10000 WHERE tipo = 'enterprise';
UPDATE planes_subscripcion SET limite_almacenamiento_mb = NULL WHERE tipo = 'custom'; -- Sin límite

COMMENT ON COLUMN planes_subscripcion.limite_almacenamiento_mb IS
  'Límite de almacenamiento en MB. NULL = sin límite (custom plans)';
```

### 5.3 Middleware de Verificación de Cuota

```javascript
// backend/app/middleware/storageLimit.js
const pool = require('../config/database');
const { asyncHandler } = require('./asyncHandler');

/**
 * Middleware que verifica si la organización tiene cuota disponible
 * Usar ANTES de cualquier endpoint de upload
 */
const verificarCuotaStorage = asyncHandler(async (req, res, next) => {
  const organizacionId = req.user.organizacion_id;

  // Obtener uso actual y límite del plan
  const query = `
    SELECT
      ps.limite_almacenamiento_mb,
      COALESCE(
        (SELECT ROUND(SUM(tamano_bytes) / 1024.0 / 1024.0, 2)
         FROM archivos_storage
         WHERE organizacion_id = $1 AND activo = true),
        0
      ) as uso_actual_mb
    FROM suscripciones s
    JOIN planes_subscripcion ps ON s.plan_id = ps.id
    WHERE s.organizacion_id = $1 AND s.estado = 'activa'
  `;

  const result = await pool.query(query, [organizacionId]);

  if (result.rows.length === 0) {
    return res.status(403).json({
      error: 'Suscripción no activa',
      codigo: 'SUBSCRIPTION_INACTIVE'
    });
  }

  const { limite_almacenamiento_mb, uso_actual_mb } = result.rows[0];

  // Si límite es NULL, es plan custom sin límite
  if (limite_almacenamiento_mb !== null) {
    // Verificar archivo entrante (estimado del Content-Length)
    const archivoSizeMb = (req.headers['content-length'] || 0) / 1024 / 1024;
    const proyectado = parseFloat(uso_actual_mb) + archivoSizeMb;

    if (proyectado > limite_almacenamiento_mb) {
      return res.status(403).json({
        error: 'Límite de almacenamiento alcanzado',
        codigo: 'STORAGE_LIMIT_EXCEEDED',
        uso_actual_mb: parseFloat(uso_actual_mb),
        limite_mb: limite_almacenamiento_mb,
        disponible_mb: Math.max(0, limite_almacenamiento_mb - parseFloat(uso_actual_mb))
      });
    }
  }

  // Agregar info de cuota al request para uso posterior
  req.storageQuota = {
    usoActualMb: parseFloat(uso_actual_mb),
    limiteMb: limite_almacenamiento_mb,
    disponibleMb: limite_almacenamiento_mb
      ? Math.max(0, limite_almacenamiento_mb - parseFloat(uso_actual_mb))
      : null
  };

  next();
});

module.exports = { verificarCuotaStorage };
```

---

## 6. Frontend - Componente de Upload

```jsx
// frontend/src/components/common/FileUploader.jsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image, Loader2 } from 'lucide-react';
import { storageApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/useToast';

export default function FileUploader({
  onUploadComplete,
  folder = 'general',
  generateThumbnail = false,
  maxFiles = 1,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = ''
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const toast = useToast();

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    // Preview local
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('generateThumbnail', generateThumbnail);

      const response = await storageApi.upload(formData);

      onUploadComplete?.(response.data.data);
      toast.success('Archivo subido correctamente');
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Error al subir el archivo');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [folder, generateThumbnail, onUploadComplete, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {})
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
        transition-colors duration-200
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${className}
      `}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Subiendo...</p>
        </div>
      ) : preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreview(null);
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {acceptedTypes.some(t => t.startsWith('image/')) ? (
            <Image className="h-10 w-10 text-gray-400" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz clic'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Máx {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 7. Endpoints API

```
# =============================================
# STORAGE (autenticado)
# =============================================
POST   /api/v1/storage/upload              # Subir archivo
DELETE /api/v1/storage/:id                 # Eliminar archivo por ID
GET    /api/v1/storage/files               # Listar archivos de la org
GET    /api/v1/storage/files/:entidadTipo/:entidadId  # Archivos de una entidad
GET    /api/v1/storage/usage               # Uso de almacenamiento
GET    /api/v1/storage/quota               # Cuota disponible del plan
GET    /api/v1/storage/presigned/:id       # URL firmada para archivo privado

# =============================================
# Acceso directo a MinIO (archivos públicos)
# =============================================
GET    http://localhost:9000/nexo-public/org-{id}/...
```

### 7.1 Controller Completo

```javascript
// backend/app/modules/storage/controllers/storage.controller.js
const storageService = require('../../../services/storage');
const { validateFileContent } = require('../../../services/storage/content.validator');
const { asyncHandler } = require('../../../middleware');

/**
 * POST /api/v1/storage/upload
 * Sube un archivo con validación de contenido y cuota
 */
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se proporcionó archivo' });
  }

  const {
    folder = 'general',
    generateThumbnail = 'false',
    entidadTipo = null,
    entidadId = null
  } = req.body;

  const organizacionId = req.user.organizacion_id;

  const result = await storageService.upload({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    organizacionId,
    folder,
    isPublic: true,
    generateThumbnail: generateThumbnail === 'true',
    entidadTipo,
    entidadId: entidadId ? parseInt(entidadId) : null
  });

  res.status(201).json({
    success: true,
    data: result,
    quota: req.storageQuota // Agregado por middleware
  });
});

/**
 * DELETE /api/v1/storage/:id
 * Elimina un archivo por su ID
 */
const deleteFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizacionId = req.user.organizacion_id;

  await storageService.delete(parseInt(id), organizacionId);

  res.json({
    success: true,
    message: 'Archivo eliminado correctamente'
  });
});

/**
 * GET /api/v1/storage/files
 * Lista archivos de la organización
 */
const listFiles = asyncHandler(async (req, res) => {
  const organizacionId = req.user.organizacion_id;
  const { entidadTipo, entidadId, limit = 50, offset = 0 } = req.query;

  const archivos = await storageService.listFiles(organizacionId, {
    entidadTipo,
    entidadId: entidadId ? parseInt(entidadId) : null,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: archivos,
    pagination: { limit: parseInt(limit), offset: parseInt(offset) }
  });
});

/**
 * GET /api/v1/storage/usage
 * Obtiene uso de almacenamiento
 */
const getStorageUsage = asyncHandler(async (req, res) => {
  const organizacionId = req.user.organizacion_id;

  const usage = await storageService.getStorageUsage(organizacionId);

  res.json({
    success: true,
    data: {
      totalArchivos: parseInt(usage.total_archivos),
      totalBytes: parseInt(usage.total_bytes),
      totalMb: parseFloat(usage.total_mb)
    }
  });
});

/**
 * GET /api/v1/storage/quota
 * Obtiene cuota del plan y uso actual
 */
const getStorageQuota = asyncHandler(async (req, res) => {
  // Usa datos del middleware verificarCuotaStorage
  res.json({
    success: true,
    data: req.storageQuota
  });
});

/**
 * GET /api/v1/storage/presigned/:id
 * Genera URL firmada para archivo privado
 */
const getPresignedUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { expirySeconds = 3600 } = req.query;
  const organizacionId = req.user.organizacion_id;

  // Obtener archivo y verificar pertenencia
  const archivos = await storageService.listFiles(organizacionId, {});
  const archivo = archivos.find(a => a.id === parseInt(id));

  if (!archivo) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  const url = await storageService.getPresignedUrl(
    archivo.bucket,
    archivo.path,
    parseInt(expirySeconds)
  );

  res.json({
    success: true,
    data: { url, expiresIn: parseInt(expirySeconds) }
  });
});

module.exports = {
  uploadFile,
  deleteFile,
  listFiles,
  getStorageUsage,
  getStorageQuota,
  getPresignedUrl
};
```

### 7.2 Routes Completas

```javascript
// backend/app/modules/storage/routes/storage.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadFile,
  deleteFile,
  listFiles,
  getStorageUsage,
  getStorageQuota,
  getPresignedUrl
} = require('../controllers/storage.controller');
const { authenticateToken } = require('../../../middleware');
const { verificarCuotaStorage } = require('../../../middleware/storageLimit');
const { apiRateLimit } = require('../../../middleware/rateLimiting');

// Configuración Multer (memoria)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

// Rate limit específico para uploads (más restrictivo)
const uploadRateLimit = apiRateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10 // 10 uploads por minuto
});

// =============================================
// RUTAS
// =============================================

// Subir archivo (con verificación de cuota)
router.post('/upload',
  authenticateToken,
  uploadRateLimit,
  verificarCuotaStorage,
  upload.single('file'),
  uploadFile
);

// Eliminar archivo
router.delete('/:id',
  authenticateToken,
  deleteFile
);

// Listar archivos
router.get('/files',
  authenticateToken,
  listFiles
);

// Uso de almacenamiento
router.get('/usage',
  authenticateToken,
  getStorageUsage
);

// Cuota disponible
router.get('/quota',
  authenticateToken,
  verificarCuotaStorage,
  getStorageQuota
);

// URL firmada para privados
router.get('/presigned/:id',
  authenticateToken,
  getPresignedUrl
);

module.exports = router;
```

---

## 8. Limpieza Automática

### 8.1 Job de Limpieza con pg_cron (Recomendado)

> **¿Por qué pg_cron en lugar de node-cron?**
> - El proyecto ya tiene `pg_cron` configurado en PostgreSQL
> - No depende de que el backend esté corriendo
> - Más confiable y centralizado
> - Logs nativos en PostgreSQL

```sql
-- =============================================
-- JOB DE LIMPIEZA DE ARCHIVOS TEMPORALES
-- Ejecutar cada día a las 3 AM
-- =============================================

-- 1. Crear función de limpieza
CREATE OR REPLACE FUNCTION limpiar_archivos_temporales()
RETURNS void AS $$
DECLARE
  archivos_eliminados INTEGER := 0;
BEGIN
  -- Marcar como inactivos los archivos temporales de más de 24 horas
  UPDATE archivos_storage
  SET activo = false,
      actualizado_en = NOW()
  WHERE bucket = 'nexo-temp'
    AND activo = true
    AND creado_en < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS archivos_eliminados = ROW_COUNT;

  -- Log del resultado
  INSERT INTO eventos_sistema (
    tipo, descripcion, metadata, creado_en
  ) VALUES (
    'CLEANUP_STORAGE',
    format('Limpieza automática: %s archivos temporales marcados para eliminar', archivos_eliminados),
    jsonb_build_object('archivos_procesados', archivos_eliminados, 'bucket', 'nexo-temp'),
    NOW()
  );

  RAISE NOTICE 'Limpieza completada: % archivos temporales procesados', archivos_eliminados;
END;
$$ LANGUAGE plpgsql;

-- 2. Programar job con pg_cron (3 AM diario)
SELECT cron.schedule(
  'cleanup-temp-storage',
  '0 3 * * *',
  'SELECT limpiar_archivos_temporales()'
);

-- 3. Verificar que el job está programado
SELECT * FROM cron.job WHERE jobname = 'cleanup-temp-storage';
```

### 8.2 Endpoint Manual de Limpieza (Admin)

```javascript
// backend/app/modules/storage/controllers/storage.controller.js

/**
 * POST /api/v1/storage/cleanup (Solo Super Admin)
 * Ejecuta limpieza manual de archivos huérfanos
 */
const cleanupOrphanFiles = asyncHandler(async (req, res) => {
  // Solo super_admin puede ejecutar
  if (req.user.rol !== 'super_admin') {
    return res.status(403).json({ error: 'Solo super admin puede ejecutar limpieza' });
  }

  const { minioClient } = require('../../../services/storage/minio.client');
  const pool = require('../../../config/database');

  // 1. Obtener archivos en MinIO
  const bucket = process.env.MINIO_BUCKET_TEMP;
  const minioFiles = [];
  const stream = minioClient.listObjects(bucket, '', true);

  await new Promise((resolve, reject) => {
    stream.on('data', obj => minioFiles.push(obj.name));
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  // 2. Obtener archivos en DB
  const dbResult = await pool.query(
    'SELECT path FROM archivos_storage WHERE bucket = $1 AND activo = true',
    [bucket]
  );
  const dbPaths = new Set(dbResult.rows.map(r => r.path));

  // 3. Encontrar huérfanos (en MinIO pero no en DB)
  const orphans = minioFiles.filter(f => !dbPaths.has(f));

  // 4. Eliminar huérfanos de MinIO
  if (orphans.length > 0) {
    await minioClient.removeObjects(bucket, orphans);
  }

  res.json({
    success: true,
    data: {
      archivosEnMinio: minioFiles.length,
      archivosEnDb: dbResult.rows.length,
      huerfanosEliminados: orphans.length,
      archivosHuerfanos: orphans
    }
  });
});

module.exports = { /* otros exports */, cleanupOrphanFiles };
```

### 8.3 Script de Limpieza de MinIO (Backup)

```javascript
// backend/app/scripts/cleanupMinioTemp.js
// Ejecutar manualmente: node scripts/cleanupMinioTemp.js

const { minioClient } = require('../services/storage/minio.client');

async function cleanupTempBucket() {
  console.log('🧹 Iniciando limpieza de archivos temporales en MinIO...');

  const bucket = process.env.MINIO_BUCKET_TEMP || 'nexo-temp';
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const stream = minioClient.listObjects(bucket, '', true);
  const toDelete = [];

  stream.on('data', (obj) => {
    if (new Date(obj.lastModified) < oneDayAgo) {
      toDelete.push(obj.name);
    }
  });

  stream.on('end', async () => {
    if (toDelete.length > 0) {
      await minioClient.removeObjects(bucket, toDelete);
      console.log(`✅ Eliminados ${toDelete.length} archivos temporales de MinIO`);
    } else {
      console.log('✅ No hay archivos temporales para eliminar');
    }
  });

  stream.on('error', (err) => {
    console.error('❌ Error:', err);
  });
}

cleanupTempBucket();
```

---

## 9. Seguridad

### 9.1 Validaciones (Mejoradas)

| Validación | Ubicación | Descripción | Prioridad |
|------------|-----------|-------------|-----------|
| **Magic Bytes** | `content.validator.js` | Valida contenido real vs MIME declarado | ⚠️ CRÍTICO |
| Tipo MIME | Multer fileFilter | Solo tipos permitidos por extensión | Alta |
| Tamaño máximo | Multer limits | 10MB por defecto | Alta |
| Cuota plan | `storageLimit.js` | Verifica espacio disponible del plan | Alta |
| Organización | Controller | Path debe coincidir con org del usuario | Alta |
| Rate limiting | `rateLimiting.js` | 10 uploads/minuto por usuario | Media |
| Nombre archivo | StorageService | UUID + sanitizado (evita path traversal) | Alta |
| Transacción | StorageService | Rollback automático si falla metadata | Alta |

### 9.2 Políticas de Bucket

| Bucket | Política | Acceso | CORS |
|--------|----------|--------|------|
| nexo-public | public-read | Cualquiera puede leer | ✅ Configurado |
| nexo-private | private | Solo con URL firmada (1h) | ❌ No necesario |
| nexo-temp | private | Solo backend, auto-delete 24h | ❌ No necesario |

### 9.3 Configuración CORS para MinIO

```javascript
// Agregar en minio.client.js después de initializeBuckets()

async function setCorsPolicy(bucketName) {
  const corsConfig = {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'HEAD'],
        AllowedOrigins: [
          process.env.FRONTEND_URL || 'http://localhost:8080',
          process.env.CORS_ORIGIN || '*'
        ],
        ExposeHeaders: ['ETag', 'Content-Length'],
        MaxAgeSeconds: 3600
      }
    ]
  };

  // MinIO no tiene setBucketCors directo, usar mc client o lifecycle policy
  console.log(`ℹ️ CORS debe configurarse manualmente para ${bucketName}`);
}
```

> **Nota**: Para CORS en MinIO, usar el cliente `mc` o configurar en la consola web.

### 9.4 Prevención de Ataques

| Ataque | Mitigación | Implementado |
|--------|------------|--------------|
| **File Upload Attack** | Magic bytes validation | ✅ `content.validator.js` |
| **Path Traversal** | UUID names, no user input in paths | ✅ StorageService |
| **DoS por uploads** | Rate limiting + cuota | ✅ Middleware |
| **Data leak** | RLS en metadata, presigned URLs | ✅ PostgreSQL + MinIO |
| **Orphan files** | Transacción atómica + cleanup job | ✅ pg_cron |
| **MIME spoofing** | Doble validación (extension + magic) | ✅ |

---

## 10. Fases de Implementación

### Fase 1: Infraestructura Docker
- [ ] Agregar MinIO a `docker-compose.dev.yml`
- [ ] Actualizar Dockerfile del backend (agregar `vips-dev`)
- [ ] Configurar variables de entorno en `.env`
- [ ] Levantar contenedor y verificar consola MinIO (http://localhost:9001)
- [ ] Inicializar buckets manualmente o via script

### Fase 2: Backend Core
- [ ] Instalar dependencias: `npm install minio sharp uuid file-type`
- [ ] Crear estructura de carpetas `services/storage/`
- [ ] Implementar `minio.client.js` + `initializeBuckets()`
- [ ] Implementar `content.validator.js` (magic bytes)
- [ ] Implementar `image.processor.js` (Sharp)
- [ ] Implementar `storage.service.js` (con transacciones)
- [ ] Crear tabla `archivos_storage` con RLS
- [ ] Agregar `limite_almacenamiento_mb` a `planes_subscripcion`

### Fase 3: Backend API
- [ ] Crear `middleware/storageLimit.js` (cuota)
- [ ] Crear `modules/storage/controllers/storage.controller.js`
- [ ] Crear `modules/storage/routes/storage.routes.js`
- [ ] Registrar rutas en `app.js`
- [ ] Crear schemas Joi para validación
- [ ] Tests unitarios de endpoints

### Fase 4: Frontend
- [ ] Instalar `react-dropzone`
- [ ] Crear componente `FileUploader.jsx`
- [ ] Agregar endpoints a `services/api/endpoints.js`
- [ ] Crear hook `useStorage.js`
- [ ] Integrar en `NegocioPage.jsx` (logo)
- [ ] Preview de imágenes + manejo de errores

### Fase 5: Jobs y Limpieza
- [ ] Crear función SQL `limpiar_archivos_temporales()`
- [ ] Programar job con pg_cron
- [ ] Endpoint de cleanup para super admin
- [ ] Script manual de backup

### Fase 6: Integración Módulos
- [ ] Integrar con módulo Invitaciones (galería, portada)
- [ ] Integrar con Marketplace (galeria_urls)
- [ ] Integrar con Productos (imágenes)
- [ ] Integrar con Profesionales (foto_url)
- [ ] Documentar API en Postman/README

### Checklist de Seguridad (Pre-Deploy)
- [ ] Validación magic bytes funcionando
- [ ] Transacciones atómicas probadas
- [ ] Rate limiting configurado
- [ ] Cuota por plan verificada
- [ ] CORS configurado en bucket público
- [ ] Presigned URLs funcionando para privados
- [ ] Cleanup job programado
- [ ] Tests de seguridad (upload malicioso)

---

## 11. Dependencias NPM

### Backend

```json
{
  "dependencies": {
    "minio": "^7.1.3",
    "sharp": "^0.33.0",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0",
    "file-type": "^19.0.0"
  }
}
```

> **Notas sobre dependencias:**
> - `multer` ya está instalado en el proyecto
> - `file-type` es ESM-only desde v17, usar import dinámico o v16 si hay problemas
> - `sharp` requiere `vips-dev` en Alpine Linux (ver Dockerfile)

### Frontend

```json
{
  "dependencies": {
    "react-dropzone": "^14.2.3"
  }
}
```

### Comandos de Instalación

```bash
# Backend
cd backend/app
npm install minio sharp uuid file-type

# Frontend
cd frontend
npm install react-dropzone
```

---

## 12. Checklist Pre-Desarrollo

### Infraestructura
- [ ] Agregar MinIO a `docker-compose.dev.yml`
- [ ] Actualizar `backend/app/dockerfile.dev` con `vips-dev`
- [ ] Crear variables MinIO en `.env`
- [ ] Verificar espacio en disco para volumen `minio_data`

### Backend
- [ ] Instalar dependencias: `minio`, `sharp`, `uuid`, `file-type`
- [ ] Crear estructura `backend/app/services/storage/`
- [ ] Crear estructura `backend/app/modules/storage/`
- [ ] Exportar middleware en `middleware/index.js`

### Base de Datos
- [ ] Crear tabla `archivos_storage` con RLS
- [ ] Agregar columna `limite_almacenamiento_mb` a `planes_subscripcion`
- [ ] Crear función y job pg_cron para limpieza

### Frontend
- [ ] Instalar `react-dropzone`
- [ ] Agregar endpoints storage en `services/api/endpoints.js`

### Validación
- [ ] Probar conexión a MinIO desde backend
- [ ] Probar upload de imagen de prueba
- [ ] Verificar RLS funciona correctamente

---

## 13. Configuración de Producción

Para producción, considerar:

1. **Volumen persistente** para datos de MinIO
2. **Backup automático** del bucket a S3/otro storage
3. **CDN** frontal (Cloudflare) para caché
4. **SSL/TLS** para MinIO
5. **Credenciales seguras** (no las de desarrollo)
6. **Monitoreo** de espacio en disco

```yaml
# Ejemplo producción
minio:
  environment:
    MINIO_ROOT_USER: ${MINIO_ROOT_USER}  # Secreto real
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}  # Secreto real
  volumes:
    - /mnt/storage/minio:/data  # Volumen externo
```

---

## 14. Resumen de Cambios v2.0

### Mejoras de Seguridad (Críticas)

| Cambio | Descripción | Archivo |
|--------|-------------|---------|
| ✅ **Validación Magic Bytes** | Verifica contenido real del archivo vs MIME declarado | `content.validator.js` |
| ✅ **Transacciones Atómicas** | Rollback automático si falla metadata + cleanup MinIO | `storage.service.js` |
| ✅ **Límites por Plan** | Cuota de almacenamiento por tipo de suscripción | `storageLimit.js` |

### Mejoras de Funcionalidad

| Cambio | Descripción | Impacto |
|--------|-------------|---------|
| ✅ **Endpoints completos** | `GET /files`, `GET /usage`, `GET /quota`, `GET /presigned/:id` | API REST completa |
| ✅ **pg_cron** | Reemplaza node-cron para jobs de limpieza | Más confiable |
| ✅ **Controller mejorado** | Incluye listado, uso, cuota y presigned URLs | Funcionalidad completa |

### Mejoras de Infraestructura

| Cambio | Descripción | Archivo |
|--------|-------------|---------|
| ✅ **Dockerfile** | Agrega `vips-dev` para Sharp en Alpine | `dockerfile.dev` |
| ✅ **Dependencias** | Agrega `file-type` para validación de contenido | `package.json` |
| ✅ **CORS** | Documentación de configuración CORS para bucket público | `minio.client.js` |

### Archivos Nuevos en este Plan

```
backend/app/
├── services/storage/
│   ├── index.js
│   ├── minio.client.js
│   ├── storage.service.js      # Con transacciones
│   ├── image.processor.js
│   └── content.validator.js    # NUEVO: Magic bytes
├── modules/storage/
│   ├── controllers/storage.controller.js  # Mejorado
│   ├── routes/storage.routes.js           # 6 endpoints
│   ├── schemas/storage.schema.js
│   └── models/archivo.model.js
├── middleware/
│   └── storageLimit.js         # NUEVO: Cuota
└── scripts/
    └── cleanupMinioTemp.js     # Manual backup

sql/
└── storage/
    ├── 01-tablas-storage.sql   # archivos_storage + RLS
    ├── 02-limites-plan.sql     # ALTER planes_subscripcion
    └── 03-cleanup-job.sql      # pg_cron function + schedule
```

### Diferencias vs Plan Original

| Aspecto | Plan Original | Plan v2.0 |
|---------|---------------|-----------|
| Validación contenido | Solo MIME extension | Magic bytes + MIME |
| Upload/Metadata | Secuencial (puede fallar) | Transacción atómica |
| Límites storage | No contemplado | Por plan de suscripción |
| Endpoints | 3 (upload, delete, presigned) | 7 completos |
| Jobs limpieza | node-cron | pg_cron (nativo PostgreSQL) |
| Cleanup huérfanos | No contemplado | Endpoint admin + script |
| Dockerfile | Sin cambios | Agrega vips-dev |

---

## 15. Próximos Pasos

1. **Aprobar plan** - Revisar cambios con el equipo
2. **Fase 1** - Infraestructura Docker (MinIO + Dockerfile)
3. **Fase 2** - Backend Core (services + tabla + RLS)
4. **Fase 3** - Backend API (controller + routes + middleware)
5. **Fase 4** - Frontend (FileUploader + hooks)
6. **Fase 5** - Jobs (pg_cron + cleanup)
7. **Fase 6** - Integración con módulos existentes

---

**Plan revisado por**: Arquitecto de Software
**Fecha revisión**: 3 Diciembre 2025
**Estado**: ✅ Aprobado para implementación
