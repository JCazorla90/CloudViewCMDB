# CloudView CMDB – Inventario visual multicloud con control total

CloudView CMDB es una plataforma completa de gestión de recursos en entornos cloud, que permite visualizar, auditar y descubrir recursos de AWS, Azure, GCP e IBM Cloud en tiempo real.

> 🚧 EN CONSTRUCCIÓN – Proyecto en desarrollo activo

```
                       \\\\\\\\\\\\
          ,','|      /    || ,'/////|
---------,','  |     (,    ||   /////
        ||    |      \\  ||||//''''|
        ||    |       |||||||     _|
        ||    |______  ````\____/ \
        ||    |     ,|     _/_____/ \
        ||  ,'    ,' |    /          |
        ||,'    ,'   |   |         \  |
_________|/    ,'    |  /           | |
_____________,'   ,',_|      |     | |
            |   ,','  |      |     | |
            | ,','  __|_____/     /  |
___________|','  ///_/----------/   |
            |===========,'
```

---

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

## 🧪 Desarrollo local

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

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/cmdb
AUDIT_MODE=mock
AUDIT_CONTRACT_ADDRESS=0x...
WEB3_RPC_URL=http://localhost:8545
OPENAI_API_KEY=sk-xxx
AWS_REGION=us-east-1
```

### 📁 frontend.env

```env
VITE_BACKEND_URL=http://localhost:3000
```

---

## 📦 Estructura

```
/backend: API Node.js (Connections, Sync, Compliance, Discovery)
/frontend: Interfaz React + React Flow + Tailwind
/public/logos: Logos oficiales organizados por proveedor
/scripts: Scripts para onboarding y despliegue
```

---

## 🧩 Funcionalidades principales

- 🔍 Descubrimiento automático de recursos por proveedor
- 🗂 Visualización por tipo (infraestructura, red, usuarios…)
- 🛡 Seguimiento de cambios (create/update/delete con auditoría)
- 🧠 Validación de cumplimiento (reglas personalizables: ENS, OWASP…)
- 📥 Panel de administración para gestionar conexiones
- 📤 Exportación de diagramas e inventario
- 🔐 Login visual con JWT y roles (admin, viewer)
- 🛠 API REST con Swagger + pruebas Postman
- ⚙️ Scripts + Makefile + despliegue rápido
- 🤖 Asistente CMDB con IA (OpenAI / AWS Bedrock)
- 🔗 Blockchain privada para auditoría sin gas (Ganache)
- 🔐 Panel visual de eventos registrados en blockchain
- 👁️‍🗨️ Mapa visual IAM de roles/usuarios y permisos
- 📡 Dashboard de monitorización: latencia, errores, disponibilidad

---

## 🤖 Asistente CMDB (IA integrada)

Consulta tu infraestructura en lenguaje natural. Compatible con:

- OpenAI GPT-4
- AWS Bedrock (Claude v2)

Ejemplos:
- ¿Qué instancias EC2 tengo sin tags?
- ¿Quién tiene acceso a la base de datos de producción?
- ¿Qué recursos incumplen las políticas ENS?

---

## 🚀 Comandos útiles

```bash
make dev             # Frontend + backend + Mongo
make clean           # Limpia contenedores y volúmenes
./scripts/deploy-all.sh  # Despliegue completo
```

---

## 🔐 Seguridad

- JWT / API Key para autenticación
- Roles y permisos por tipo de usuario
- Blockchain privada para logs inmutables

---

## 📈 Roadmap

- Soporte completo para GCP, Oracle
- PostgreSQL como BBDD adicional
- Multitenancy por organización
- Integración con Jira, ServiceNow
- IAM visual + trazabilidad
- Auto-discovery continuo

---

## 🔭 Futuros desarrollos

- 🧠 Recomendaciones de hardening y buenas prácticas
- 🛡️ Validación automática de seguridad (OWASP, ENS, NIS2)
- 📊 Visualización de métricas desde Prometheus, Grafana
- 📡 Integración con OpenShift, Kubernetes, pods
- 🧩 Soporte para LDAP, Okta, Active Directory
- 🧪 Testing automático + cobertura
- 📘 Documentación Swagger + Manual de usuario (PDF)

---

## 📚 Extras incluidos

- ✔️ Postman Collection
- ✔️ Documentación técnica paso a paso
- ✔️ Contrato inteligente + ABI + script de despliegue
- ✔️ Docker + Docker Compose + Makefile

---


---

© 2025 CloudView – Todos los derechos reservados.