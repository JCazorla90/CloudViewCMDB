# 🌐 CloudView CMDB – Conexión por Rol en GCP

## ✅ Requisitos
- Permisos para crear Service Accounts

## 🛠️ Paso 1 – Crear Service Account
1. IAM & Admin > Service Accounts > Create
2. Nombre: `cloudview-sa`
3. Roles:
   - Viewer
   - Service Usage Viewer

## 🛠️ Paso 2 – Crear clave JSON
1. Accede al service account > Keys > Add Key > JSON
2. Guarda el archivo `.json` generado

## 🛠️ Alternativa: Workload Identity Federation
(Para entornos sin claves permanentes)

## ✅ En CloudView
- Método: Token
- Provider: `gcp`
- JSON Key