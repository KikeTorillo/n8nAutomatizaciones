#!/bin/bash
# Script para validar que el esquema cargado es correcto

echo "🔍 Validando esquema de BD..."

# Contar tablas esperadas
EXPECTED_TABLES=25
ACTUAL_TABLES=$(docker-compose exec -T saas_db psql -U saas_user -d saas_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | xargs)

if [ "$ACTUAL_TABLES" -eq "$EXPECTED_TABLES" ]; then
    echo "✅ Tablas: $ACTUAL_TABLES/$EXPECTED_TABLES"
else
    echo "❌ ERROR: Tablas incorrectas $ACTUAL_TABLES/$EXPECTED_TABLES"
    exit 1
fi

# Validar funciones críticas
FUNCTIONS=("calcular_comision_cita" "obtener_configuracion_comision" "setup_partitions_for_month" "actualizar_updated_at")
for func in "${FUNCTIONS[@]}"; do
    EXISTS=$(docker-compose exec -T saas_db psql -U saas_user -d saas_db -t -c "SELECT COUNT(*) FROM pg_proc WHERE proname = '$func';" | xargs)
    if [ "$EXISTS" -eq "1" ]; then
        echo "✅ Función: $func"
    else
        echo "❌ ERROR: Función $func no existe"
        exit 1
    fi
done

# Validar triggers
TRIGGERS=("trigger_calcular_comision_cita" "trigger_actualizar_updated_at")
for trig in "${TRIGGERS[@]}"; do
    EXISTS=$(docker-compose exec -T saas_db psql -U saas_user -d saas_db -t -c "SELECT COUNT(*) FROM pg_trigger WHERE tgname = '$trig';" | xargs)
    if [ "$EXISTS" -ge "1" ]; then
        echo "✅ Trigger: $trig"
    else
        echo "❌ ERROR: Trigger $trig no existe"
        exit 1
    fi
done

# Validar ENUMs
ENUMS=("rol_usuario" "estado_cita" "estado_subscripcion")
for enum in "${ENUMS[@]}"; do
    EXISTS=$(docker-compose exec -T saas_db psql -U saas_user -d saas_db -t -c "SELECT COUNT(*) FROM pg_type WHERE typname = '$enum';" | xargs)
    if [ "$EXISTS" -eq "1" ]; then
        echo "✅ ENUM: $enum"
    else
        echo "❌ ERROR: ENUM $enum no existe"
        exit 1
    fi
done

echo ""
echo "✅ Validación completa exitosa"
echo "   - $ACTUAL_TABLES tablas creadas"
echo "   - ${#FUNCTIONS[@]} funciones críticas validadas"
echo "   - ${#TRIGGERS[@]} triggers validados"
echo "   - ${#ENUMS[@]} ENUMs validados"
