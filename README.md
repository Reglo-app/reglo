# REGLO

CSR and QHSE compliance platform.

## Repository structure

- `api/`: backend (Symfony + API Platform)
- `web/`: frontend (Next.js)
- `data-service/`: data service (Python / FastAPI)

## Git workflow

- `main`: production
- `develop`: pre-production
- `feature/US-xx-short-name`: work branches, merged into `develop` through a pull request

## Commit convention

`type: short description in English`

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `ci`