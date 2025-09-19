# 🚀 Backend API - Sistema SaaS de Agendamiento

Backend Node.js para sistema SaaS multi-tenant de automatización de agendamiento con integración multi-canal.

## ⚡ Inicio Rápido

### 1. Navegar al directorio del backend
```bash
cd backend/app
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp ../.env.example .env
# Editar .env con tus valores
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

### 5. Ejecutar tests
```bash
npm test
```

### 6. Ejecutar en producción
```bash
npm start
```

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Ejecutar en producción |
| `npm run dev` | Desarrollo con nodemon |
| `npm test` | Ejecutar tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con coverage |
| `npm run db:migrate` | Ejecutar migraciones |
| `npm run db:seed` | Cargar datos de prueba |
| `npm run docs` | Generar documentación Swagger |

## 🌐 URLs Importantes

- **Aplicación**: `http://localhost:3000`
- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`

## 📖 Documentación

| Archivo | Propósito |
|---------|-----------|
| **`ESTRUCTURA_BACKEND.md`** | Documentación técnica completa y arquitectura |
| **`../docs_base_datos_saas.md`** | Esquema y diseño de base de datos |
| **`../CLAUDE.md`** | Instrucciones del proyecto general |

## ⚠️ Notas Importantes

- **Puerto por defecto**: 3000
- **Base de datos**: PostgreSQL (ver docker-compose.yml del proyecto principal)
- **Estructura**: El código está en `/app`, no en `/src`
- **Estado actual**: Backend en desarrollo (70% completado)

---

💡 **Para información técnica detallada**, consulta `ESTRUCTURA_BACKEND.md`