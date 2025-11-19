# 🎨 PLAN FRONTEND - MARKETPLACE DE CLIENTES

**Fecha Actualización:** 19 Noviembre 2025
**Estado:** ⏳ Multimedia Pendiente
**Progreso:** 98% Completado

---

## 📊 CONTEXTO RÁPIDO

### ✅ Completado (98%)

**Módulos funcionales:**
1. ✅ Panel Admin - Gestión Interna
2. ✅ Directorio Público SEO-optimizado
3. ✅ Perfil Público con meta tags y Schema.org
4. ✅ Agendamiento Público - Slots en tiempo real
5. ✅ Panel Super Admin - Gestión global

**Tecnologías:**
- Backend: 20 endpoints, middleware público, RLS multi-tenant
- Frontend: 5 páginas, 23 componentes, 2 hooks personalizados
- Database: 4 tablas, 24 índices especializados, 8 políticas RLS

---

## 🎯 PLAN MULTIMEDIA - UPLOAD DE IMÁGENES

**Prioridad:** Media - Mejora experiencia visual del marketplace
**Tiempo estimado:** 6-8 horas
**Tecnología:** MinIO (S3-compatible, self-hosted)

---

## 📦 ARQUITECTURA PROPUESTA

### Stack Técnico

**Almacenamiento:**
- **MinIO** - Object storage S3-compatible
- Dockerizado en `docker-compose.yml`
- Multi-tenant con buckets por organización
- Acceso público para imágenes de perfiles

**Backend:**
- **multer** - Middleware upload de archivos
- **multer-minio-storage-engine** - Integración MinIO
- **sharp** - Procesamiento de imágenes (resize, compress)
- Validación: tipo (jpg/png/webp), tamaño (2MB max)

**Frontend:**
- **react-dropzone** - Drag & drop upload
- **react-image-crop** - Crop opcional antes de upload
- Preview antes de confirmar
- Progress bar durante upload

---

## 🗂️ ESTRUCTURA DE ALMACENAMIENTO

### Buckets MinIO

```
marketplace/                              # Bucket principal
├── org-{organizacion_id}/                # Carpeta por organización
│   ├── logo.{ext}                        # Logo (500x500px, max 1MB)
│   ├── portada.{ext}                     # Portada (1920x600px, max 2MB)
│   └── galeria/                          # Hasta 6 imágenes
│       ├── 1.{ext}                       # 800x600px, max 1.5MB cada una
│       ├── 2.{ext}
│       └── ...
```

### URLs Públicas

```
http://minio:9000/marketplace/org-1/logo.jpg
http://minio:9000/marketplace/org-1/portada.webp
http://minio:9000/marketplace/org-1/galeria/1.jpg
```

---

## 🔧 CONFIGURACIÓN DOCKER

### docker-compose.yml

```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: minio
    ports:
      - "9000:9000"      # API
      - "9001:9001"      # Console
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin123}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    networks:
      - saas-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Crear bucket automáticamente al iniciar
  minio-init:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      mc alias set myminio http://minio:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin123};
      mc mb myminio/marketplace --ignore-existing;
      mc anonymous set download myminio/marketplace;
      "
    networks:
      - saas-network

volumes:
  minio_data:
    driver: local

networks:
  saas-network:
    external: true
```

### Variables de Entorno (.env)

```bash
# MinIO Configuration
MINIO_ROOT_USER=saas_admin
MINIO_ROOT_PASSWORD=SecurePassword123!
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_BUCKET=marketplace
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9000  # Cambiar en producción
```

---

## 🚀 IMPLEMENTACIÓN BACKEND

### 1. Dependencias NPM

```bash
cd backend
npm install minio multer multer-minio-storage-engine sharp
```

### 2. Servicio MinIO (`backend/app/services/minioService.js`)

