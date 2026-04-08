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

- `docker-init/mariadb/init/002-authz-approval-schema.sql`
  - Creates the application tables for organizations, users, user groups, permissions, approvals, locks, and audit events.
  - Seeds baseline permission metadata.

## Usage

- Start the database with `docker compose up -d` or `./dev-resource-start.sh`.
- Stop it and remove the Compose-managed data volume with `docker compose down --volumes --remove-orphans` or `./dev-resource-shutdown.sh`.
- Re-run initialization from scratch with `./dev-resource-shutdown.sh` and then `./dev-resource-start.sh`.

## Notes

- MariaDB init scripts only run when the data volume is empty.
- The container root password is defined in `docker-compose.yml` for local development.