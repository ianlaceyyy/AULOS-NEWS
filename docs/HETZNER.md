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

The API is exposed at `https://62-238-119-174.sslip.io`. The sslip.io hostname resolves directly to the server IP without requiring a purchased domain, and Caddy provisions and renews HTTPS automatically. Keep PostgreSQL private and allow inbound TCP ports 80 and 443 (plus UDP 443 for HTTP/3) in the Hetzner firewall.

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
