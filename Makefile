export HOST_UID := $(shell id -u)
export HOST_GID := $(shell id -g)

APP_URL := http://localhost:3000
OPEN := $(shell command -v wslview || command -v xdg-open || command -v open || command -v explorer.exe)

.PHONY: up down build logs sh psql install reset sql typecheck
sql:
	$(if $(f),,$(error usage: make sql f=db/queries/01_nearby.sql))
	docker compose exec -T db sh -c 'psql -U $$POSTGRES_USER -d $$POSTGRES_DB -v ON_ERROR_STOP=1' < $(f)

up:
	docker compose up -d --build
	@printf 'Waiting for app'; i=0; until curl -sf -o /dev/null $(APP_URL); do \
		i=$$((i+1)); [ $$i -gt 180 ] && { echo; echo "App not ready after 3 min, check: make logs"; exit 1; }; \
		[ -n "$$(docker compose ps --status exited --status dead -q app)" ] && { echo; echo "App container stopped:"; docker compose logs --tail 20 app; exit 1; }; \
		printf .; sleep 1; done; echo
	@echo "dumpwatch running at $(APP_URL)"
	@$(if $(OPEN),$(OPEN) $(APP_URL) >/dev/null 2>&1 &,)

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

sh:
	docker compose exec app sh

psql:
	docker compose exec db sh -c 'psql -U $$POSTGRES_USER -d $$POSTGRES_DB'

install:
	docker compose exec app npm install $(pkg)
	@command -v npm >/dev/null && npm install --no-audit --no-fund || echo "npm not on host: skipped editor types"

reset:
	docker compose down -v

typecheck:
	docker compose exec app npx nuxt typecheck
