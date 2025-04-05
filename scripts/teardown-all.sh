#!/bin/bash
echo "🧹 Eliminando entorno CloudView CMDB..."
docker-compose down -v
echo "✅ Contenedores y volúmenes eliminados."