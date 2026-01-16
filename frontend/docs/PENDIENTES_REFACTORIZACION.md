# Pendientes Post-Refactorización Frontend

**Fecha**: 16 Enero 2026
**Versión**: 1.0

---

## Resumen de Refactorización Completada

### Fase 1: Nomenclatura FormModal → FormDrawer
- [x] 10 archivos renombrados correctamente
- [x] Componentes usan Drawer (Vaul) internamente

### Fase 2: Hooks Organizados por Dominio
- [x] 92 hooks movidos a 8 subcarpetas
- [x] Stubs de compatibilidad creados (92 archivos)
- [x] Index.js en cada subcarpeta

### Fase 3: Modularización endpoints.js
- [x] 59 módulos API extraídos
- [x] endpoints.js reducido a re-exports
- [x] Retrocompatibilidad mantenida

### Fase 4: Atomic Design UI
- [x] 35 componentes organizados en 4 niveles
- [x] Stubs de compatibilidad creados
- [x] Index.js por nivel

---

## Bugs Detectados Durante Validación

### Prioridad Alta

| Bug | Ubicación | Descripción |
|-----|-----------|-------------|
| ~~Paginación NaN~~ | ~~`ClientesPage.jsx`~~ | ~~Muestra "NaN-NaN de X" en paginación~~ - **RESUELTO 16 Ene 2026** (fix en ResponseHelper.paginated) |

### Prioridad Media

| Bug | Ubicación | Descripción |
|-----|-----------|-------------|
| - | - | Sin bugs adicionales detectados |

---

## Mejoras Pendientes

### Limpieza de Código

1. **Eliminar stubs después de migrar imports**
   - 92 stubs en `hooks/` raíz
   - 35 stubs en `components/ui/` raíz
   - Migrar imports gradualmente a rutas nuevas

2. **Consolidar imports en páginas**
   ```javascript
   // Actual (funciona pero usa stubs)
   import { useCitas } from '@/hooks/useCitas';

   // Ideal (sin stubs)
   import { useCitas } from '@/hooks/agendamiento';
   // o
   import { useCitas } from '@/hooks';
   ```

3. **Consolidar imports UI**
   ```javascript
   // Actual
   import Button from '@/components/ui/Button';

   // Ideal
   import { Button } from '@/components/ui/atoms';
   // o
   import { Button } from '@/components/ui';
   ```

### Documentación

- [ ] Actualizar README con nueva estructura
- [ ] Agregar JSDoc a index.js de cada módulo
- [ ] Crear guía de contribución con convenciones

### Testing

- [ ] Verificar todos los módulos en navegador
- [ ] Probar flujos críticos (crear cita, venta, producto)
- [ ] Validar responsividad mobile

---

## Estructura Final

### Hooks (`/src/hooks/`)
```
hooks/
├── index.js              # Re-exports centralizados
├── agendamiento/         # 6 hooks
├── almacen/              # 7 hooks
├── inventario/           # 14 hooks
├── otros/                # 8 hooks
├── personas/             # 22 hooks
├── pos/                  # 9 hooks
├── sistema/              # 13 hooks
└── utils/                # 11 hooks
```

### UI Components (`/src/components/ui/`)
```
ui/
├── index.js              # Re-exports centralizados
├── atoms/                # 10 componentes básicos
├── molecules/            # 12 componentes combinados
├── organisms/            # 11 componentes complejos
│   └── filters/          # 5 componentes de filtros
└── templates/            # 2 layouts de página
```

### API Modules (`/src/services/api/`)
```
api/
├── client.js             # Axios config
├── endpoints.js          # Re-exports (compatibilidad)
└── modules/              # 59 archivos API
    ├── index.js
    ├── auth.api.js
    ├── inventario.api.js
    └── ...
```

---

## Notas Técnicas

### Patrón de Re-exports
Todos los módulos usan re-exports para compatibilidad:
```javascript
// hooks/useCitas.js (stub)
export * from './agendamiento/useCitas';
export { default } from './agendamiento/useCitas';
```

### Imports Entre Niveles Atomic
Los componentes de nivel superior importan de niveles inferiores:
```javascript
// organisms/DataTable.jsx
import { SkeletonTable } from '../molecules/SkeletonTable';
import Button from '../atoms/Button';
```

---

## Próximos Pasos Sugeridos

1. **Corto plazo** (esta semana)
   - [x] Corregir bug de paginación NaN (RESUELTO)
   - [ ] Verificar resto de módulos en navegador

2. **Mediano plazo** (próximas 2 semanas)
   - [ ] Migrar imports más usados a rutas nuevas
   - [ ] Eliminar stubs no utilizados

3. **Largo plazo** (próximo mes)
   - [ ] Eliminar todos los stubs
   - [ ] Actualizar documentación completa
   - [ ] Considerar tree-shaking optimizations

---

**Autor**: Claude Code
**Última actualización**: 16 Enero 2026
