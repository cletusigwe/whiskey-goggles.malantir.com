#!/bin/bash

set -xe

mv .env.example .env
composer install --optimize-autoloader --no-dev


php artisan key:generate
php artisan migrate --seed --force

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link