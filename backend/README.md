# 📦 CloudView CMDB - Backend

Este es el backend completo de CloudView CMDB con soporte para:

- Gestión de conexiones multicloud
- Descubrimiento automático de recursos (AWS, Azure, GCP, IBM)
- Sincronización con tracking de cambios
- Validación de cumplimiento (Compliance Checker)

---

## 🚀 Despliegue con Docker

```bash
docker build -t cloudview-backend .
docker run -p 3000:3000 --network host cloudview-backend
```

Asegúrate de tener MongoDB escuchando en `localhost:27017`.

---

## 🔧 Variables necesarias

Ninguna por defecto. Se conecta a Mongo local por:
```
mongodb://localhost:27017/cmdb
```

---

## 📁 Estructura esperada

```
/backend
  ├── server.js
  ├── complianceRules.json
  └── discover/
        ├── aws.js
        ├── azure.js
        ├── gcp.js
        └── ibm.js
```

---

## 🔗 Endpoints útiles

- `GET /api/connections`
- `POST /api/connections`
- `POST /api/discover/all`
- `POST /api/syncResources`
- `POST /api/compliance/check`

---

Para pruebas con Postman, puedes usar los ejemplos del frontend o el archivo Postman Collection disponible.