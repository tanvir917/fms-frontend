.PHONY: build up down logs shell migrate collectstatic test clean local-backend local-frontend

# Build all services
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# View backend logs only
logs-backend:
	docker-compose logs -f backend

# View frontend logs only
logs-frontend:
	docker-compose logs -f frontend

# Access backend shell
shell:
	docker-compose exec backend python manage.py shell

# Run migrations
migrate:
	docker-compose exec backend python manage.py migrate

# Create superuser
createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

# Collect static files
collectstatic:
	docker-compose exec backend python manage.py collectstatic --noinput

# Run tests
test:
	docker-compose exec backend python manage.py test

# Clean up
clean:
	docker-compose down -v
	docker system prune -f

# Full setup (build, migrate, create superuser)
setup: build up migrate
	@echo "Setup complete! Your application should be running at:"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"

# Development mode (with live reload)
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production mode
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run backend locally (without Docker)
local-backend:
	cd backend && . venv/bin/activate && python manage.py runserver 0.0.0.0:8000

# Run frontend locally (without Docker)
local-frontend:
	cd frontend && npm start

# Run both locally
local:
	make local-backend & make local-frontend