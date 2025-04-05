# 🌐 CloudView CMDB – Conexión por Rol en IBM Cloud

## ✅ Requisitos
- Permisos para crear IAM API Keys y usuarios

## 🛠️ Paso 1 – Crear usuario con rol Viewer
1. IAM > Users > Add user
2. Asigna rol `Viewer` para todos los recursos o específicos

## 🛠️ Paso 2 – Crear API Key
1. IAM > API Keys > Create API Key
2. Guarda el valor generado

## ✅ En CloudView
- Método: Token
- Provider: `ibm`
- IAM API Key