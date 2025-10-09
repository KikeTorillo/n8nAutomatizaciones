# Flujo 3: Catálogo de Servicios

Este flujo permite configurar el catálogo de servicios de la organización, incluyendo profesionales y los servicios que ofrecen.

## Secuencia de requests

1. **Crear Profesional** - Registra un nuevo profesional (barbero, estilista, médico, etc.)
2. **Listar Profesionales** - Obtiene todos los profesionales activos de la organización
3. **Crear Servicio** - Crea un servicio y lo asocia a uno o más profesionales
4. **Listar Servicios** - Muestra todos los servicios disponibles
5. **Ver Servicios de Profesional** - Consulta los servicios que ofrece un profesional específico

## Variables guardadas

- `profesionalId` - ID del profesional creado
- `servicioId` - ID del servicio creado

## Prerequisitos

- Token de autenticación válido (obtenido en Flujo 1)
- Organización creada (Flujo 2)
