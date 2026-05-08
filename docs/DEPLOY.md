# Kronos — Deploy a producción (AWS EC2 Ubuntu + Postgres)

Stack: Ubuntu 24.04 LTS · Node 20 LTS · pnpm · PM2 · Nginx · Postgres 16 · Let's Encrypt

Dominio: `kronos-fit.com` (apex redirect → `www.kronos-fit.com`)

---

## 0 · Pre-requisitos del lado AWS (humano)

- [ ] EC2 Ubuntu 24.04 LTS lanzada (recomendado: t3.small / t3.medium con 2GB+ RAM, 20GB+ disk)
- [ ] Security Group con: 22 (SSH desde tu IP), 80 (HTTP), 443 (HTTPS)
- [ ] IP elástica asignada a la EC2
- [ ] Postgres listo:
  - **RDS**: instancia Postgres 16, publicly accessible solo si la EC2 lo necesita (mejor private + same VPC), DB inicializada `kronos`, user `kronos`, password fuerte
  - **Self-hosted**: se instala en los pasos `1.4` de abajo
- [ ] DNS de `kronos-fit.com`:
  - `A @` → IP elástica EC2
  - `A www` → IP elástica EC2
  - (Después, para subdominios: `A *` → IP elástica)
- [ ] Cuenta Resend con dominio `kronos-fit.com` verificado (DKIM/SPF apuntando a Resend)
- [ ] API key de Resend generada

## 1 · Setup inicial del servidor (una sola vez)

### 1.1 Conexión + sistema base

```bash
ssh -i ~/.ssh/kronos.pem ubuntu@<IP_EC2>
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl git ufw
```

### 1.2 Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 1.3 Node 20 LTS + pnpm + PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu  # ejecutar el comando que devuelve
```

### 1.4 Postgres self-hosted (saltar si usás RDS)

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql <<EOF
CREATE USER kronos WITH PASSWORD 'CAMBIAR_POR_PASS_FUERTE';
CREATE DATABASE kronos OWNER kronos;
\q
EOF
# Backups diarios automáticos
sudo mkdir -p /var/backups/postgres
echo "0 3 * * * postgres pg_dump -Fc kronos > /var/backups/postgres/kronos_\$(date +\\%F).dump && find /var/backups/postgres -mtime +14 -delete" | sudo tee /etc/cron.d/kronos-pg-backup
```

### 1.5 Nginx + Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
```

### 1.6 Logs

```bash
sudo mkdir -p /var/log/kronos
sudo chown ubuntu:ubuntu /var/log/kronos
```

## 2 · Primer despliegue de la app

### 2.1 Clonar repo + instalar deps

```bash
cd /home/ubuntu
git clone https://github.com/<user>/kronos.git
cd kronos
pnpm install --frozen-lockfile
```

### 2.2 Configurar `.env`

```bash
cp .env.production.example .env
nano .env  # rellenar TODOS los valores marcados ""
chmod 600 .env
```

Generar secrets:

```bash
openssl rand -base64 32   # → NEXTAUTH_SECRET
openssl rand -base64 32   # → CRON_SECRET
```

### 2.3 Migrar BD + generar Prisma client

```bash
pnpm prisma generate
pnpm prisma migrate deploy   # aplica prisma/migrations/0_init/
```

> **Nota**: si la BD ya tenía data (migración desde otra), usar:
> `pnpm prisma migrate resolve --applied 0_init` para marcar la migration sin re-aplicarla.

### 2.4 Build + arranque con PM2

```bash
pnpm build
pm2 start ecosystem.config.cjs
pm2 save
```

Verificar:

```bash
pm2 status
pm2 logs kronos --lines 50
curl http://127.0.0.1:3000/api/health
```

### 2.5 Nginx + TLS

```bash
sudo cp deploy/nginx/kronos.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/kronos.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# Provisionar TLS (Let's Encrypt)
sudo mkdir -p /var/www/certbot
sudo certbot --nginx -d kronos-fit.com -d www.kronos-fit.com --non-interactive --agree-tos -m hola@kronos-fit.com