```javascript
const Minio = require('minio');
const logger = require('../utils/logger');

class MinioService {
  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'minio',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ROOT_USER,
      secretKey: process.env.MINIO_ROOT_PASSWORD,
    });

    this.bucket = process.env.MINIO_BUCKET || 'marketplace';
    this.publicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
  }

  /**
   * Subir archivo a MinIO
   * @param {string} filePath - Ruta dentro del bucket (ej: org-1/logo.jpg)
   * @param {Buffer} buffer - Buffer del archivo
   * @param {Object} metadata - Metadatos (content-type, etc)
   */
  async uploadFile(filePath, buffer, metadata = {}) {
    try {
      await this.client.putObject(
        this.bucket,
        filePath,
        buffer,
        buffer.length,
        metadata
      );

      return `${this.publicUrl}/${this.bucket}/${filePath}`;
    } catch (error) {
      logger.error('[MinioService] Error al subir archivo', { error: error.message });
      throw new Error('Error al subir la imagen');
    }
  }

  /**
   * Eliminar archivo de MinIO
   * @param {string} filePath - Ruta del archivo
   */
  async deleteFile(filePath) {
    try {
      await this.client.removeObject(this.bucket, filePath);
      return true;
    } catch (error) {
      logger.error('[MinioService] Error al eliminar archivo', { error: error.message });
      return false;
    }
  }

  /**
   * Listar archivos de una organización
   * @param {number} organizacionId
   */
  async listFiles(organizacionId) {
    const prefix = `org-${organizacionId}/`;
    const files = [];

    const stream = this.client.listObjects(this.bucket, prefix, true);

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        files.push({
          name: obj.name,
          url: `${this.publicUrl}/${this.bucket}/${obj.name}`,
          size: obj.size,
          lastModified: obj.lastModified,
        });
      });
      stream.on('error', reject);
      stream.on('end', () => resolve(files));
    });
  }

  /**
   * Obtener URL pública de un archivo
   * @param {string} filePath
   */
  getPublicUrl(filePath) {
    return `${this.publicUrl}/${this.bucket}/${filePath}`;
  }
}

module.exports = new MinioService();
```

### 3. Middleware Upload (`backend/app/middleware/upload.js`)

```javascript
const multer = require('multer');
const sharp = require('sharp');
const minioService = require('../services/minioService');
const { ResponseHelper } = require('../utils/helpers');

// Configuración multer (memoria temporal)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG, WebP'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter,
});

/**
 * Procesar imagen y subir a MinIO
 * @param {Object} options - { width, height, quality, organizacionId, fileName }
 */
const processAndUpload = async (file, options) => {
  const { width, height, quality = 85, organizacionId, fileName } = options;

  // Procesar imagen con sharp
  let processedBuffer = await sharp(file.buffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality }) // Convertir a WebP para menor tamaño
    .toBuffer();

  const filePath = `org-${organizacionId}/${fileName}.webp`;

  // Subir a MinIO
  const url = await minioService.uploadFile(filePath, processedBuffer, {
    'Content-Type': 'image/webp',
  });

  return { url, filePath };
};

module.exports = {
  upload,
  processAndUpload,
};
```

### 4. Controller (`backend/app/controllers/marketplace/imagenes.controller.js`)

