# 📝 Notas Específicas para Hostinger VPS

**Versión:** 1.0
**Fecha:** Octubre 2025
**Proveedor:** Hostinger VPS

---

## ✅ Resumen de Compatibilidad

Tu configuración actual es **100% compatible** con Hostinger VPS. Este documento explica las diferencias específicas de Hostinger vs otros proveedores VPS.

---

## 🔑 Diferencias Clave con Hostinger

### 1. **DNS Management - hPanel**

**Diferencia:**
- Otros proveedores: Cloudflare, GoDaddy, Namecheap (paneles propios)
- **Hostinger:** hPanel → Domains → DNS / Name Servers

**Ventaja Hostinger:**
- Propagación DNS más rápida (típicamente 15-30 min vs 24h)
- Interfaz unificada (VPS + DNS en mismo lugar)

**Instrucciones actualizadas:** ✅ Ver `VPS_DEPLOYMENT_GUIDE.md` Paso 1

---

### 2. **SSL Wildcard - Método Manual DNS-01**

**Diferencia:**
- Cloudflare: Plugin `certbot-dns-cloudflare` (automatizado)
- **Hostinger:** Método manual (agregar registro TXT a mano)

**Proceso en Hostinger:**
1. Ejecutar `certbot certonly --manual`
2. Certbot da un valor TXT
3. Ir a hPanel → DNS Records → Agregar TXT record
4. Esperar 5 min → Volver a certbot y presionar Enter

**Por qué manual:**
- Hostinger no tiene plugin oficial de Certbot
- El método manual es confiable y solo se hace 1 vez
- Renovación automática funciona sin intervención después

**Instrucciones actualizadas:** ✅ Ver `VPS_DEPLOYMENT_GUIDE.md` Paso 2

---

### 3. **Firewall - Doble Capa**

**Diferencia:**
- Otros VPS: Solo UFW (Linux firewall)
- **Hostinger:** Firewall hPanel (GUI) + UFW (Linux)

**Configuración recomendada:**
1. **hPanel Firewall** (prioridad): Configurar desde GUI
   - Permite: 22 (SSH), 80 (HTTP), 443 (HTTPS)
   - Bloquea: 3000, 5678, 8080, 5432, 6379

2. **UFW** (segunda capa): Configurar desde SSH
   - Mismas reglas que hPanel
   - Actúa como respaldo si hPanel falla

**Ventaja Hostinger:**
- Doble protección
- Si hay problema con UFW, puedes resetear desde hPanel

**Instrucciones actualizadas:** ✅ Ver `VPS_DEPLOYMENT_GUIDE.md` Paso 8

---

### 4. **SSH Access - Browser Terminal**

**Diferencia:**
- Otros VPS: Solo SSH tradicional (puerto 22)
- **Hostinger:** Browser Terminal + SSH tradicional

**Browser Terminal (exclusivo Hostinger):**
```
hPanel → VPS → Manage → Browser Terminal (botón superior derecha)
```

**Ventajas:**
- No necesitas cliente SSH (PuTTY, Terminal)
- Acceso instantáneo desde navegador
- Ya viene con acceso root
- Útil si SSH tradicional falla

**Instrucciones actualizadas:** ✅ Ver `VPS_DEPLOYMENT_GUIDE.md` Paso 2.1

---

### 5. **Docker Template Preinstalado**

**Diferencia:**
- Otros VPS: Instalar Docker manualmente
- **Hostinger:** Template Ubuntu 24.04 con Docker preinstalado

**Template disponible:**
- Docker CE (Community Edition)
- Docker Compose v2
- Ubuntu 24.04 LTS

**Beneficio:**
- Ahorra ~10 minutos de setup
- Versiones actualizadas y compatibles
- Menos riesgo de errores en instalación

**Instrucciones actualizadas:** ✅ Ver `VPS_DEPLOYMENT_GUIDE.md` Paso 3.1

---

## 📊 Tabla Comparativa

