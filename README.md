
# CloudView CMDB" – Inventario visual multicloud con control tota

Proyecto para inventario visual de recursos cloud (AWS, Azure, IBM Cloud) con backend en Node.js + MongoDB y frontend en React + React Flow.

# 🚧 EN CONSTRUCCION 🚧


```
                      \\\\\\\
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

- Visualización de recursos multicloud con logos
- Diagramas interactivos con tooltips y relaciones
- Filtros por tipo y proveedor
- Exportación de diagramas a PNG y JSON

---

## 🔒 Seguridad (siguiente paso recomendado)

- Middleware de autenticación (JWT o API Key)
- Logs de auditoría
- Roles de acceso por tipo de usuario

---

## 📈 Roadmap

- Soporte para más clouds (GCP, Oracle)
- BBDD relacional opcional (PostgreSQL)
- Multitenancy por organización
- UI Admin para configuración de conexiones

