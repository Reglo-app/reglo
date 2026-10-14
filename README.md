# REGLO

CSR and QHSE compliance platform.

## Repository structure

- `api/`: backend (Symfony + API Platform)
- `web/`: frontend (Next.js)
- `data-service/`: data service (Python / FastAPI)

## Requirements

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- `make` (optional, shortcuts for the Docker commands)
- Node.js 22 (only to run the Playwright end-to-end tests on your machine)

On Windows, use Git Bash.

## Getting started

```
git clone git@github.com:reglo-app/reglo.git
cd reglo
cp .env.example .env
make up
```

The first start takes a few minutes (dependencies are installed in the containers).

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:8000 (health check: `/health`) |
| Mailpit (test emails) | http://localhost:8025 |
| PostgreSQL | localhost:5432 |

Without `make`, use `docker compose up -d` instead.

## Common commands

Run `make help` to list everything.

| Command | Description |
|---|---|
| `make up` / `make down` | Start / stop all services |
| `make logs` | Follow the logs |
| `make test` | Run the API and web unit tests |
| `make lint` | Run PHP-CS-Fixer, PHPStan, Prettier and ESLint |
| `make api-shell` / `make web-shell` | Open a shell in a container |

End-to-end tests (Playwright) run on your machine:

```
cd web
npm ci
npx playwright install chromium
npm run test:e2e
```

## Editor setup (VS Code)

Install the "**EditorConfig**" VS Code extension. It applies the project's indentation (4 spaces) automatically.

## Contributing

Branches, pull requests and commit convention are described in [CONTRIBUTING.md](CONTRIBUTING.md).

## Continuous integration

Every pull request runs the `API checks` and `Web checks` workflows. Both must pass before merging.
