# 📦 Makefile para CloudView CMDB

# 🚀 Levanta frontend + backend + MongoDB
dev:
	docker-compose up --build

# 🧹 Elimina contenedores y volúmenes
clean:
	docker-compose down -v

# 🐳 Backend solo
backend:
	docker-compose up --build backend

# 🖼 Frontend solo
frontend:
	docker-compose up --build frontend

# 🔁 Reconstruye todo sin cache
rebuild:
	docker-compose build --no-cache

# 📥 Instala dependencias backend localmente
install-backend:
	cd backend && npm install

# 📥 Instala dependencias frontend localmente
install-frontend:
	cd frontend && npm install

# 🧪 Ejecutar tests (pendiente)
test:
	@echo "Tests no implementados aún."

# 📄 Mostrar ayuda
help:
	@echo "make dev            # Levanta todo con Docker"
	@echo "make clean          # Elimina contenedores y volúmenes"
	@echo "make backend        # Solo backend"
	@echo "make frontend       # Solo frontend"
	@echo "make rebuild        # Reconstrucción limpia"
	@echo "make install-backend  # Instala dependencias backend"
	@echo "make install-frontend # Instala dependencias frontend"