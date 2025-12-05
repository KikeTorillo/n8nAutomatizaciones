# Sistema de Almacenamiento con MinIO

**Estado**: ✅ Implementado (98%)
**Última actualización**: 4 Diciembre 2025

---

## Resumen

MinIO implementado como sistema de almacenamiento S3-compatible para imágenes de la plataforma Nexo.

---

## Estado de Implementación

### Módulos con Storage Integrado

| Módulo | Carpeta MinIO | Estado |
|--------|---------------|--------|
| Organizaciones | `org-{id}/logos/` | ✅ |
| Profesionales | `org-{id}/profesionales/` | ✅ |
| Productos | `org-{id}/productos/` | ✅ |
| Servicios | `org-{id}/servicios/` | ✅ |
| Clientes | `org-{id}/clientes/` | ✅ |
| Marketplace (logo) | `org-{id}/marketplace/logos/` | ✅ |
| Marketplace (portada) | `org-{id}/marketplace/portadas/` | ✅ |
| Marketplace (galería) | `org-{id}/marketplace/galeria/` | ✅ |
| Invitaciones | - | ❌ Módulo no existe |
| Exports (CSV/PDF) | - | ❌ Pendiente |
| Chatbots (multimedia) | - | ❌ Pendiente |

### Infraestructura

| Componente | Estado |
|------------|--------|
| MinIO en Docker | ✅ `docker-compose.dev.yml` |
| Dockerfile con vips-dev | ✅ `backend/app/dockerfile.dev` |
| Variables .env | ✅ Configuradas |
| Buckets (nexo-public, nexo-private, nexo-temp) | ✅ Auto-creados |

---

## Archivos Implementados

### Backend

```
backend/app/
├── services/storage/
│   ├── index.js
│   ├── minio.client.js          # Cliente MinIO + initializeBuckets
│   ├── storage.service.js       # Upload/delete con transacciones
│   ├── image.processor.js       # Sharp para redimensionar
│   └── content.validator.js     # Validación magic bytes
├── modules/storage/
│   ├── controllers/storage.controller.js
│   ├── routes/storage.routes.js
│   ├── schemas/storage.schemas.js
│   └── models/archivo.model.js
└── middleware/
    └── storage.js               # Multer config
```

### Frontend

```
frontend/src/
├── hooks/useStorage.js          # useUploadArchivo mutation
├── services/api/endpoints.js    # storageApi
└── components/storage/
    └── FileUploader.jsx         # Componente drag & drop
```

### SQL

```
sql/storage/
├── 01-tablas-storage.sql        # archivos_storage + RLS
└── 02-limites-storage.sql       # Límites por plan
```

---

## Endpoints API

```
POST   /api/v1/storage/upload           # Subir archivo
DELETE /api/v1/storage/:id              # Eliminar por ID
GET    /api/v1/storage/files            # Listar archivos
GET    /api/v1/storage/usage            # Uso de almacenamiento
GET    /api/v1/storage/presigned/:id    # URL firmada (privados)
```

---

## Pendientes

### 1. Jobs de Limpieza (Fase 5)

Crear job pg_cron para limpiar archivos temporales:

```sql
-- sql/storage/03-cleanup-job.sql

CREATE OR REPLACE FUNCTION limpiar_archivos_temporales()
RETURNS void AS $$
BEGIN
  UPDATE archivos_storage
  SET activo = false, actualizado_en = NOW()
  WHERE bucket = 'nexo-temp'
    AND activo = true
    AND creado_en < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Programar cada día a las 3 AM
SELECT cron.schedule('cleanup-temp-storage', '0 3 * * *',
  'SELECT limpiar_archivos_temporales()');
```

### 2. Módulos Futuros

| Módulo | Tipo de Archivo | Prioridad |
|--------|----------------|-----------|
| Invitaciones | Galería, portadas | Alta (cuando se cree el módulo) |
| Exports | CSV, PDF reportes | Media |
| Chatbots | Imágenes recibidas | Baja |

---

## Configuración

### Variables de Entorno

```bash
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_USE_SSL=false
MINIO_BUCKET_PUBLIC=nexo-public
MINIO_BUCKET_PRIVATE=nexo-private
MINIO_BUCKET_TEMP=nexo-temp
MINIO_PUBLIC_URL=http://localhost:9000
```

