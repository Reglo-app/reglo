.PHONY: help up down restart build ps logs test test-api test-web lint lint-api lint-web format-web api-shell web-shell

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

build: ## Rebuild the images
	docker compose up -d --build

ps: ## List running services
	docker compose ps

logs: ## Follow the logs
	docker compose logs -f

test: test-api test-web ## Run all tests

test-api: ## Run the API tests
	docker compose exec -e APP_ENV=test api vendor/bin/phpunit

test-web: ## Run the web unit tests
	docker compose exec web npm test

lint: lint-api lint-web ## Run all linters

lint-api: ## Run PHP-CS-Fixer and PHPStan
	docker compose exec api vendor/bin/php-cs-fixer fix --dry-run --diff
	docker compose exec api vendor/bin/phpstan analyse

lint-web: ## Run Prettier and ESLint
	docker compose exec web npm run format:check
	docker compose exec web npm run lint

format-web: ## Format the web code with Prettier
	docker compose exec web npm run format

api-shell: ## Open a shell in the API container
	docker compose exec api bash

web-shell: ## Open a shell in the web container
	docker compose exec web sh