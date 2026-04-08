#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

mkdir -p \
  storage/framework/cache \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs \
  bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache

if [[ -z "${APP_KEY:-}" ]]; then
  echo "APP_KEY is required for production startup." >&2
  exit 1
fi

php artisan package:discover --ansi
php artisan config:clear --ansi
php artisan route:clear --ansi
php artisan cache:clear --ansi
php artisan migrate --force --ansi

exec "$@"
