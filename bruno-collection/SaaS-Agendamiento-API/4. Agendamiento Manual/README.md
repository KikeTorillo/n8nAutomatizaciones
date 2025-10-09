# Flujo 6: Agendamiento Manual

Este flujo cubre el proceso completo de agendamiento manual de citas por parte del personal de la organización.

## Secuencia de requests

1. **Crear Cliente** - Registra un nuevo cliente en el sistema
2. **Verificar Disponibilidad** - Consulta slots disponibles para un profesional y servicio
3. **Crear Cita** - Agenda una cita para el cliente (código auto-generado)
4. **Actualizar Estado Cita** - Cambia el estado de la cita (confirmada, en_curso, completada)
5. **Cancelar Cita** - Cancela una cita existente

## Variables guardadas

- `clienteId` - ID del cliente creado
- `citaId` - ID numérico de la cita
- `codigoCita` - Código único auto-generado (formato: ORG001-20251008-001)

## Prerequisitos

- Token de autenticación válido (Flujo 1)
- Profesional creado (Flujo 3)
- Servicio creado (Flujo 3)

## Estados de Cita

- `pendiente` - Cita creada pero no confirmada
- `confirmada` - Cliente confirmó asistencia
- `en_curso` - Servicio en progreso
- `completada` - Servicio finalizado
- `cancelada` - Cita cancelada
- `no_asistio` - Cliente no se presentó

## Nota Importante

**NO enviar `codigo_cita`** en el body al crear una cita. El código se genera automáticamente mediante un trigger de base de datos con el formato: `ORG001-20251008-001`
