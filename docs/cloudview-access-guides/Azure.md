# 🌐 CloudView CMDB – Conexión por Rol en Azure

## ✅ Requisitos
- Permisos para crear App Registrations y asignar roles

## 🛠️ Paso 1 – Crear App Registration
1. Ve a Azure AD > App Registrations > New
2. Nómbralo `CloudViewReader`
3. Guarda:
   - `Application (client) ID`
   - `Directory (tenant) ID`

## 🛠️ Paso 2 – Crear secreto de cliente
1. En la app > Certificates & Secrets > New client secret
2. Copia el `clientSecret`

## 🛠️ Paso 3 – Asignar rol
1. Ve a la Suscripción > IAM > Add role assignment
2. Rol: `Reader`
3. Asignar a: la App que creaste

## ✅ En CloudView
- Método: Rol
- Provider: `azure`
- clientId, tenantId, clientSecret, subscriptionId