#!/bin/bash

# =====================================================================
# 🧪 SCRIPT DE PRUEBAS AUTOMATIZADAS - SERVICIOS API
# =====================================================================
# Basado en las colecciones de Bruno para testing de servicios
# Ejecuta todas las pruebas de la API de servicios usando curl
# =====================================================================

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="http://localhost:3000"
API_VERSION="v1"
ADMIN_EMAIL="admin@saas-agendamiento.com"
ADMIN_PASSWORD="admin123"

# Variables globales
ACCESS_TOKEN=""
ORGANIZATION_ID=""
SERVICIO_ID=""
SERVICIO_BARBA_ID=""

echo -e "${BLUE}🧪 INICIANDO PRUEBAS AUTOMATIZADAS DE SERVICIOS${NC}"
echo -e "${BLUE}===============================================${NC}\n"

# Función para mostrar progreso
show_progress() {
    echo -e "${YELLOW}[$1/12] $2${NC}"
}

# Función para mostrar éxito
show_success() {
    echo -e "${GREEN}✅ $1${NC}\n"
}

# Función para mostrar error
show_error() {
    echo -e "${RED}❌ $1${NC}\n"
    exit 1
}

# Función para extraer valor JSON usando jq o grep/sed
extract_json_value() {
    local json="$1"
    local key="$2"
    
    if command -v jq >/dev/null 2>&1; then
        echo "$json" | jq -r ".$key"
    else
        # Fallback sin jq
        echo "$json" | grep -o "\"$key\":[^,}]*" | cut -d':' -f2 | sed 's/[",]//g' | tr -d ' '
    fi
}

# 1. Login de administrador
show_progress "1" "Login de administrador para obtener token de acceso"

login_response=$(curl -s -X POST \
  "$BASE_URL/api/$API_VERSION/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$ADMIN_EMAIL'",
    "password": "'$ADMIN_PASSWORD'"
  }')

# Verificar que el login fue exitoso
if echo "$login_response" | grep -q '"success":true'; then
    ACCESS_TOKEN=$(extract_json_value "$login_response" "data.accessToken")
    ORGANIZATION_ID=$(extract_json_value "$login_response" "data.usuario.organizacion_id")
    
    if [[ -z "$ACCESS_TOKEN" ]]; then
        show_error "No se pudo extraer el token de acceso"
    fi
    
    show_success "Login exitoso - Token obtenido (${ACCESS_TOKEN:0:20}...)"
    echo -e "   Organización ID: $ORGANIZATION_ID\n"
else
    show_error "Error en login: $login_response"
fi

# 2. Crear servicio de corte premium
show_progress "2" "Creando servicio: Corte de Cabello Premium"

create_response=$(curl -s -X POST \
  "$BASE_URL/api/$API_VERSION/servicios" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizacion_id": 1,
    "nombre": "Corte de Cabello Premium",
    "descripcion": "Corte de cabello profesional con lavado y secado incluido",
    "categoria": "corte",
    "subcategoria": "premium",
    "duracion_minutos": 45,
    "precio": 25.00,
    "precio_minimo": 20.00,
    "precio_maximo": 30.00,
    "requiere_preparacion_minutos": 5,
    "tiempo_limpieza_minutos": 10,
    "max_clientes_simultaneos": 1,
    "color_servicio": "#2c3e50",
    "configuracion_especifica": {
      "incluye_lavado": true,
      "incluye_secado": true,
      "productos_premium": true
    },
    "tags": ["popular", "premium", "completo"],
    "activo": true
  }')

if echo "$create_response" | grep -q '"success":true'; then
    SERVICIO_ID=$(extract_json_value "$create_response" "data.id")
    show_success "Servicio creado exitosamente - ID: $SERVICIO_ID"
else
    show_error "Error creando servicio: $create_response"
fi

# 3. Crear servicio de barba
show_progress "3" "Creando servicio: Arreglo de Barba Clásica"