```javascript
const { asyncHandler } = require('../../middleware');
const { ResponseHelper } = require('../../utils/helpers');
const { processAndUpload } = require('../../middleware/upload');
const minioService = require('../../services/minioService');
const PerfilesMarketplaceModel = require('../../database/marketplace/perfiles.model');
const logger = require('../../utils/logger');

class ImagenesMarketplaceController {
  /**
   * Subir logo del perfil
   * POST /api/v1/marketplace/perfiles/:id/imagenes/logo
   */
  static uploadLogo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant.organizacionId;

    if (!req.file) {
      return ResponseHelper.error(res, 'No se proporcionó ninguna imagen', 400);
    }

    logger.info('[ImagenesMarketplace] Subiendo logo', { organizacionId, perfilId: id });

    // Procesar y subir
    const { url, filePath } = await processAndUpload(req.file, {
      width: 500,
      height: 500,
      quality: 90,
      organizacionId,
      fileName: 'logo',
    });

    // Actualizar BD
    await PerfilesMarketplaceModel.actualizarImagenes(organizacionId, id, {
      logo_url: url,
    });

    return ResponseHelper.success(res, { url, filePath }, 'Logo subido exitosamente');
  });

  /**
   * Subir portada del perfil
   * POST /api/v1/marketplace/perfiles/:id/imagenes/portada
   */
  static uploadPortada = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant.organizacionId;

    if (!req.file) {
      return ResponseHelper.error(res, 'No se proporcionó ninguna imagen', 400);
    }

    const { url, filePath } = await processAndUpload(req.file, {
      width: 1920,
      height: 600,
      quality: 85,
      organizacionId,
      fileName: 'portada',
    });

    await PerfilesMarketplaceModel.actualizarImagenes(organizacionId, id, {
      portada_url: url,
    });

    return ResponseHelper.success(res, { url, filePath }, 'Portada subida exitosamente');
  });

  /**
   * Subir imagen a galería
   * POST /api/v1/marketplace/perfiles/:id/imagenes/galeria
   */
  static uploadGaleria = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant.organizacionId;

    if (!req.file) {
      return ResponseHelper.error(res, 'No se proporcionó ninguna imagen', 400);
    }

    // Obtener galería actual
    const perfil = await PerfilesMarketplaceModel.obtenerPorId(organizacionId, id);
    const galeriaActual = perfil.galeria_urls || [];

    if (galeriaActual.length >= 6) {
      return ResponseHelper.error(res, 'Máximo 6 imágenes en galería', 400);
    }

    const index = galeriaActual.length + 1;

    const { url, filePath } = await processAndUpload(req.file, {
      width: 800,
      height: 600,
      quality: 85,
      organizacionId,
      fileName: `galeria/${index}`,
    });

    // Agregar a galería
    const nuevaGaleria = [...galeriaActual, url];
    await PerfilesMarketplaceModel.actualizarImagenes(organizacionId, id, {
      galeria_urls: nuevaGaleria,
    });

    return ResponseHelper.success(
      res,
      { url, filePath, galeria: nuevaGaleria },
      'Imagen agregada a galería'
    );
  });

  /**
   * Eliminar imagen de galería
   * DELETE /api/v1/marketplace/perfiles/:id/imagenes/galeria/:index
   */
  static deleteGaleria = asyncHandler(async (req, res) => {
    const { id, index } = req.params;
    const organizacionId = req.tenant.organizacionId;

    const perfil = await PerfilesMarketplaceModel.obtenerPorId(organizacionId, id);
    const galeriaActual = perfil.galeria_urls || [];

    const idx = parseInt(index);
    if (idx < 0 || idx >= galeriaActual.length) {
      return ResponseHelper.error(res, 'Índice inválido', 400);
    }

    const urlAEliminar = galeriaActual[idx];
    const filePath = urlAEliminar.split('/marketplace/')[1]; // Extraer path

    // Eliminar de MinIO
    await minioService.deleteFile(filePath);

    // Actualizar BD
    const nuevaGaleria = galeriaActual.filter((_, i) => i !== idx);
    await PerfilesMarketplaceModel.actualizarImagenes(organizacionId, id, {
      galeria_urls: nuevaGaleria,
    });

    return ResponseHelper.success(
      res,
      { galeria: nuevaGaleria },
      'Imagen eliminada de galería'
    );
  });

  /**
   * Listar todas las imágenes de la organización
   * GET /api/v1/marketplace/perfiles/:id/imagenes
   */
  static listar = asyncHandler(async (req, res) => {
    const organizacionId = req.tenant.organizacionId;

    const files = await minioService.listFiles(organizacionId);

    return ResponseHelper.success(res, { files }, 'Imágenes listadas exitosamente');
  });
}

module.exports = ImagenesMarketplaceController;
```

### 5. Model - Actualizar Imágenes (`backend/app/database/marketplace/perfiles.model.js`)

