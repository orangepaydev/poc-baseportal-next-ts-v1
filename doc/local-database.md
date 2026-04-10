# Local Database

## Purpose

This project includes local MariaDB and SMTP development services via Docker Compose.

## Files

- `.env`
  - Stores the app's default database connection settings for local development.

- `docker-compose.yml`
  - Starts a MariaDB container on port `3306`.
  - Starts an SMTP test container on port `2525` with a web inbox on port `3001`.
  - Uses fixed local-development MariaDB container settings.
  - Mounts initialization assets from `docker-init/mariadb/init`.

- `docker-init/mariadb/init/001-portaldb-create.sql`
  - Runs on first database bootstrap.
  - Ensures the `portaldb` database exists with the expected character set and collation.
  - Creates the `dbuser` user with password `dbpass123` and grants full access to `portaldb`.

- `docker-init/mariadb/init/002-portaldb-schema.sql`
  - Creates the application tables for organizations, users, user groups, permissions, approvals, locks, and audit events.
  - Seeds baseline permission metadata.

- `docker-init/mariadb/init/003-portaldb-records.sql`
  - Seeds the `owner` organization, initial users, user groups, memberships, and menu access grants.

## Usage

- Start the local services with `docker compose up -d` or `./dev-resource-start.sh`.
- Stop them and remove the Compose-managed data volume with `docker compose down --volumes --remove-orphans` or `./dev-resource-shutdown.sh`.
- Re-run initialization from scratch with `./dev-resource-shutdown.sh` and then `./dev-resource-start.sh`.

## SMTP Service

- The SMTP test service uses the `smtpdev` Compose service backed by the `rnwood/smtp4dev` image.
- Send application email to `localhost:2525` during local development.
- The root `.env.example` file includes matching SMTP settings for host-based local development.
- If the app later runs inside the same Compose network, use `smtpdev:25` instead of the host-mapped port.
- Open `http://localhost:3001` to inspect captured messages in the web UI.

## Notes

- MariaDB init scripts only run when the data volume is empty.
- The MariaDB container credentials are hardcoded in `docker-compose.yml` for local development.
- The app's database connection settings are defined in the repository root `.env` file.
