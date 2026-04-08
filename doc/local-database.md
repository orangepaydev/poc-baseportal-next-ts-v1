# Local Database

## Purpose

This project includes a local MariaDB setup for development via Docker Compose.

## Files

- `docker-compose.yml`
  - Starts a MariaDB container on port `3306`.
  - Mounts initialization assets from `docker-init/mariadb/init`.

- `docker-init/mariadb/init/001-create-portaldb.sql`
  - Runs on first database bootstrap.
  - Creates the `portaldb` database.
  - Creates the `dbuser` user with password `dbpass123`.

## Usage

- Start the database with `docker compose up -d`.
- Stop it with `docker compose down`.
- Re-run initialization from scratch with `docker compose down -v` and then `docker compose up -d`.

## Notes

- MariaDB init scripts only run when the data volume is empty.
- The container root password is defined in `docker-compose.yml` for local development.