```javascript
// Agregar método al modelo existente

/**
 * Actualizar URLs de imágenes del perfil
 * @param {number} organizacionId
 * @param {number} perfilId
 * @param {Object} imagenes - { logo_url?, portada_url?, galeria_urls? }
 */
static async actualizarImagenes(organizacionId, perfilId, imagenes) {
  return await RLSContextManager.query(organizacionId, async (db) => {
    // Construir SET dinámico
    const updates = [];
    const values = [];
    let valueIndex = 1;

    if (imagenes.logo_url !== undefined) {
      updates.push(`logo_url = $${valueIndex++}`);
      values.push(imagenes.logo_url);
    }

    if (imagenes.portada_url !== undefined) {
      updates.push(`portada_url = $${valueIndex++}`);
      values.push(imagenes.portada_url);
    }

    if (imagenes.galeria_urls !== undefined) {
      updates.push(`galeria_urls = $${valueIndex++}`);
      values.push(JSON.stringify(imagenes.galeria_urls));
    }

    updates.push(`actualizado_en = NOW()`);
    values.push(perfilId);

    const query = `
      UPDATE marketplace_perfiles
      SET ${updates.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  });
}
```

### 6. Rutas (`backend/app/routes/api/v1/marketplace.js`)

```javascript
// Agregar al archivo existente
const { upload } = require('../../../middleware/upload');
const ImagenesMarketplaceController = require('../../../controllers/marketplace/imagenes.controller');

// ====================================================================
// GESTIÓN DE IMÁGENES
// ====================================================================

/**
 * POST /api/v1/marketplace/perfiles/:id/imagenes/logo
 * Subir logo del perfil (500x500px, max 1MB)
 */
router.post(
  '/perfiles/:id/imagenes/logo',
  rateLimiting.apiRateLimit,
  upload.single('logo'),
  ImagenesMarketplaceController.uploadLogo
);

/**
 * POST /api/v1/marketplace/perfiles/:id/imagenes/portada
 * Subir portada del perfil (1920x600px, max 2MB)
 */
router.post(
  '/perfiles/:id/imagenes/portada',
  rateLimiting.apiRateLimit,
  upload.single('portada'),
  ImagenesMarketplaceController.uploadPortada
);

/**
 * POST /api/v1/marketplace/perfiles/:id/imagenes/galeria
 * Subir imagen a galería (800x600px, max 1.5MB, hasta 6 imágenes)
 */
router.post(
  '/perfiles/:id/imagenes/galeria',
  rateLimiting.apiRateLimit,
  upload.single('imagen'),
  ImagenesMarketplaceController.uploadGaleria
);

/**
 * DELETE /api/v1/marketplace/perfiles/:id/imagenes/galeria/:index
 * Eliminar imagen de galería por índice
 */
router.delete(
  '/perfiles/:id/imagenes/galeria/:index',
  rateLimiting.apiRateLimit,
  ImagenesMarketplaceController.deleteGaleria
);

/**
 * GET /api/v1/marketplace/perfiles/:id/imagenes
 * Listar todas las imágenes de la organización
 */
router.get(
  '/perfiles/:id/imagenes',
  rateLimiting.apiRateLimit,
  ImagenesMarketplaceController.listar
);
```

### 7. Migración SQL - Agregar Columnas

```sql
-- sql/marketplace/01-tablas.sql

-- Agregar columnas para URLs de imágenes
ALTER TABLE marketplace_perfiles
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS portada_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS galeria_urls JSONB DEFAULT '[]'::jsonb;

-- Índice para búsquedas por imágenes
CREATE INDEX IF NOT EXISTS idx_marketplace_perfiles_imagenes
ON marketplace_perfiles(logo_url, portada_url)
WHERE logo_url IS NOT NULL OR portada_url IS NOT NULL;
```

---

## 🎨 IMPLEMENTACIÓN FRONTEND

### 1. Dependencias NPM

```bash
cd frontend
npm install react-dropzone react-image-crop
```

### 2. Hook Personalizado (`frontend/src/hooks/useMarketplace.js`)

```javascript
// Agregar al archivo existente

/**
 * Hook para subir logo
 */
export function useUploadLogo(perfilId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await marketplaceApi.uploadLogo(perfilId, formData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-perfil-marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['perfil-publico'] });
    },
  });
}

/**
 * Hook para subir portada
 */
