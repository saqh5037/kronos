#!/usr/bin/env bash
# Kronos — Setup inicial del servidor Ubuntu (idempotente)
# Ejecutar UNA VEZ después de provisionar la EC2.
#
# Uso:
#   chmod +x deploy/setup-server.sh
#   sudo ./deploy/setup-server.sh [--with-postgres]
#
# Flags:
#   --with-postgres   Instala Postgres 16 self-hosted (saltar si usás RDS)

set -euo pipefail

WITH_POSTGRES=0
for arg in "$@"; do
  case "$arg" in
    --with-postgres) WITH_POSTGRES=1 ;;
    *) echo "Flag desconocida: $arg"; exit 1 ;;
  esac
done

if [ "$EUID" -ne 0 ]; then
  echo "Correr como root: sudo $0"
  exit 1
fi

SUDO_USER_NAME="${SUDO_USER:-ubuntu}"

echo "▶ 1. Sistema base"
apt-get update -y
apt-get upgrade -y
apt-get install -y build-essential curl git ufw

echo "▶ 2. Firewall"
ufw default deny incoming || true
ufw default allow outgoing || true
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
yes | ufw enable || true

echo "▶ 3. Node 20 LTS + pnpm + PM2"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm install -g pnpm pm2

# Setup PM2 startup para el user (no root)
sudo -u "$SUDO_USER_NAME" pm2 startup systemd -u "$SUDO_USER_NAME" --hp "/home/$SUDO_USER_NAME" || true

if [ "$WITH_POSTGRES" -eq 1 ]; then
  echo "▶ 4. Postgres 16"
  apt-get install -y postgresql postgresql-contrib

  read -r -p "Password fuerte para usuario 'kronos' de Postgres: " PG_PASS
  sudo -u postgres psql <<EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='kronos') THEN
    CREATE USER kronos WITH PASSWORD '${PG_PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE kronos OWNER kronos'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='kronos')\gexec
EOF

  echo "▶ 4b. Backup diario en /var/backups/postgres (retención 14d)"
  mkdir -p /var/backups/postgres
  chown postgres:postgres /var/backups/postgres
  cat > /etc/cron.d/kronos-pg-backup <<'CRON'
0 3 * * * postgres pg_dump -Fc kronos > /var/backups/postgres/kronos_$(date +\%F).dump && find /var/backups/postgres -mtime +14 -delete
CRON

  echo "ℹ DATABASE_URL recomendado: postgresql://kronos:${PG_PASS}@127.0.0.1:5432/kronos"
fi

echo "▶ 5. Nginx + Certbot"
apt-get install -y nginx certbot python3-certbot-nginx
systemctl enable nginx

echo "▶ 6. Logs app"
mkdir -p /var/log/kronos
chown "$SUDO_USER_NAME:$SUDO_USER_NAME" /var/log/kronos

echo "▶ 7. Cloning repo placeholder"
echo "  Ahora cloná el repo como '$SUDO_USER_NAME':"
echo "    cd /home/$SUDO_USER_NAME"
echo "    git clone https://github.com/<tu-user>/kronos.git"
echo "    cd kronos && pnpm install --frozen-lockfile"
echo "    cp .env.production.example .env && nano .env  # rellenar"
echo "    chmod 600 .env"
echo "    pnpm prisma generate && pnpm prisma migrate deploy"
echo "    pnpm build && pm2 start ecosystem.config.cjs && pm2 save"

echo "✓ Setup base listo."
