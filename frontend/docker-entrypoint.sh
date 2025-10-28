#!/bin/sh
# Entrypoint script para arreglar permisos de node_modules

# Si node_modules existe y pertenece a root, cambiar ownership
if [ -d "/app/node_modules" ] && [ "$(stat -c '%u' /app/node_modules)" = "0" ]; then
    echo "📦 Fixing node_modules permissions..."
    chown -R nodejs:nodejs /app/node_modules
fi

# Ejecutar el comando original como usuario nodejs
exec su-exec nodejs "$@"