| Feature | Otros VPS | Hostinger VPS | Ventaja |
|---------|-----------|---------------|---------|
| **DNS Propagación** | 2-24h | 15-30 min | ⚡ Hostinger |
| **SSL Plugin** | Automatizado | Manual | - Otros |
| **Firewall** | Solo UFW | hPanel + UFW | 🛡️ Hostinger |
| **SSH Access** | Terminal | Browser + Terminal | 🖥️ Hostinger |
| **Docker Setup** | Manual | Preinstalado | ⚙️ Hostinger |
| **Panel Control** | Básico | hPanel (intuitivo) | 👍 Hostinger |
| **Reset Options** | Limitado | Firewall/SSH/VPS | 🔧 Hostinger |

---

## 🎯 Recomendaciones para Hostinger

### ✅ Hacer

1. **Usar Browser Terminal** para primeros pasos (más fácil)
2. **Verificar Docker preinstalado** antes de instalar manualmente
3. **Configurar Firewall hPanel primero**, luego UFW
4. **Aprovechar DNS rápido** de Hostinger (15-30 min típicamente)
5. **Configurar certbot renewal** después de obtener SSL (paso único)

### ❌ Evitar

1. No instalar Docker si ya viene en template (desperdicias tiempo)
2. No ignorar Firewall hPanel (tiene prioridad sobre UFW)
3. No esperar solo 5 min para propagación DNS (espera al menos 15)
4. No usar plugins SSL de otros proveedores (no funcionan en Hostinger)
5. No resetear VPS sin backup (usa Reset Firewall/SSH primero)

---

## 🔍 Troubleshooting Específico de Hostinger

### Problema 1: "No puedo acceder por SSH"

**Solución Hostinger:**
```
hPanel → VPS → Settings → Reset SSH Configuration
```
Esto regenera las keys SSH sin afectar tu VPS.

---

### Problema 2: "DNS no propaga después de 1 hora"

**Verificar:**
1. hPanel → Domains → Verifica que nameservers apunten a Hostinger
2. Si usas nameservers externos (Cloudflare), cambia registros allá
3. Hostinger DNS solo funciona si nameservers son de Hostinger

**Comandos:**
```bash
# Ver nameservers actuales
dig NS n8nflowautomat.com

# Debe mostrar algo como:
# ns1.dns-parking.com
# ns2.dns-parking.com
```

---

### Problema 3: "Firewall bloqueó mi SSH (puerto 22)"

**Solución Hostinger:**
```
hPanel → VPS → Firewall → Reset Firewall
```
Esto restaura reglas por defecto (permite SSH).

---

### Problema 4: "Certbot falla al validar DNS TXT record"

**Causa común:** Registro TXT no propagó todavía

**Solución:**
```bash
# Esperar 5-10 minutos después de agregar TXT record
# Verificar antes de continuar certbot:
dig TXT _acme-challenge.n8nflowautomat.com

# Si ves el valor que dio certbot, presiona Enter
# Si no, espera 5 min más
```

---

## 📚 Recursos Hostinger

**Documentación Oficial:**
- [Hostinger VPS Tutorials](https://www.hostinger.com/tutorials/vps)
- [Hostinger Help Center](https://support.hostinger.com/)

**Tutoriales Relevantes:**
- [SSH Access](https://support.hostinger.com/en/articles/5723772-how-to-connect-to-your-vps-via-ssh)
- [Docker Template](https://support.hostinger.com/en/articles/8306612-how-to-use-the-docker-vps-template)
- [DNS Zone Editor](https://www.hostinger.com/tutorials/how-to-use-hostinger-dns-zone-editor)

---

## ✅ Checklist Pre-Deploy (Hostinger)

Antes de comenzar deployment, verifica:

- [ ] VPS activo en hPanel
- [ ] IP del VPS copiada (hPanel → VPS → VPS Information)
- [ ] Dominio apunta a nameservers de Hostinger (o registros DNS configurados)
- [ ] Browser Terminal funciona (hPanel → VPS → Browser Terminal)
- [ ] Docker está instalado (verificar con `docker --version`)
- [ ] Firewall hPanel configurado (puertos 22, 80, 443 abiertos)

---

## 🎉 Próximos Pasos

Una vez verificada la compatibilidad, sigue la guía principal:

👉 **[VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)** - Guía paso a paso optimizada para Hostinger

---

**Nota:** Todas las instrucciones en `VPS_DEPLOYMENT_GUIDE.md` ya están actualizadas para Hostinger VPS.