sudo systemctl reload nginx
```

### 2.6 Smoke test desde fuera

```bash
curl -I https://www.kronos-fit.com/
curl https://www.kronos-fit.com/api/health
```

Abrí en el browser y verificá:

- [ ] Landing carga sin errores de consola
- [ ] HTTPS válido (cerradura verde)
- [ ] `/login` muestra el form
- [ ] Magic link llega al email (Resend funcional)
- [ ] No aparece dev login (porque `NEXT_PUBLIC_DEV_LOGIN=0`)

## 3 · Deploys subsiguientes

```bash
ssh ubuntu@<IP_EC2>
cd /home/ubuntu/kronos
git pull
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm build
pm2 reload kronos
pm2 logs kronos --lines 30
```

> Para automatizar esto en CI/CD (GitHub Actions), ver `docs/DEPLOY-CI.md` (TODO).

## 4 · Crons

Vercel Cron no aplica acá — usar `crontab` del sistema:

```bash
sudo crontab -u ubuntu -e
```

Agregar (dispara a `/api/cron/*` con el `CRON_SECRET`):

```cron
*/5 * * * * curl -s -H "Authorization: Bearer ${CRON_SECRET}" https://www.kronos-fit.com/api/cron/dispatch-announcements > /dev/null
0 4 * * * curl -s -H "Authorization: Bearer ${CRON_SECRET}" https://www.kronos-fit.com/api/cron/saas-billing-lifecycle > /dev/null
0 5 * * 1 curl -s -H "Authorization: Bearer ${CRON_SECRET}" https://www.kronos-fit.com/api/cron/owner-weekly-digest > /dev/null
0 6 * * 0 curl -s -H "Authorization: Bearer ${CRON_SECRET}" https://www.kronos-fit.com/api/cron/cleanup-uploads > /dev/null
0 2 * * * curl -s -H "Authorization: Bearer ${CRON_SECRET}" https://www.kronos-fit.com/api/cron/achievements-backfill > /dev/null
```

Reemplazar `${CRON_SECRET}` con el valor real (escapado o con el secreto inline; para no filtrarlo, usar archivo con permisos 600 y `cat`).

## 5 · Backups

### Postgres self-hosted

Ya configurado en `1.4` — diario a `/var/backups/postgres`, retención 14 días.

Restore:

```bash
sudo -u postgres pg_restore -d kronos /var/backups/postgres/kronos_2026-MM-DD.dump
```

### RDS

AWS RDS hace snapshots automáticos. Configurar retention en la consola.

### Sync a S3 (opcional, recomendado)

```bash
aws s3 sync /var/backups/postgres s3://kronos-backups/postgres/ --delete
```

## 6 · Observabilidad

- **Logs app**: `pm2 logs kronos` o `tail -f /var/log/kronos/out.log`
- **Logs Nginx**: `sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log`
- **Logs Postgres** (self-hosted): `sudo tail -f /var/log/postgresql/postgresql-16-main.log`
- **Health**: `curl https://www.kronos-fit.com/api/health` debe retornar `{"status":"ok"}`

Si activás Sentry (post-deploy), agregar `NEXT_PUBLIC_SENTRY_DSN` al `.env` y reload.

## 7 · Checklist de seguridad pre-go-live

- [ ] `.env` con permisos `600`
- [ ] `NEXT_PUBLIC_DEV_LOGIN=0`
- [ ] `NEXTAUTH_SECRET` y `CRON_SECRET` generados con `openssl rand`
- [ ] Postgres con password fuerte (no `kronos_dev`)
- [ ] SSH solo con key (deshabilitar password): `PasswordAuthentication no` en `/etc/ssh/sshd_config`
- [ ] UFW habilitado, solo 22/80/443
- [ ] HTTPS funcional, HSTS activo
- [ ] Resend con DKIM/SPF en `kronos-fit.com`
- [ ] Backups corriendo (verificar después de 24h)
- [ ] PM2 startup configurado (sobrevive reboot)

## 8 · Rollback rápido

Si un deploy rompe prod:

```bash
cd /home/ubuntu/kronos
git log --oneline -10  # encontrar el commit anterior estable
git reset --hard <commit-sha-anterior>
pnpm install --frozen-lockfile
pnpm prisma migrate resolve --rolled-back <migration-id>  # si la migration introducida es problemática
pnpm build
pm2 reload kronos
```

Si la migración es destructiva (drop column, etc.), restaurar backup de Postgres antes.

## 9 · Pendientes post primer deploy

- [ ] Sprint B — subdominios `<slug>.kronos-fit.com` (ver `docs/SUBDOMAIN-PLAN.md` cuando se cree)
- [ ] CI/CD con GitHub Actions (auto-deploy en push a `main`)
- [ ] Sentry + PostHog activos
- [ ] MercadoPago en producción (si va a haber suscripciones cobradas)
- [ ] CDN delante (CloudFront para assets estáticos)
