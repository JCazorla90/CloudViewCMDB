#!/bin/bash
echo "🚀 Iniciando despliegue de CloudView CMDB..."

echo "📦 Paso 1: Construyendo e iniciando servicios"
docker-compose up --build -d

echo "✅ Todos los servicios han sido levantados:"
echo " - MongoDB: http://localhost:27017"
echo " - Backend: http://localhost:3000"
echo " - Frontend: http://localhost:5173"