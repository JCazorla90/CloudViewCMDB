
# CloudView CMDB – Inventario visual multicloud con control total


**CloudView CMDB** es una plataforma completa de gestión de recursos en entornos cloud, que permite visualizar y auditar infraestructuras de AWS, Azure, GCP e IBM Cloud.

# 🚧 EN CONSTRUCCION 🚧


```
                     
                            \\\\\\\\\\\\
                          \\\\\\\\\\\\\\\
  -----------,-|           |C>   // )\\\\|
           ,','|          /    || ,'/////|
---------,','  |         (,    ||   /////
         ||    |          \\  ||||//''''|
         ||    |           |||||||     _|
         ||    |______      `````\____/ \
         ||    |     ,|         _/_____/ \
         ||  ,'    ,' |        /          |
         ||,'    ,'   |       |         \  |
_________|/    ,'     |      /           | |
_____________,'      ,',_____|      |    | |
             |     ,','      |      |    | |
             |   ,','    ____|_____/    /  |
             | ,','  __/ |             /   |
_____________|','   ///_/-------------/   |
              |===========,'
```

## 🧱 Requisitos

- Docker + Docker Compose
- Node.js (opcional para desarrollo local)

---

## 🚀 Inicio rápido con Docker

```bash
docker-compose up --build
```

Esto levanta:
- MongoDB (puerto 27017)
- Backend Express en http://localhost:3000
- Frontend React en http://localhost:5173

---

## 🧪 Desarrollo local (opcional)

### Backend

```bash
cd backend
cp ../backend.env .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp ../frontend.env .env
npm install
npm run dev
```

---

## 🌍 Variables de entorno

### 📁 backend.env

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/cmdb
```

### 📁 frontend.env

```
VITE_BACKEND_URL=http://localhost:3000
```

---

## 📦 Estructura

- `/backend`: Node.js + MongoDB + Connectores AWS/Azure/IBM
- `/frontend`: React + React Flow + Tailwind + logos de los proveedores
- `/public/logos`: logos organizados por proveedor

---
## 🧩 Funcionalidades

- 🔍 Descubrimiento automático de recursos por proveedor
- 🗂 Visualización gráfica por tipo de diagrama (infraestructura, red, usuarios…)
- 🧠 Control de cumplimiento (compliance) por reglas personalizables (OWASP, ENS…)
- 🛡 Seguimiento de cambios (create/update/delete con auditoría)
- 🧑‍💼 Panel de administración para gestionar conexiones
- 📤 Exportación de diagramas e inventario
- 🔐 Login visual con roles (`admin`, `viewer`) y JWT
- 🛠 API REST documentada con Swagger y pruebas Postman
- ⚙️ Scripts y despliegue rápido con Docker + Makefile


---

---

## 🚀 Despliegue rápido

```bash
make dev             # Levanta frontend + backend + Mongo
make clean           # Elimina contenedores y volúmenes
./scripts/deploy-all.sh  # Despliegue completo
```

### 🐳 ¿No tienes permisos?
```bash
chmod +x ./scripts/*.sh
```

---

## 📦 Estructura del proyecto

```
cmdb-fullstack/
├── backend/            # API Node.js (Connections, Sync, Compliance, Discovery)
│   ├── server.js
│   ├── complianceRules.json
│   └── discover/
├── frontend/           # Interfaz React + ReactFlow + Tailwind
│   ├── components/
│   ├── pages/
│   └── DiagramView.jsx
├── scripts/            # Scripts para onboarding y despliegue rápido
├── docker-compose.yml  # Backend + Frontend + MongoDB
├── Makefile            # Comandos rápidos
```

---

---

## ⚙️ Endpoints clave (API)

- `GET /api/connections`
- `POST /api/connections`
- `DELETE /api/connections/:id`
- `POST /api/syncResources`
- `POST /api/compliance/check`
- `POST /api/discover/all`

---

## 🌍 Proveedores soportados

- **AWS**: EC2, S3, Lambda, RDS, VPC...
- **Azure**: VMs, Networks, Resource Groups
- **GCP**: Compute, Storage
- **IBM Cloud**: Virtual Servers, Object Storage, Databases

---

## 🔒 Seguridad 

- Middleware de autenticación (JWT o API Key)
- Logs de auditoría
- Roles de acceso por tipo de usuario

---

## 📈 Roadmap

- Soporte para más clouds (GCP, Oracle)
- BBDD relacional opcional (PostgreSQL)
- Multitenancy por organización


## 🚧 Futuros desarrollos

En futuras versiones, CloudView CMDB incluirá:

### 🔐 Autenticación e identidad
- Soporte para **SSO con Okta, LDAP y Active Directory**
- Gestión avanzada de usuarios y grupos con control de roles granular

### ☁️ Proveedores y plataformas adicionales
- **Google Cloud Platform (GCP)** como proveedor soportado
- Integración con entornos **OpenShift** y **Kubernetes**
- Descubrimiento automático de pods, servicios y clústeres

### 🛡️ Seguridad y cumplimiento
- Validación automática de recursos contra estándares como:
  - **OWASP Top 10**
  - **ENS** (Esquema Nacional de Seguridad)
  - **NIS2** (Directiva europea de ciberseguridad)
- Análisis de versiones de componentes y posibles vulnerabilidades

### 📊 Monitorización y observabilidad
- Integración con sistemas como **Prometheus**, **Grafana**, **CloudWatch**
- Visualización de KPIs de salud, coste y rendimiento de los recursos

### 🧠 Automatización y mejoras inteligentes
- Recomendaciones de hardening o buenas prácticas cloud
- Alertas configurables por tipo, proveedor o criticidad
- Detención de configuraciones huérfanas o inconsistentes

## ✨ Futuras funcionalidades

- 🌐 Soporte para Okta, Active Directory, LDAP
- 📘 Documentación Swagger automática
- 🔭 Integración con Jira, ServiceNow, GitHub
- 📦 Licenciamiento y recursos físicos
- ☁️ Validación de versiones y cumplimiento con NIS2, OWASP, ENS
- 👁️‍🗨️ Mapa visual IAM con roles y permisos
- 📡 Dashboard de observabilidad integrado (latencia, errores, etc.)
- 🧠 Auto-descubrimiento continuo y scheduling

---

## 🧪 Pruebas y documentación

- ✔️ Postman Collection incluida
- ✔️ Manual de usuario (PDF)

---

