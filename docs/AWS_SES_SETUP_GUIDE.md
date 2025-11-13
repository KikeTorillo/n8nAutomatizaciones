# 📧 Guía Completa de Configuración AWS SES para Producción

**Proyecto**: SaaS Agendamiento Multi-Tenant
**Propósito**: Configurar envío de emails transaccionales (recuperación de contraseña)
**Hosting**: Hostinger VPS
**Última actualización**: 13 Noviembre 2025
**Versión**: 2.0

---

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#1-prerrequisitos)
2. [Crear Cuenta AWS (si no tienes)](#2-crear-cuenta-aws-si-no-tienes)
3. [Acceder a Amazon SES](#3-acceder-a-amazon-ses)
4. [Verificar Dominio](#4-verificar-dominio)
5. [Crear Credenciales SMTP](#5-crear-credenciales-smtp)
6. [Solicitar Acceso a Producción](#6-solicitar-acceso-a-producción)
7. [Configurar .env.prod](#7-configurar-envprod)
8. [Configurar Hostinger VPS](#8-configurar-hostinger-vps)
9. [Probar Configuración](#9-probar-configuración)
10. [Monitoreo y Límites](#10-monitoreo-y-límites)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerrequisitos

### ✅ Requisitos Técnicos
- [ ] Dominio propio registrado: **n8nflowautomat.com**
- [ ] Acceso al panel DNS de tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.)
- [ ] Tarjeta de crédito/débito válida (AWS requiere método de pago aunque sea gratis)
- [ ] Correo electrónico válido para cuenta AWS

### 💰 Costos Esperados

| Concepto | Costo |
|----------|-------|
| **Primeros 62,000 emails/mes** | **GRATIS** (AWS Free Tier) |
| Después de 62,000 emails | $0.10 USD por cada 1,000 emails |
| **Ejemplo**: 100,000 emails/mes | ~$3.80 USD/mes |
| **Ejemplo**: 500,000 emails/mes | ~$43.80 USD/mes |

**Para este proyecto**: Con menos de 1,000 organizaciones activas, probablemente **GRATIS** indefinidamente.

---

## 2. Crear Cuenta AWS (si no tienes)

### 2.1 Registro

1. Ve a: **https://aws.amazon.com/es/free/**
2. Clic en **"Crear una cuenta de AWS"**
3. Completa el formulario:
   - **Correo electrónico**: Tu email personal/empresarial
   - **Nombre de cuenta AWS**: `SaaS-Agendamiento-Prod` (o lo que prefieras)
   - **Contraseña**: Usa gestor de contraseñas (mínimo 8 caracteres)

### 2.2 Información de Contacto

4. Selecciona tipo de cuenta:
   - ✅ **Profesional** (para negocio)
   - Nombre de empresa: Tu nombre o empresa
   - País: México
   - Dirección completa
   - Teléfono con código +52

### 2.3 Información de Pago

5. Ingresa datos de tarjeta:
   - AWS hará un cargo temporal de $1 USD (se reversa)
   - Solo se cobrará si excedes el Free Tier (poco probable)

### 2.4 Verificación de Identidad

6. Verifica tu identidad:
   - SMS o llamada telefónica
   - Ingresa código de 4 dígitos recibido

### 2.5 Seleccionar Plan de Soporte

7. Elige **"Plan de soporte Básico"** (GRATIS)
   - El plan Developer ($29/mes) NO es necesario para SES

### 2.6 Confirmación

8. Espera email de confirmación (1-5 minutos)
9. Ya tienes cuenta AWS activa ✅

---

## 3. Acceder a Amazon SES

### 3.1 Login en AWS Console

1. Ve a: **https://console.aws.amazon.com/**
2. Ingresa email y contraseña
3. Si habilitaste MFA, ingresa código

### 3.2 Navegar a SES

4. En la barra de búsqueda superior, escribe: **`SES`**
5. Clic en **"Amazon Simple Email Service"**

   O acceso directo: **https://console.aws.amazon.com/ses/**

### 3.3 Seleccionar Región

6. **MUY IMPORTANTE**: En la esquina superior derecha, selecciona región:

   **Región recomendada**: `US East (N. Virginia)` → **us-east-1**

   ¿Por qué us-east-1?
   - ✅ Menor latencia hacia México
   - ✅ Más servicios AWS disponibles
   - ✅ Configuración más simple para principiantes

   **Tu SMTP_HOST será**: `email-smtp.us-east-1.amazonaws.com`

---

## 4. Verificar Dominio

### 4.1 Iniciar Verificación de Dominio

1. En el menú lateral izquierdo de SES, clic en **"Verified identities"** (Identidades verificadas)
2. Clic en botón naranja **"Create identity"**
3. Selecciona:
   - **Identity type**: ✅ Domain
   - **Domain**: `n8nflowautomat.com` (SIN www, SIN https://)
4. **Advanced DKIM settings**:
   - ✅ Easy DKIM (recomendado)
   - Signing key length: **RSA_2048_BIT**
   - DKIM signatures: **Enabled**
5. Clic en **"Create identity"**

### 4.2 Obtener Registros DNS

AWS te mostrará una pantalla con registros DNS que debes agregar:

**Ejemplo de registros (TUS VALORES SERÁN DIFERENTES):**

```
Tipo    Nombre                                              Valor
-----------------------------------------------------------------------
CNAME   abc123def456._domainkey.n8nflowautomat.com         abc123def456.dkim.amazonses.com
CNAME   xyz789ghi012._domainkey.n8nflowautomat.com         xyz789ghi012.dkim.amazonses.com
CNAME   mno345pqr678._domainkey.n8nflowautomat.com         mno345pqr678.dkim.amazonses.com
TXT     _amazonses.n8nflowautomat.com                      aws-ses-verification-token-here
```

**Copia estos valores** (los necesitarás en el siguiente paso)

### 4.3 Agregar Registros en tu Proveedor DNS

**Opción A - Cloudflare** (si usas Cloudflare):

1. Inicia sesión en Cloudflare
2. Selecciona dominio `n8nflowautomat.com`
3. Ve a **DNS → Records**
4. Para CADA registro que te dio AWS:
   - Clic en **Add record**
   - Type: `CNAME` o `TXT`
   - Name: Copia el nombre completo (ej: `abc123def456._domainkey`)
   - Content: Copia el valor
   - Proxy status: **DNS only** (nube gris, NO naranja)
   - TTL: Auto
   - Clic en **Save**
5. Repite para los 4 registros (3 CNAME + 1 TXT)

**Opción B - GoDaddy**:

1. Inicia sesión en GoDaddy
2. My Products → Domains → `n8nflowautomat.com` → DNS
3. Clic en **Add** → CNAME
4. Host: `abc123def456._domainkey` (sin el dominio)
5. Points to: valor AWS
6. TTL: 1 hora
7. Repite para todos los registros

**Opción C - Namecheap**:

1. Domain List → Manage → Advanced DNS
2. Add New Record
3. Type: CNAME Record
4. Host: `abc123def456._domainkey`
5. Value: valor AWS
6. TTL: Automatic

### 4.4 Esperar Verificación

- **Tiempo estimado**: 5 minutos a 72 horas (usualmente 30 minutos)
- AWS verifica automáticamente cada 5 minutos
- **Cómo verificar estado**:
  1. En SES Console → Verified identities
  2. Busca `n8nflowautomat.com`
  3. Status: **Verified** ✅ (verde) = Listo
  4. Status: **Pending** 🟡 (amarillo) = Esperar

**IMPORTANTE**: No puedes continuar hasta que el estado sea **Verified** ✅

---

## 5. Crear Credenciales SMTP

### 5.1 Acceder a Configuración SMTP

1. En SES Console, menú lateral izquierdo → **"SMTP settings"**
2. Verás información como:
   ```
   SMTP endpoint: email-smtp.us-east-1.amazonaws.com
   Port: 587 (TLS)
   ```

### 5.2 Crear Usuario SMTP

3. Clic en botón **"Create SMTP credentials"** (parte superior derecha)
4. Se abrirá la consola de IAM (Identity and Access Management)
5. **IAM User Name**: Déjalo como está (ej: `ses-smtp-user.20251113-123456`)
   - O personalízalo: `saas-agendamiento-smtp-prod`
6. Clic en **"Create user"** (abajo a la derecha)

### 5.3 GUARDAR CREDENCIALES (SOLO APARECEN UNA VEZ)

**⚠️ CRÍTICO**: La siguiente pantalla mostrará las credenciales **UNA SOLA VEZ**

Verás algo como:

```
SMTP Username: AKIA6RWZEXAMPLEEXAMPLE
SMTP Password: BHje9V8rExamplePasswordK3kWJMpl7K9Example
```

**Acciones obligatorias**:

1. ✅ Clic en **"Download credentials"** (descarga archivo .csv)
2. ✅ Copia ambos valores a un gestor de contraseñas (1Password, Bitwarden, etc.)
3. ✅ **NUNCA compartas estas credenciales** (permiten enviar emails desde tu cuenta)

**Nota**: Si cierras esta ventana sin guardar, tendrás que eliminar el usuario y crear uno nuevo.

### 5.4 Valores para .env.prod

De las credenciales obtenidas:

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIA6RWZEXAMPLEEXAMPLE          # Tu SMTP Username
SMTP_PASSWORD=BHje9V8rExamplePassword      # Tu SMTP Password
EMAIL_FROM="SaaS Agendamiento <noreply@n8nflowautomat.com>"
```

---

## 6. Solicitar Acceso a Producción

### 6.1 ¿Por qué es necesario?

Por defecto, AWS SES está en **Sandbox Mode** con limitaciones:

| Limitación | Sandbox | Producción |
|------------|---------|------------|
| **Destinatarios** | Solo emails verificados | Cualquier email |
| **Límite diario** | 200 emails/día | 50,000+ emails/día |
| **Tasa de envío** | 1 email/segundo | 14+ emails/segundo |

**Para tu SaaS**: NECESITAS producción para enviar a clientes reales.

### 6.2 Iniciar Solicitud

1. En SES Console, menú lateral izquierdo → **"Account dashboard"**
2. En la sección **"Sending limits"**, clic en botón **"Request production access"**

### 6.3 Completar Formulario

**Mail type** (Tipo de correo):
- ✅ **Transactional** (Transaccional)
  - Razón: Correos de recuperación de contraseña, confirmación de citas, etc.

**Website URL** (URL del sitio web):
- `https://n8nflowautomat.com`

**Use case description** (Descripción del caso de uso):

**Ejemplo en inglés** (AWS prefiere inglés):
```
We are a SaaS platform for appointment scheduling automation. We need to send
transactional emails to our customers including:

1. Password recovery emails
2. Email verification for new accounts
3. Appointment confirmations and reminders
4. System notifications

Expected volume: 100-500 emails per day initially, scaling to 2,000-5,000 as
we grow. All emails are triggered by user actions (password reset, booking
appointments, etc.).

We have implemented:
- Double opt-in for marketing (we DON'T send marketing via SES)
- Unsubscribe links in all non-critical emails
- Bounce and complaint handling via SNS notifications
- Email content complies with CAN-SPAM Act
```

**Additional contacts** (Contactos adicionales):
- Tu email de administrador
- Email de soporte (puede ser el mismo)

**Acknowledge** (Reconocimientos):
- ✅ Marca todas las casillas aceptando términos

### 6.4 Enviar y Esperar Respuesta

4. Clic en **"Submit request"**
5. Recibirás email confirmando recepción
6. **Tiempo de respuesta**: 24-48 horas (usualmente menos de 24h)
7. AWS enviará email con decisión:
   - ✅ **Aprobado**: Puedes enviar a cualquier email
   - ❌ **Rechazado**: Revisa razones y vuelve a solicitar

### 6.5 Mientras Esperas (Modo Sandbox)

Puedes seguir desarrollando verificando emails de prueba:

1. SES Console → Verified identities → Create identity
2. Identity type: **Email address**
3. Email: `tu-email-de-prueba@gmail.com`
4. AWS envía email de verificación → Clic en link
5. Ahora puedes enviar a ese email en modo Sandbox

---

## 7. Configurar .env.prod

### 7.1 Editar Archivo

Abre el archivo `.env.prod` en tu proyecto:

```bash
nano /home/kike/Documentos/n8nAutomatizaciones/.env.prod
```

### 7.2 Actualizar Sección SMTP

Reemplaza la sección de configuración de email (líneas 178-185):

```bash
# ========================================
# CONFIGURACIÓN DE EMAIL (SMTP) - AWS SES
# ========================================
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIA6RWZEXAMPLEEXAMPLE          # Reemplaza con TU SMTP Username
SMTP_PASSWORD=BHje9V8rExamplePassword      # Reemplaza con TU SMTP Password
EMAIL_FROM="SaaS Agendamiento <noreply@n8nflowautomat.com>"
```

### 7.3 Verificar EMAIL_FROM

**MUY IMPORTANTE**: El email en `EMAIL_FROM` DEBE usar tu dominio verificado:

✅ **CORRECTO**:
```bash
EMAIL_FROM="SaaS Agendamiento <noreply@n8nflowautomat.com>"
EMAIL_FROM="Soporte <soporte@n8nflowautomat.com>"
EMAIL_FROM="No Reply <no-reply@n8nflowautomat.com>"
```

❌ **INCORRECTO** (AWS rechazará):
```bash
EMAIL_FROM="SaaS Agendamiento <info@gmail.com>"           # Dominio NO verificado
EMAIL_FROM="Soporte <contacto@otrodominio.com>"           # Dominio NO verificado
```

### 7.4 Guardar Cambios

```bash
# Ctrl+O para guardar
# Ctrl+X para salir
```

---

## 8. Configurar Hostinger VPS

### 8.1 ⚡ Buenas Noticias para Hostinger

**Puertos SMTP ya disponibles**: A diferencia de otros proveedores VPS (Vultr, DigitalOcean), **Hostinger NO bloquea** los puertos SMTP necesarios para AWS SES.

| Puerto | Estado en Hostinger | Uso con AWS SES |
|--------|---------------------|-----------------|
| **587** | ✅ Abierto | **RECOMENDADO** - STARTTLS |
| 465 | ✅ Abierto | Alternativa - SSL/TLS |
| 25 | ⚠️ Limitado | 5 emails/min - NO usar |

**Conclusión**: AWS SES funcionará **sin configuración adicional** en Hostinger VPS.

### 8.2 Verificar Conectividad desde Hostinger VPS

Para estar 100% seguro que tu VPS puede conectarse a AWS SES:

#### Opción A - Desde hPanel Browser Terminal

1. Accede a **hPanel** → **VPS** → Selecciona tu servidor
2. Clic en **"Browser Terminal"** (terminal en el navegador)
3. Ejecuta el test de conectividad:
   ```bash
   telnet email-smtp.us-east-1.amazonaws.com 587
   ```
4. **Resultado esperado**:
   ```
   Trying 54.240.8.29...
   Connected to email-smtp.us-east-1.amazonaws.com.
   Escape character is '^]'.
   220 email-smtp.amazonaws.com ESMTP SimpleEmailService-d-XXXXXXX
   ```
5. Si ves `Connected` y `220 email-smtp.amazonaws.com` ✅ **TODO BIEN**
6. Presiona `Ctrl+]` y luego escribe `quit` para salir

#### Opción B - Desde SSH (Terminal local)

1. Conéctate a tu VPS por SSH:
   ```bash
   ssh root@tu-ip-vps
   # O el comando SSH que te proporciona Hostinger en hPanel
   ```
2. Ejecuta el mismo test:
   ```bash
   telnet email-smtp.us-east-1.amazonaws.com 587
   ```
3. Verifica el resultado como en Opción A

### 8.3 Firewall - Configuración (Solo si personalizaste)

**IMPORTANTE**: Si **NO has tocado** la configuración del firewall, **SALTA esta sección** (los puertos ya están abiertos por defecto).

Si configuraste un firewall personalizado en Hostinger, asegúrate que el puerto 587 esté permitido:

#### Método 1 - Firewall Gráfico desde hPanel

1. Ve a **hPanel** → **VPS** → Selecciona tu servidor
2. En el menú lateral → **Security** → **Firewall**
3. Clic en **"Create firewall configuration"** (si no tienes una)
4. Nombre: `AWS-SES-SMTP`
5. Clic en **"Add rule"**:
   ```
   Action: Accept
   Protocol: TCP
   Port: 587
   Source: 0.0.0.0/0 (anywhere)
   Description: AWS SES SMTP port
   ```
6. Clic en **"Save"**
7. Activa la configuración en tu servidor

#### Método 2 - UFW desde Terminal (Ubuntu/Debian)

Si prefieres comandos (o usas SSH):

1. Conéctate por SSH a tu VPS
2. Verifica estado de UFW:
   ```bash
   sudo ufw status
   ```
3. Si UFW está activo, permite puerto 587:
   ```bash
   sudo ufw allow 587/tcp comment 'AWS SES SMTP'
   ```
4. Recarga firewall:
   ```bash
   sudo ufw reload
   ```
5. Verifica que se agregó:
   ```bash
   sudo ufw status numbered
   ```
   Deberías ver algo como:
   ```
   [ 5] 587/tcp                    ALLOW IN    Anywhere    # AWS SES SMTP
   ```

### 8.4 Docker y Conectividad Saliente

**Si usas Docker** (como en este proyecto), verifica que los contenedores puedan hacer conexiones salientes:

1. Prueba conectividad desde el contenedor backend:
   ```bash
   docker exec -it backend-api sh -c "nc -zv email-smtp.us-east-1.amazonaws.com 587"
   ```
2. **Resultado esperado**:
   ```
   email-smtp.us-east-1.amazonaws.com (52.95.53.67:587) open
   ```
3. Si falla con "Connection refused" o "timeout":
   - Verifica que Docker tenga acceso a internet
   - Revisa variables de red en `docker-compose.prod.yml`

### 8.5 Limitaciones de Hostinger VPS a Conocer

| Limitación | Descripción | ¿Afecta AWS SES? |
|------------|-------------|------------------|
| **Puerto 25** | Limitado a 5 emails/minuto | ❌ NO - Usamos puerto 587 |
| **PHP mail()** | 100 emails/día en shared hosting | ❌ NO - Usamos SMTP autenticado |
| **Rate limit genérico** | Sin límite en VPS | ✅ Sin impacto |

**Conclusión**: Ninguna limitación de Hostinger afecta el uso de AWS SES vía SMTP puerto 587.

### 8.6 Optimización: Latencia Reducida

Para minimizar latencia entre Hostinger y AWS SES:

**Hostinger tiene 7 ubicaciones de VPS**:
- 🇺🇸 USA (North Virginia) - **Más cercano a AWS us-east-1**
- 🇺🇸 USA (Los Angeles)
- 🇪🇺 Netherlands
- 🇬🇧 UK (London)
- 🇸🇬 Singapore
- 🇮🇳 India
- 🇧🇷 Brazil (São Paulo)

**Recomendación**: Si tu VPS está en **USA (North Virginia)**, tendrás latencia <5ms hacia AWS SES us-east-1 (ambos en la misma región).

Para verificar tu ubicación actual:
```bash
curl ipinfo.io
```

### 8.7 Monitoreo de Logs en Hostinger

Para troubleshooting, puedes ver logs de aplicación:

**Logs de Docker**:
```bash
# Conectar por SSH
ssh root@tu-ip-vps

# Ver logs del backend
docker logs backend-api --tail 100 -f

# Buscar mensajes de email
docker logs backend-api 2>&1 | grep "Email de recuperación"
```

**Logs del sistema**:
```bash
# Ver logs generales
sudo journalctl -u docker -f

# Ver intentos de conexión SMTP
sudo grep "587" /var/log/syslog
```

### 8.8 Checklist de Verificación Hostinger

Antes de continuar a testing:

- [ ] Conectividad al puerto 587 verificada (`telnet` exitoso)
- [ ] Firewall permite tráfico saliente en puerto 587 (si aplicable)
- [ ] Variables de entorno SMTP configuradas en `.env.prod`
- [ ] Contenedores Docker pueden hacer conexiones salientes
- [ ] No estás usando puerto 25 (limitado a 5/min)

Si todos los checks están ✅, continúa a la sección de pruebas.

---

## 9. Probar Configuración

### 9.1 Desplegar a Producción

```bash
cd /home/kike/Documentos/n8nAutomatizaciones
bash deploy.sh deploy
```

### 9.2 Probar Recuperación de Contraseña

**Desde tu VPS** (o donde esté desplegado):

1. Ve a: `https://n8nflowautomat.com/auth/forgot-password`
2. Ingresa un email válido (si estás en Sandbox, debe estar verificado)
3. Clic en **"Enviar enlace de recuperación"**
4. Verifica logs del backend:
   ```bash
   docker logs backend-api -f
   ```
5. Busca líneas como:
   ```
   📧 Email de recuperación enviado a: usuario@example.com
   ```

### 9.3 Verificar Email Recibido

6. Abre tu bandeja de entrada
7. Busca email con asunto: **"🔐 Recuperación de Contraseña - SaaS Agendamiento"**
8. Verifica:
   - ✅ Remitente: `SaaS Agendamiento <noreply@n8nflowautomat.com>`
   - ✅ Link funcional: `https://n8nflowautomat.com/auth/reset-password/TOKEN`
   - ✅ Diseño HTML correcto
   - ✅ Tiempo de expiración: 1 hora

### 9.4 Probar Reseteo Completo

9. Clic en el link del email
10. Ingresa nueva contraseña (mínimo 8 chars, 1 mayúscula, 1 minúscula, 1 número)
11. Clic en **"Restablecer contraseña"**
12. Intenta login con nueva contraseña ✅

---

## 10. Monitoreo y Límites

### 10.1 Panel de Métricas SES

1. SES Console → **Account dashboard**
2. Verás gráficas de:
   - **Sends** (Envíos): Emails enviados en últimas 24h
   - **Bounces** (Rebotes): Emails que no llegaron
   - **Complaints** (Quejas): Marcados como spam
   - **Reputation**: Salud de tu cuenta (mantener >95%)

### 10.2 Límites Actuales

En **Sending limits** verás:

```
Daily sending quota: 50,000 (en producción)
Maximum send rate: 14 emails/second
```

Si necesitas más:
- Clic en **"Request a sending quota increase"**
- AWS aumenta automáticamente si mantienes buena reputación

### 10.3 Configurar Alarmas (Opcional pero Recomendado)

Para recibir alertas si tasa de rebote >5%:

1. SES Console → **Account dashboard** → **Reputation metrics**
2. Clic en **"Edit notification settings"**
3. Habilita:
   - ✅ **Bounce notifications** → Tu email
   - ✅ **Complaint notifications** → Tu email
4. Save

---

## 11. Troubleshooting

### ❌ Error: "Email address is not verified"

**Síntoma**:
```
554 Message rejected: Email address is not verified.
The following identities failed the check in region US-EAST-1: noreply@n8nflowautomat.com
```

**Causa**: Dominio no verificado O aún en modo Sandbox

**Solución**:
1. Ve a SES Console → Verified identities
2. Verifica que `n8nflowautomat.com` tenga estado **Verified** ✅
3. Si estás en Sandbox, verifica también el email DESTINATARIO
4. Si es producción, espera aprobación de AWS

---

### ❌ Error: "Invalid SMTP credentials"

**Síntoma**:
```
535 Authentication Credentials Invalid
```

**Causa**: SMTP_USER o SMTP_PASSWORD incorrectos

**Solución**:
1. Verifica que copiaste bien las credenciales (sin espacios extra)
2. Si las perdiste, ELIMINA el usuario IAM y crea uno nuevo:
   - IAM Console → Users → `ses-smtp-user.xxxxx` → Delete
   - SES Console → SMTP settings → Create SMTP credentials
3. Actualiza `.env.prod` con nuevas credenciales
4. Redeploy: `bash deploy.sh update`

---

### ❌ Error: "Timeout connecting to SMTP server"

**Síntoma**:
```
Error: Timeout connecting to email-smtp.us-east-1.amazonaws.com:587
```

**Causa**: Firewall del VPS bloqueando puerto 587

**Solución para Hostinger VPS**:

**Opción A - hPanel Firewall** (Recomendado):
1. Ve a hPanel → VPS → Security → Firewall
2. Edita tu configuración de firewall
3. Agrega regla: TCP port 587, Source: 0.0.0.0/0, Action: Accept
4. Guarda y aplica

**Opción B - UFW desde Terminal**:
```bash
# En tu VPS:
sudo ufw allow 587/tcp
sudo ufw reload

# Verifica conectividad:
telnet email-smtp.us-east-1.amazonaws.com 587
# Debes ver: "220 email-smtp.amazonaws.com ESMTP SimpleEmailService..."
```

**Nota Hostinger**: En la mayoría de casos, el puerto 587 ya está abierto por defecto. Si tienes timeout, verifica primero que no sea problema de red de tu aplicación.

---

### ❌ Email llega a spam

**Síntoma**: Emails llegan a carpeta spam del destinatario

**Causa**: Falta configurar SPF y mejorar DKIM

**Solución**:
1. Agrega registro SPF en tu DNS:
   ```
   Tipo: TXT
   Name: @
   Value: v=spf1 include:amazonses.com ~all
   ```
2. Verifica DKIM esté habilitado (ya lo hiciste en paso 4.1)
3. Considera configurar DMARC:
   ```
   Tipo: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@n8nflowautomat.com
   ```

---

### ❌ Error: "Daily sending quota exceeded"

**Síntoma**:
```
454 Throttling failure: Daily message quota exceeded
```

**Causa**: Superaste el límite diario (200 en Sandbox, 50,000 en producción)

**Solución**:
1. Espera 24 horas (el contador se reinicia)
2. Solicita aumento de quota:
   - SES Console → Account dashboard → Request sending quota increase
3. Optimiza: ¿Estás enviando emails innecesarios?

---

### ⚠️ Bounce rate >5%

**Síntoma**: AWS envía advertencia de alta tasa de rebote

**Causa**: Enviando a emails inválidos o inexistentes

**Solución**:
1. Implementa validación de emails en frontend (ya tienes PATTERNS.EMAIL)
2. Elimina emails que rebotaron de tu base de datos
3. Implementa doble opt-in para nuevos usuarios
4. Monitorea bounces en SES Console

---

### 🆘 Cuenta SES suspendida

**Síntoma**:
```
Service Unavailable: Your account's ability to send email has been paused
```

**Causa**: Bounce rate >10% O complaint rate >0.5%

**Solución**:
1. Ve a SES Console → Account dashboard → Review suspension reason
2. Corrige el problema (elimina lista de emails mala, etc.)
3. Responde al caso de soporte AWS explicando correcciones
4. Espera revisión (1-3 días)

---

## 📊 Checklist Final

Antes de marcar como completo:

**AWS SES:**
- [ ] Cuenta AWS creada y activa
- [ ] Dominio `n8nflowautomat.com` verificado en SES (estado: **Verified** ✅)
- [ ] Registros DNS agregados (3 CNAME + 1 TXT)
- [ ] Credenciales SMTP creadas y guardadas en lugar seguro
- [ ] Solicitud de producción enviada a AWS

**Hostinger VPS:**
- [ ] Conectividad al puerto 587 verificada (`telnet` exitoso)
- [ ] Puerto 587 permitido en firewall (si aplicable)
- [ ] Contenedores Docker pueden hacer conexiones salientes

**Aplicación:**
- [ ] `.env.prod` actualizado con credenciales correctas
- [ ] Email de prueba enviado y recibido correctamente
- [ ] Link de recuperación funciona end-to-end
- [ ] Alarmas de bounces/complaints configuradas (opcional)
- [ ] Registro SPF agregado al DNS (recomendado)

---

## 📞 Soporte

**AWS SES:**
- Documentación oficial: https://docs.aws.amazon.com/ses/
- Calculadora de costos: https://calculator.aws/#/addService/SES
- Soporte técnico: https://console.aws.amazon.com/support/

**Hostinger VPS:**
- Help Center: https://support.hostinger.com/
- Browser Terminal: hPanel → VPS → Browser Terminal
- Firewall: hPanel → VPS → Security → Firewall
- Tutoriales UFW: https://www.hostinger.com/tutorials/how-to-configure-firewall-on-ubuntu-using-ufw

**Alternativas a AWS SES** (si tienes problemas):
- SendGrid (12,000 emails/mes gratis)
- Mailgun (5,000 emails/mes gratis)
- Postmark (100 emails/mes gratis, mejor deliverability)

---

**Autor**: Claude
**Proyecto**: SaaS Agendamiento Multi-Tenant
**Versión**: 2.0 (Con guía específica Hostinger VPS)
**Última actualización**: 13 Noviembre 2025