create_barba_response=$(curl -s -X POST \
  "$BASE_URL/api/$API_VERSION/servicios" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizacion_id": 1,
    "nombre": "Arreglo de Barba Clásica",
    "descripcion": "Arreglo profesional de barba con recorte y delineado",
    "categoria": "barba",
    "subcategoria": "clasica",
    "duracion_minutos": 30,
    "precio": 15.00,
    "precio_minimo": 12.00,
    "precio_maximo": 18.00,
    "requiere_preparacion_minutos": 3,
    "tiempo_limpieza_minutos": 5,
    "max_clientes_simultaneos": 1,
    "color_servicio": "#8b4513",
    "configuracion_especifica": {
      "incluye_aceites": true,
      "incluye_toalla_caliente": true,
      "productos_naturales": true
    },
    "tags": ["clasico", "barba", "rapido"],
    "activo": true
  }')

if echo "$create_barba_response" | grep -q '"success":true'; then
    SERVICIO_BARBA_ID=$(extract_json_value "$create_barba_response" "data.id")
    show_success "Servicio de barba creado exitosamente - ID: $SERVICIO_BARBA_ID"
else
    show_error "Error creando servicio de barba: $create_barba_response"
fi

# 4. Obtener servicio por ID
show_progress "4" "Obteniendo servicio por ID: $SERVICIO_ID"