### Acceso

- **API MinIO**: http://localhost:9000
- **Consola Web**: http://localhost:9001 (minioadmin / minioadmin123)
- **Archivos públicos**: `http://localhost:9000/nexo-public/org-{id}/...`

---

## Uso en Frontend

```javascript
import { useUploadArchivo } from '@/hooks/useStorage';

const uploadMutation = useUploadArchivo();

// Subir archivo
const resultado = await uploadMutation.mutateAsync({
  file,                           // File object
  folder: 'productos',            // Subcarpeta (permite /)
  isPublic: true,                 // Bucket público o privado
  generateThumbnail: false        // Generar miniatura
});

const url = resultado.url;        // URL pública del archivo
```

---

## Seguridad Implementada

| Validación | Archivo |
|------------|---------|
| Magic bytes (contenido real) | `content.validator.js` |
| Tipo MIME | `storage.js` (multer) |
| Tamaño máximo (10MB) | `storage.js` (multer) |
| RLS en metadata | `01-tablas-storage.sql` |
| Transacciones atómicas | `storage.service.js` |
| Rate limiting uploads | `storage.routes.js` |

---

## Producción

### Estado Actual

| Archivo | Estado | Observaciones |
|---------|--------|---------------|
| `backend/app/Dockerfile.prod` | ✅ | vips-dev agregado |
| `docker-compose.prod.yml` | ✅ | Servicio minio + variables backend |
| `docker-compose.prod.local.yml` | ✅ | Servicio minio + variables backend |
| `.env.prod` | ✅ | Variables MinIO configuradas |
| `.env.prod.local` | ✅ | Variables MinIO configuradas |

### 1. Modificar Dockerfile.prod

Agregar `vips-dev` en el stage runtime (línea 31):

```dockerfile
# Instalar dumb-init Y vips para Sharp
RUN apk add --no-cache dumb-init vips-dev
```

### 2. Agregar MinIO a docker-compose.prod.yml

Insertar después del servicio `redis`:

```yaml
  # ========================================
  # MINIO - Object Storage
  # ========================================

  minio:
    image: minio/minio:latest
    container_name: minio
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - ./data/minio:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - backend_network
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### 3. Agregar variables MinIO al backend

En la sección `environment` del servicio `backend`:

```yaml
      # MinIO Storage
      MINIO_ENDPOINT: ${MINIO_ENDPOINT}
      MINIO_PORT: ${MINIO_PORT}
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_USE_SSL: ${MINIO_USE_SSL}
      MINIO_BUCKET_PUBLIC: ${MINIO_BUCKET_PUBLIC}
      MINIO_BUCKET_PRIVATE: ${MINIO_BUCKET_PRIVATE}
      MINIO_BUCKET_TEMP: ${MINIO_BUCKET_TEMP}
      MINIO_PUBLIC_URL: ${MINIO_PUBLIC_URL}
```

### 4. Variables de Entorno (.env.prod)

```bash
# MinIO - Producción
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ROOT_USER=nexo_minio_prod          # Cambiar
MINIO_ROOT_PASSWORD=SecureP@ssw0rd!2025  # Cambiar
MINIO_USE_SSL=false                       # true si hay reverse proxy con SSL
MINIO_BUCKET_PUBLIC=nexo-public
MINIO_BUCKET_PRIVATE=nexo-private
MINIO_BUCKET_TEMP=nexo-temp
MINIO_PUBLIC_URL=https://storage.tudominio.com  # URL pública
```

### 5. Consideraciones de Seguridad

| Aspecto | Recomendación |
|---------|---------------|
| Credenciales | Usar secretos fuertes, NO valores por defecto |
| SSL/TLS | Reverse proxy (Nginx/Traefik) con certificado |
| Backups | Configurar mc mirror o replicación |
| CDN | Cloudflare/CloudFront para caché de archivos públicos |
| Volumen | Persistente en `/data/minio` con respaldos |
| Acceso consola | Puerto 9001 solo accesible internamente o con VPN |

### 6. Dependencias del Backend

Agregar `depends_on` en el servicio backend:

```yaml
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
```
