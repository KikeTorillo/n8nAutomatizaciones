# UX Modulo Profesionales

**Actualizado**: 4 Enero 2026
**Estado**: ✅ IMPLEMENTADO Y VALIDADO E2E

---

## Resumen

Modulo de profesionales con **pagina detalle con tabs + wizard de creacion**, reemplazando drawer monolitico.

| Metrica | Valor |
|---------|-------|
| Campos por vista | ~12 (vs ~50 antes) |
| Estructura | 7 tabs + wizard 3 pasos |
| Validacion | React Hook Form + Zod |
| UI Formularios | Drawers (Vaul) |

---

## Arquitectura

```
frontend/src/
├── pages/profesionales/
│   ├── ProfesionalDetailPage.jsx     # Pagina detalle con tabs
│   └── NuevoProfesionalWizard.jsx    # Wizard 3 pasos
│
├── components/profesionales/
│   ├── ProfesionalHeader.jsx         # Header sticky con foto
│   ├── ProfesionalTabs.jsx           # Navegacion tabs
│   ├── ProfesionalProgressBar.jsx    # Barra progreso perfil
│   │
│   ├── cards/
│   │   ├── InfoCard.jsx              # Card editable con icono
│   │   ├── EditableField.jsx         # Campo con boton editar
│   │   └── QuickEditDrawer.jsx       # Drawer edicion rapida
│   │
│   ├── tabs/
│   │   ├── GeneralTab.jsx            # Info basica, contacto
│   │   ├── TrabajoTab.jsx            # Clasificacion, organizacion
│   │   ├── PersonalTab.jsx           # Datos personales, emergencia
│   │   ├── CurriculumTab.jsx         # Educacion, Experiencia, Habilidades
│   │   ├── DocumentosTab.jsx         # Documentos del empleado
│   │   ├── CompensacionTab.jsx       # Salario, cuentas bancarias
│   │   └── ConfiguracionTab.jsx      # Horarios, servicios, acceso
│   │
│   └── drawers/
│       ├── EducacionDrawer.jsx       # CRUD educacion formal
│       ├── ExperienciaDrawer.jsx     # CRUD experiencia laboral
│       ├── HabilidadDrawer.jsx       # CRUD habilidades + catalogo
│       ├── CuentaBancariaDrawer.jsx  # CRUD cuentas bancarias
│       ├── DocumentoUploadDrawer.jsx # Upload documentos (dropzone)
│       └── OnboardingAplicarDrawer.jsx
│
├── schemas/
│   └── profesionales.schemas.js      # Schemas Zod centralizados
```

### Rutas

```
/profesionales/nuevo     → NuevoProfesionalWizard
/profesionales/:id       → ProfesionalDetailPage (tab General)
/profesionales/:id/:tab  → ProfesionalDetailPage (tab especifico)
```

---

## Patrones

### 1. InfoCard + EditableField

Cards agrupadas con edicion inline:

```jsx
<InfoCard title="Informacion" icon={User} onEdit={() => setModal('info')}>
  <EditableField label="Nombre" value={nombre} />
  <EditableField label="Email" value={email} />
</InfoCard>
```

### 2. QuickEditDrawer

Edicion rapida de 1-5 campos con RHF:

```jsx
<QuickEditDrawer
  isOpen={editModal === 'info'}
  onClose={() => setEditModal(null)}
  profesionalId={id}
  title="Editar"
  fields={[
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email' },
  ]}
  initialValues={{ nombre, email }}
/>
```

### 3. Regla UI

| Componente | Uso |
|------------|-----|
| **Drawer** | Formularios (edicion, creacion) |
| **Modal** | Solo confirmaciones (eliminar) |

---

## Validacion con Zod

**Archivo**: `frontend/src/schemas/profesionales.schemas.js`

### Schemas

| Schema | Campos | Patron |
|--------|--------|--------|
| `educacionSchema` | 10 | superRefine (fechas, en_curso) |
| `experienciaSchema` | 9 | superRefine (empleo_actual) |
| `habilidadEmpleadoSchema` | 5 | zodResolver basico |
| `nuevaHabilidadCatalogoSchema` | 3 | Formulario secundario |
| `cuentaBancariaSchema` | 9 | CLABE regex 18 digitos |
| `documentoMetadataSchema` | 6 | + validateFile() separado |

### Patrones RHF + Zod

```jsx
// Basico
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  defaultValues: DEFAULT_VALUES,
});

// Campos condicionales (ej: en_curso deshabilita fecha_fin)
const enCurso = watch('en_curso');
useEffect(() => {
  if (enCurso) setValue('fecha_fin', '', { shouldValidate: false });
}, [enCurso, setValue]);

// Doble formulario (HabilidadDrawer)
const mainForm = useForm({ resolver: zodResolver(habilidadEmpleadoSchema) });
const catalogoForm = useForm({ resolver: zodResolver(nuevaHabilidadCatalogoSchema) });

// Hibrido File + Zod (DocumentoUploadDrawer)
const [file, setFile] = useState(null);  // File no serializable
const form = useForm({ resolver: zodResolver(documentoMetadataSchema) });
```

---

## Validacion E2E (4 Enero 2026)

Profesional de prueba creado con todos los drawers funcionando:

| Drawer | Datos | Estado |
|--------|-------|--------|
| Wizard 3 pasos | Elena Rodriguez Martinez | ✅ |
| EducacionDrawer | Lic. Psicologia, UNAM 2015-2019 | ✅ |
| ExperienciaDrawer | Consultora RRHH 2019-2023 | ✅ |
| HabilidadDrawer | Gestion Proyectos, PMP cert | ✅ |
| DocumentoUploadDrawer | INE con metadata completa | ✅ |
| CuentaBancariaDrawer | BBVA, CLABE 18 digitos | ✅ |

---

## Notas Tecnicas

- **Dark mode**: Todas las variantes `dark:` implementadas
- **Colores**: Solo `primary-*` (nunca blue/indigo)
- **Dropzone**: `react-dropzone` para DocumentoUploadDrawer
- **Mascaras**: Cuentas bancarias enmascaradas (****1234)