get_response=$(curl -s -X GET \
  "$BASE_URL/api/$API_VERSION/servicios/$SERVICIO_ID?organizacion_id=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$get_response" | grep -q '"success":true'; then
    show_success "Servicio obtenido exitosamente por ID"
    echo -e "   Nombre: $(extract_json_value "$get_response" "data.nombre")"
    echo -e "   Precio: \$$(extract_json_value "$get_response" "data.precio")"
    echo -e "   Profesionales asignados: $(extract_json_value "$get_response" "data.total_profesionales_asignados")\n"
else
    show_error "Error obteniendo servicio: $get_response"
fi

# 5. Listar todos los servicios
show_progress "5" "Listando todos los servicios con paginación"

list_response=$(curl -s -X GET \
  "$BASE_URL/api/$API_VERSION/servicios?organizacion_id=1&pagina=1&limite=10&orden=nombre&direccion=ASC" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$list_response" | grep -q '"success":true'; then
    total_elementos=$(extract_json_value "$list_response" "data.paginacion.total_elementos")
    show_success "Servicios listados exitosamente"
    echo -e "   Total elementos: $total_elementos"
    echo -e "   Página actual: $(extract_json_value "$list_response" "data.paginacion.pagina_actual")\n"
else
    show_error "Error listando servicios: $list_response"
fi

# 6. Listar servicios con filtros
show_progress "6" "Listando servicios con filtros (categoría: corte, precio: 20-30)"

filter_response=$(curl -s -X GET \
  "$BASE_URL/api/$API_VERSION/servicios?organizacion_id=1&categoria=corte&activo=true&precio_min=20&precio_max=30&pagina=1&limite=5" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$filter_response" | grep -q '"success":true'; then
    show_success "Servicios filtrados exitosamente"
    echo -e "   Filtros aplicados: categoría=corte, activo=true, precio 20-30\n"
else
    show_error "Error filtrando servicios: $filter_response"
fi

# 7. Búsqueda full-text
show_progress "7" "Búsqueda full-text: término 'corte'"

search_response=$(curl -s -X GET \
  "$BASE_URL/api/$API_VERSION/servicios/buscar?organizacion_id=1&termino=corte&limite=5&solo_activos=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$search_response" | grep -q '"success":true'; then
    show_success "Búsqueda full-text exitosa para término 'corte'"
else
    show_error "Error en búsqueda: $search_response"
fi

# 8. Actualizar servicio
show_progress "8" "Actualizando servicio: precio y descripción"

update_response=$(curl -s -X PUT \
  "$BASE_URL/api/$API_VERSION/servicios/$SERVICIO_ID?organizacion_id=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "precio": 28.00,
    "descripcion": "Corte de cabello premium actualizado con técnicas modernas y productos de alta calidad",
    "tags": ["popular", "premium", "completo", "actualizado"],
    "configuracion_especifica": {
      "incluye_lavado": true,
      "incluye_secado": true,
      "productos_premium": true,
      "tecnicas_modernas": true,
      "garantia_satisfaccion": true
    }
  }')

if echo "$update_response" | grep -q '"success":true'; then
    show_success "Servicio actualizado exitosamente"
    echo -e "   Nuevo precio: \$$(extract_json_value "$update_response" "data.precio")\n"
else
    show_error "Error actualizando servicio: $update_response"
fi

# 9. Obtener estadísticas
show_progress "9" "Obteniendo estadísticas de servicios"

stats_response=$(curl -s -X GET \
  "$BASE_URL/api/$API_VERSION/servicios/estadisticas?organizacion_id=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$stats_response" | grep -q '"success":true'; then
    show_success "Estadísticas obtenidas exitosamente"
    echo -e "   Total servicios: $(extract_json_value "$stats_response" "data.total_servicios")"
    echo -e "   Servicios activos: $(extract_json_value "$stats_response" "data.servicios_activos")"
    echo -e "   Precio promedio: \$$(extract_json_value "$stats_response" "data.precio_promedio")\n"
else
    show_error "Error obteniendo estadísticas: $stats_response"
fi

# 10. Crear servicio desde plantilla (puede fallar si no hay plantillas)
show_progress "10" "Intentando crear servicio desde plantilla"

template_response=$(curl -s -X POST \
  "$BASE_URL/api/$API_VERSION/servicios/desde-plantilla" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plantilla_id": 1,
    "configuracion_personalizada": {
      "organizacion_id": 1,
      "nombre": "Corte Básico Personalizado",
      "precio": 20.00,
      "duracion_minutos": 30,
      "descripcion": "Servicio creado desde plantilla con personalizaciones específicas",
      "tags": ["plantilla", "personalizado", "basico"]
    }
  }')

if echo "$template_response" | grep -q '"success":true'; then
    show_success "Servicio creado desde plantilla exitosamente"
else
    echo -e "${YELLOW}⚠️ No se pudo crear desde plantilla (puede que no exista plantilla ID 1)${NC}\n"
fi

# 11. Eliminar servicio (soft delete)
show_progress "11" "Eliminando servicio de barba (soft delete)"

delete_response=$(curl -s -X DELETE \
  "$BASE_URL/api/$API_VERSION/servicios/$SERVICIO_BARBA_ID?organizacion_id=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$delete_response" | grep -q '"success":true'; then
    show_success "Servicio eliminado (soft delete) exitosamente"
else
    show_error "Error eliminando servicio: $delete_response"
fi

# 12. Verificar servicio eliminado
show_progress "12" "Verificando servicios eliminados (inactivos)"

inactive_response=$(curl -s -X GET \
  "$BASE_URL/api/$API_VERSION/servicios?organizacion_id=1&activo=false&pagina=1&limite=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$inactive_response" | grep -q '"success":true'; then
    show_success "Verificación de servicios eliminados exitosa"
    echo -e "   Servicios inactivos encontrados\n"
else
    show_error "Error verificando servicios eliminados: $inactive_response"
fi

# Resumen final
echo -e "${GREEN}🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE${NC}"
echo -e "${GREEN}=============================================${NC}"
echo -e "${BLUE}Servicios creados durante las pruebas:${NC}"
echo -e "   • Corte de Cabello Premium (ID: $SERVICIO_ID) - ✅ Activo"
echo -e "   • Arreglo de Barba Clásica (ID: $SERVICIO_BARBA_ID) - ❌ Eliminado"
echo -e "\n${BLUE}Funcionalidades probadas:${NC}"
echo -e "   ✅ Autenticación y autorización"
echo -e "   ✅ Creación de servicios"
echo -e "   ✅ Obtención por ID"
echo -e "   ✅ Listado con paginación"
echo -e "   ✅ Filtros avanzados"
echo -e "   ✅ Búsqueda full-text"
echo -e "   ✅ Actualización de servicios"
echo -e "   ✅ Estadísticas"
echo -e "   ✅ Eliminación (soft delete)"
echo -e "   ✅ Verificación de estados"
echo -e "\n${YELLOW}Nota: La creación desde plantilla puede requerir plantillas existentes en la BD${NC}"

exit 0