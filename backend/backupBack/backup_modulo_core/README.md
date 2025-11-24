# Backup - Módulo CORE (Archivos Originales)

**Fecha de backup:** 24 Noviembre 2025  
**Motivo:** Limpieza después de migración exitosa a `modules/core/`

## 📋 Contenido

Este directorio contiene los archivos **originales** del módulo CORE que fueron reemplazados por la nueva estructura modular.

### Archivos Respaldados (26 total)

#### Controllers (8 archivos)
- auth.controller.js
- organizacion.controller.js
- pagos.controller.js
- planes.controller.js
- subscripciones.controller.js
- superadmin.controller.js
- usuario.controller.js
- webhooks.controller.js

#### Models (4 archivos)
- organizacion.model.js
- planes.model.js
- subscripcion.model.js
- usuario.model.js

#### Routes (9 archivos)
- auth.js
- organizaciones.js
- pagos.js
- planes.js
- setup.js
- subscripciones.js
- superadmin.js
- usuarios.js
- webhooks.js

#### Schemas (5 archivos)
- auth.schemas.js
- organizacion.schemas.js
- pagos.schemas.js
- subscripciones.schema.js
- usuario.schemas.js

## ✅ Estado Actual del Proyecto

**Archivos ACTIVOS (en uso):** `backend/app/modules/core/`  
**Archivos EN BACKUP:** `backend/app/backup_modulo_core/` (este directorio)

## ⚠️ Importante

- ✅ El servidor funciona correctamente con la nueva estructura
- ✅ Todos los endpoints del módulo CORE probados y funcionando
- ✅ Los archivos de este backup NO se usan actualmente
- ℹ️ Puedes eliminar este directorio de forma segura después de confirmar que todo funciona en producción por 1-2 semanas

## 🔄 Reversión (si fuera necesario)

Si por alguna razón necesitas revertir la migración:

```bash
# 1. Detener el servidor
docker-compose down

# 2. Restaurar archivos
cp -r backup_modulo_core/controllers/* controllers/
cp -r backup_modulo_core/models/* models/
cp -r backup_modulo_core/routes/api/v1/* routes/api/v1/
cp -r backup_modulo_core/schemas/* schemas/

# 3. Revertir routes/api/v1/index.js
git checkout HEAD -- routes/api/v1/index.js

# 4. Reiniciar servidor
docker-compose up -d
```

---

**Nota:** Este backup se puede eliminar de forma segura una vez confirmado que el módulo CORE migrado funciona correctamente en producción durante al menos 1-2 semanas.