export function useUploadPortada(perfilId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('portada', file);

      const response = await marketplaceApi.uploadPortada(perfilId, formData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-perfil-marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['perfil-publico'] });
    },
  });
}

/**
 * Hook para subir imagen a galería
 */
export function useUploadGaleria(perfilId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('imagen', file);

      const response = await marketplaceApi.uploadGaleria(perfilId, formData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-perfil-marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['perfil-publico'] });
    },
  });
}

/**
 * Hook para eliminar imagen de galería
 */
export function useDeleteGaleria(perfilId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (index) => {
      const response = await marketplaceApi.deleteGaleria(perfilId, index);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-perfil-marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['perfil-publico'] });
    },
  });
}
```

### 3. Endpoints API (`frontend/src/services/api/endpoints.js`)

```javascript
// Agregar al marketplaceApi existente

// === IMÁGENES ===
uploadLogo: (perfilId, formData) =>
  apiClient.post(`/marketplace/perfiles/${perfilId}/imagenes/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

uploadPortada: (perfilId, formData) =>
  apiClient.post(`/marketplace/perfiles/${perfilId}/imagenes/portada`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

uploadGaleria: (perfilId, formData) =>
  apiClient.post(`/marketplace/perfiles/${perfilId}/imagenes/galeria`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

deleteGaleria: (perfilId, index) =>
  apiClient.delete(`/marketplace/perfiles/${perfilId}/imagenes/galeria/${index}`),

listarImagenes: (perfilId) =>
  apiClient.get(`/marketplace/perfiles/${perfilId}/imagenes`),
```

### 4. Componente ImageUploader (`frontend/src/components/marketplace/ImageUploader.jsx`)

```javascript
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Componente genérico para upload de imágenes con preview
 * @param {Object} props
 * @param {string} props.label - Etiqueta del uploader
 * @param {string} props.currentUrl - URL de imagen actual (opcional)
 * @param {Function} props.onUpload - Callback al confirmar upload
 * @param {Object} props.dimensions - { width, height } dimensiones recomendadas
 * @param {number} props.maxSize - Tamaño máximo en MB
 * @param {boolean} props.isLoading - Estado de carga
 */
export default function ImageUploader({
  label,
  currentUrl,
  onUpload,
  dimensions = { width: 800, height: 600 },
  maxSize = 2,
  isLoading = false,
}) {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: maxSize * 1024 * 1024,
    maxFiles: 1,
  });

  const handleClearPreview = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    await onUpload(selectedFile);
    handleClearPreview();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Dimensiones recomendadas: {dimensions.width}x{dimensions.height}px • Máximo {maxSize}MB • JPG, PNG, WebP
        </p>
      </div>

      {/* Vista previa o imagen actual */}
      {(preview || currentUrl) && (
        <div className="relative">
          <img
            src={preview || currentUrl}
            alt="Vista previa"
            className="w-full h-48 object-cover rounded-lg border border-gray-300"
          />
          {preview && (
            <button
              onClick={handleClearPreview}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Zona de drop */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-primary-600 font-medium">Suelta la imagen aquí...</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium mb-1">
              Arrastra una imagen o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500">
              JPG, PNG o WebP (máx. {maxSize}MB)
            </p>
          </>
        )}
      </div>

      {/* Botones de acción */}
      {preview && (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleConfirmUpload}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Subiendo...' : 'Confirmar y Subir'}
          </Button>
          <Button
            onClick={handleClearPreview}
            variant="secondary"
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
```

### 5. Componente GaleriaFotos (`frontend/src/components/marketplace/GaleriaFotos.jsx`)

```javascript
import { useState } from 'react';
import { Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import ImageUploader from './ImageUploader';
import Button from '@/components/ui/Button';
import { useUploadGaleria, useDeleteGaleria } from '@/hooks/useMarketplace';
import { useToast } from '@/hooks/useToast';

/**
 * Componente para gestionar galería de hasta 6 imágenes
 */
export default function GaleriaFotos({ perfilId, galeria = [] }) {
  const { success, error: showError } = useToast();
  const uploadGaleria = useUploadGaleria(perfilId);
  const deleteGaleria = useDeleteGaleria(perfilId);

  const handleUpload = async (file) => {
    if (galeria.length >= 6) {
      showError('Máximo 6 imágenes en galería');
      return;
    }

    try {
      await uploadGaleria.mutateAsync(file);
      success('Imagen agregada a galería');
    } catch (err) {
      showError(err.message || 'Error al subir imagen');
    }
  };

  const handleDelete = async (index) => {
    if (!confirm('¿Eliminar esta imagen de la galería?')) return;

    try {
      await deleteGaleria.mutateAsync(index);
      success('Imagen eliminada de galería');
    } catch (err) {
      showError(err.message || 'Error al eliminar imagen');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Galería de Fotos
        </h3>
        <p className="text-sm text-gray-600">
          Hasta 6 imágenes (800x600px cada una)
        </p>
      </div>

      {/* Grid de imágenes existentes */}
      {galeria.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galeria.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Galería ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg border border-gray-300"
              />
              <button
                onClick={() => handleDelete(index)}
                disabled={deleteGaleria.isLoading}
                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Uploader */}
      {galeria.length < 6 && (
        <ImageUploader
          label={`Imagen ${galeria.length + 1} de 6`}
          onUpload={handleUpload}
          dimensions={{ width: 800, height: 600 }}
          maxSize={1.5}
          isLoading={uploadGaleria.isLoading}
        />
      )}

      {galeria.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No hay imágenes en la galería</p>
          <p className="text-sm text-gray-500 mt-1">
            Sube hasta 6 fotos de tu negocio
          </p>
        </div>
      )}
    </div>
  );
}
```

### 6. Integración en MiMarketplacePage

```javascript
// Agregar tab "Imágenes" en MiMarketplacePage.jsx

import { useUploadLogo, useUploadPortada } from '@/hooks/useMarketplace';
import ImageUploader from '@/components/marketplace/ImageUploader';
import GaleriaFotos from '@/components/marketplace/GaleriaFotos';

// En el componente
const [tabActual, setTabActual] = useState('perfil'); // 'perfil' | 'reseñas' | 'analytics' | 'imagenes'

const uploadLogo = useUploadLogo(perfil?.id);
const uploadPortada = useUploadPortada(perfil?.id);

// En el render
const tabs = [
  { id: 'perfil', nombre: 'Perfil' },
  { id: 'imagenes', nombre: 'Imágenes' },
  { id: 'reseñas', nombre: 'Reseñas' },
  { id: 'analytics', nombre: 'Analytics' },
];

// Tab content
{tabActual === 'imagenes' && (
  <div className="space-y-8">
    {/* Logo */}
    <ImageUploader
      label="Logo del Negocio"
      currentUrl={perfil?.logo_url}
      onUpload={(file) => uploadLogo.mutateAsync(file)}
      dimensions={{ width: 500, height: 500 }}
      maxSize={1}
      isLoading={uploadLogo.isLoading}
    />

    <div className="border-t border-gray-200" />

    {/* Portada */}
    <ImageUploader
      label="Imagen de Portada"
      currentUrl={perfil?.portada_url}
      onUpload={(file) => uploadPortada.mutateAsync(file)}
      dimensions={{ width: 1920, height: 600 }}
      maxSize={2}
      isLoading={uploadPortada.isLoading}
    />

    <div className="border-t border-gray-200" />

    {/* Galería */}
    <GaleriaFotos
      perfilId={perfil?.id}
      galeria={perfil?.galeria_urls || []}
    />
  </div>
)}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend (4-5 horas)

- [ ] Configurar MinIO en docker-compose.yml
- [ ] Instalar dependencias: `minio`, `multer`, `sharp`
- [ ] Crear `MinioService` con métodos upload/delete/list
- [ ] Crear middleware `upload.js` con procesamiento Sharp
- [ ] Crear `ImagenesMarketplaceController` (5 endpoints)
- [ ] Agregar método `actualizarImagenes` al model
- [ ] Agregar rutas en `/api/v1/marketplace`
- [ ] Migración SQL: columnas `logo_url`, `portada_url`, `galeria_urls`
- [ ] Probar endpoints con Postman

### Frontend (2-3 horas)

- [ ] Instalar dependencias: `react-dropzone`, `react-image-crop`
- [ ] Crear componente `ImageUploader.jsx`
- [ ] Crear componente `GaleriaFotos.jsx`
- [ ] Agregar 4 hooks en `useMarketplace.js`
- [ ] Agregar 5 endpoints en `marketplaceApi`
- [ ] Agregar tab "Imágenes" en `MiMarketplacePage`
- [ ] Mostrar logo/portada en `PerfilPublicoPage`
- [ ] Mostrar galería en perfil público (grid o carousel)
- [ ] Probar flujo completo

### Testing (1 hora)

- [ ] Subir logo (500x500px) → Verificar compresión y URL
- [ ] Subir portada (1920x600px) → Verificar resize
- [ ] Subir 6 imágenes a galería → Verificar límite
- [ ] Eliminar imagen de galería → Verificar MinIO y BD
- [ ] Verificar permisos RLS (solo propietario puede subir)
- [ ] Validar tamaños y tipos de archivo
- [ ] Probar en perfil público que las imágenes se vean

---

## 🚀 COMANDOS RÁPIDOS

### Desarrollo

```bash
# Levantar MinIO
docker-compose up -d minio minio-init

# Acceder a MinIO Console
# http://localhost:9001
# User: saas_admin
# Pass: SecurePassword123!

# Ver logs MinIO
docker logs minio -f

# Listar archivos en bucket
docker exec minio mc ls myminio/marketplace

# Reiniciar con cambios
docker-compose restart minio
```

### Producción

```bash
# Variables de entorno producción (.env.prod)
MINIO_ROOT_USER=admin_prod
MINIO_ROOT_PASSWORD=SecureProductionPassword!
MINIO_PUBLIC_URL=https://minio.tudominio.com
MINIO_USE_SSL=true

# Backup bucket
docker exec minio mc mirror myminio/marketplace /backup/marketplace

# Restore bucket
docker exec minio mc mirror /backup/marketplace myminio/marketplace
```

---

## 🔐 SEGURIDAD

### Validaciones Backend

```javascript
// Tamaño máximo
const MAX_SIZES = {
  logo: 1 * 1024 * 1024,      // 1MB
  portada: 2 * 1024 * 1024,   // 2MB
  galeria: 1.5 * 1024 * 1024, // 1.5MB
};

// Tipos permitidos
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Dimensiones exactas (Sharp resize)
const DIMENSIONS = {
  logo: { width: 500, height: 500 },
  portada: { width: 1920, height: 600 },
  galeria: { width: 800, height: 600 },
};
```

### RLS y Permisos

- Solo `admin` y `propietario` pueden subir imágenes
- Multi-tenant: cada organización tiene su carpeta `org-{id}/`
- Políticas RLS validan que solo veas imágenes de tu organización
- Bucket público con acceso read-only

---

## 📊 NOTAS TÉCNICAS

### Por qué MinIO

✅ **Ventajas:**
- S3-compatible (fácil migrar a AWS S3 después)
- Self-hosted (control total, sin costos externos)
- Docker-friendly
- Panel web incluido (MinIO Console)
- Rápido y escalable

✅ **Multi-tenant seguro:**
- Buckets/carpetas por organización
- URLs públicas controladas
- Fácil backup y restore

### Optimizaciones Sharp

```javascript
// Conversión automática a WebP
.webp({ quality: 85 })  // Reduce tamaño 30-50% vs JPG

// Resize con crop inteligente
.resize(width, height, {
  fit: 'cover',           // Crop para ajustar dimensiones exactas
  position: 'center',     // Centro del crop
})

// Metadata strip (seguridad)
.withMetadata(false)      // Elimina EXIF, GPS, etc.
```

---

**Versión:** 5.0
**Última Actualización:** 19 Noviembre 2025
**Estado:** ⏳ Plan Multimedia Completo - Listo para implementar

