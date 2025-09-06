# Contexto del Proyecto para Bot de WhatsApp con n8n

## Visión General del Proyecto

Este proyecto implementa un Bot de WhatsApp utilizando un conjunto de tecnologías orquestadas con Docker Compose. Los componentes principales son:

- **n8n**: Una herramienta de automatización de flujos de trabajo que actúa como orquestador central.
- **Evolution API**: Una API para interactuar con WhatsApp.
- **PostgreSQL**: Una base de datos compartida para persistir datos de n8n, Evolution API y potencialmente la memoria de un agente de chat de IA.
- **pgAdmin**: Una herramienta de administración web para la base de datos PostgreSQL.

El bot está diseñado para integrarse con agentes de IA (como DeepSeek) y servicios como Google Calendar. El proyecto utiliza Docker y Docker Compose para una fácil configuración y despliegue.

## Tecnologías Clave

- **Docker & Docker Compose**: Para contenedorización y orquestación.
- **Node.js/npm**: Para scripts del proyecto (definidos en `package.json`).
- **PostgreSQL**: Base de datos relacional.
- **n8n**: Plataforma de automatización de flujos de trabajo.
- **Evolution API**: API de interacción con WhatsApp.

## Estructura del Proyecto

- `docker-compose.yml`: Define y orquesta todos los servicios (n8n, Evolution API, PostgreSQL, pgAdmin).
- `package.json`: Contiene los metadatos del proyecto y los scripts de `npm` para gestionar el entorno de Docker Compose.
- `.env.example`: Archivo de ejemplo de variables de entorno. Se debe copiar a `.env` y configurar.
- `init-data.sh`: Script de inicialización ejecutado por el contenedor de PostgreSQL para crear las bases de datos y extensiones necesarias.
- `data/`: Directorio para volúmenes de datos persistentes (PostgreSQL, n8n, Evolution API). Este directorio es ignorado por Git.

## Configuración del Entorno

1.  Copiar `.env.example` a `.env` y configurar todas las variables, especialmente contraseñas y claves API.
2.  Asegurarse de que Docker y Docker Compose estén instalados y en ejecución.

## Construcción y Ejecución

El proyecto utiliza scripts de `npm` (definidos en `package.json`) como interfaz principal para gestionar la configuración de Docker Compose:

- `npm run start`: Inicia todos los servicios en modo desatendido (`docker compose up -d`).
- `npm run stop`: Detiene todos los servicios (`docker compose down`).
- `npm run restart`: Detiene y luego inicia todos los servicios.
- `npm run dev`: Inicia los servicios y construye las imágenes (`docker compose up -d --build`).
- `npm run dev:fresh`: Limpia volúmenes y huérfanos, luego inicia con una construcción nueva.
- `npm run logs`: Sigue los registros de todos los servicios (`docker compose logs -f`).
- `npm run logs:<servicio>`: Sigue los registros de un servicio específico (por ejemplo, `n8n`, `evolution`, `postgres`).
- `npm run status`: Muestra el estado de los servicios (`docker compose ps`).
- `npm run clean`: Detiene los servicios, elimina volúmenes/huérfanos y limpia el sistema Docker.
- `npm run clean:data`: Realiza `clean` y además elimina los directorios locales `./data/postgres` y `./data/n8n`.
- `npm run fresh:clean`: Realiza `clean:data` y luego inicia con una construcción nueva.
- `npm run backup:db`: Crea una copia de seguridad de la base de datos PostgreSQL.
- `npm run db:connect`: Abre un shell `psql` dentro del contenedor de PostgreSQL.

## Persistencia de Datos

Los datos para PostgreSQL, n8n y Evolution API se almacenan en el directorio `./data`. Este directorio se monta como volúmenes en sus respectivos contenedores y es ignorado por Git para proteger los datos sensibles.

## Convenciones de Desarrollo

- Utilizar los scripts de `npm` proporcionados para tareas comunes y garantizar la consistencia.
- Gestionar las variables de entorno exclusivamente a través del archivo `.env`.
- Consultar `data/README.md` para notas importantes sobre la persistencia de datos y las copias de seguridad.
- **Importante**: Todo el contenido y la documentación del proyecto se deben mantener en español.