# Flujo 1: Onboarding - Auto-Registro

## 📖 Descripción

**Flujo inicial del sistema** - Auto-registro público para nuevos clientes sin intervención manual.

Este flujo implementa el **patrón SaaS self-service signup** estándar (como Stripe, Slack, Shopify), permitiendo que clientes nuevos:
- Se registren automáticamente
- Cre

en su organización
- Obtengan acceso inmediato (auto-login)
- Configuren su negocio de 0 a 100%

---

## 🎯 Objetivos del Flujo

1. ✅ **Registro público** → Crear organización + usuario admin
2. ✅ **Auto-login** → Generar JWT token automáticamente
3. ✅ **Setup de catálogo** → Profesionales + servicios
4. ✅ **Configuración de horarios** → Disponibilidad
5. ✅ **Verificación** → Confirmar que está operativo

**Resultado**: Organización 100% operativa en 6 pasos

---

## 📋 Endpoints del Flujo

| # | Request | Endpoint | Método | Auth |
|---|---------|----------|--------|------|
| 1 | Registro | \`/api/v1/organizaciones/register\` | POST | ❌ No |
| 2 | Login | \`/api/v1/auth/login\` | POST | ❌ No (opcional) |
| 3 | Crear Primer Profesional | \`/api/v1/profesionales\` | POST | ✅ Bearer |
| 4 | Crear Primer Servicio | \`/api/v1/servicios\` | POST | ✅ Bearer |
| 5 | Configurar Horarios | \`/api/v1/horarios/profesionales\` | POST | ✅ Bearer |
| 6 | Verificar Setup Completo | \`/api/v1/organizaciones/:id\` | GET | ✅ Bearer |

---

## 🚀 Secuencia de Ejecución

### 1. Registro (punto de entrada - sin auth)
### 2. Login (opcional - ya tienes token del registro)
### 3-6. Configuración (con token del paso 1)

---

## ⚠️ Troubleshooting

- **Error 409**: Email duplicado → Usar email único
- **Error 422**: Password débil → Min 8 chars + mayúscula + número

---

Para detalles completos, ejecutar los requests en Bruno y ver documentación inline.

**Última actualización**: 08 Octubre 2025
