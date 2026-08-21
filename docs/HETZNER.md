# Hetzner deployment

The hosted AULOS interface remains on Sites. Hetzner runs the persistent ingestion API and PostgreSQL database.

## First deployment

From the repository on the server:

```bash
cp .env.example .env
chmod 600 .env
openssl rand -hex 32
openssl rand -hex 32
```

Put the first generated value after `POSTGRES_PASSWORD=` and the second after `ADMIN_TOKEN=` in `.env`. Do not commit or share this file.

Start the stack:

```bash
chmod +x scripts/hetzner-deploy.sh
./scripts/hetzner-deploy.sh
```

Check the public health endpoint:

```bash
curl http://127.0.0.1/health
docker compose logs --tail=100 api
```

The API initially listens on HTTP port 80. Keep PostgreSQL private. Once a domain points to the server, replace `:80` in `Caddyfile` with the API hostname; Caddy will then provision and renew HTTPS automatically.

After the health endpoint is live, configure the hosted frontend runtime variable `AULOS_BACKEND_URL` with the backend origin. The frontend will use stored PostgreSQL records when the backend is healthy and automatically fall back to direct source retrieval when it is unavailable.

## Updates

```bash
git pull --ff-only
./scripts/hetzner-deploy.sh
```

## Useful operations

```bash
docker compose ps
docker compose logs -f api
docker compose restart api
docker compose exec postgres pg_dump -U aulos -d aulos > aulos-backup.sql
```

Do not expose port 5432 in Docker or the Hetzner firewall.
