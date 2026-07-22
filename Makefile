.PHONY: dev-db dev-backend dev-desktop migrate studio build-exe deploy

dev-db:
	docker compose -f docker-compose.dev.yml up -d

dev-db-stop:
	docker compose -f docker-compose.dev.yml down

dev-backend:
	cd apps/cloud-backend && npm run dev

dev-desktop:
	cd apps/desktop && npm run dev

migrate:
	cd apps/cloud-backend && npx prisma migrate dev

studio:
	cd apps/cloud-backend && npx prisma studio

build-exe:
	cd apps/desktop && npm run electron:build

deploy:
	git push origin main

logs:
	docker compose logs -f --tail=100

up:
	docker compose up -d

down:
	docker compose down

shell-db:
	docker compose exec postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

shell-backend:
	docker compose exec backend sh
