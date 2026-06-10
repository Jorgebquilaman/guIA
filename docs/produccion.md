# Guía de Puesta en Producción

Guía paso a paso para desplegar GuIA Documental en un servidor de producción.

---

## Requisitos del Servidor

| Recurso | Mínimo | Recomendado |
|---|---|---|
| SO | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS |
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disco | 20 GB | 50 GB (depende del volumen de documentos) |
| Dominio | — | guia.iupa.edu.ar (o similar con SSL) |

### Software requerido

- .NET 9 SDK o Runtime
- Node.js 20 LTS+
- PostgreSQL 16+
- Nginx (o cualquier reverse proxy)
- Certbot / Let's Encrypt (para SSL)

---

## 1. Instalación de dependencias

```bash
# PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

# .NET 9
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
chmod +x dotnet-install.sh
sudo ./dotnet-install.sh --channel 9.0 --install-dir /usr/share/dotnet
sudo ln -sf /usr/share/dotnet/dotnet /usr/local/bin/dotnet

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Nginx
sudo apt install -y nginx

# Certbot (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

---

## 2. Configurar la base de datos

```bash
sudo -u postgres psql
```

```sql
CREATE USER guia WITH PASSWORD 'guia123';
CREATE DATABASE guia OWNER guia;
GRANT ALL PRIVILEGES ON DATABASE guia TO guia;
\q
```

> Cambiar la contraseña por una segura en producción.

---

## 3. Clonar y configurar el proyecto

```bash
# Crear usuario del sistema
sudo useradd -m -s /bin/bash guia

# Clonar repositorio
sudo mkdir -p /opt/guia
sudo git clone https://github.com/Jorgebquilaman/guIA.git /opt/guia
sudo chown -R guia:guia /opt/guia
```

### Configurar appsettings.Production.json

```bash
sudo -u guia nano /opt/guia/src/API/appsettings.Production.json
```

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=guia;Username=guia;Password=GUIA_SEGURA_123"
  },
  "Jwt": {
    "Secret": "GENERAR_UNA_CLAVE_ALEATORIA_DE_64_CARACTERES_MINIMO",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpiryDays": 7
  },
  "DeepSeek": {
    "ApiKey": "sk-deepseek-real-key"
  },
  "Anthropic": {
    "ApiKey": "sk-ant-real-key"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Warning"
    }
  },
  "Cors": {
    "Origins": [ "https://guia.iupa.edu.ar" ]
  },
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://localhost:5050"
      }
    }
  }
}
```

> **IMPORTANTE**: La secret key de JWT debe ser única y de al menos 64 caracteres. Generar con:
> ```bash
> openssl rand -base64 64
> ```

---

## 4. Compilar y publicar el backend

```bash
sudo -u guia bash -c "
  cd /opt/guia
  dotnet publish src/API -c Release -o /opt/guia/publish
"
```

---

## 5. Configurar el frontend

```bash
sudo -u guia bash -c "
  cd /opt/guia/frontend
  npm ci
  npm run build
"
```

El build generará los archivos estáticos en `/opt/guia/frontend/dist/`.

---

## 6. Configurar Systemd (backend)

Crear el servicio:

```bash
sudo nano /etc/systemd/system/guia-api.service
```

```ini
[Unit]
Description=GuIA Documental API
After=network.target postgresql.service

[Service]
Type=simple
User=guia
WorkingDirectory=/opt/guia/publish
ExecStart=/usr/local/bin/dotnet GuIA.API.dll
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5050
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Habilitar e iniciar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now guia-api
sudo systemctl status guia-api
```

Ver logs:

```bash
sudo journalctl -u guia-api -f
```

---

## 7. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/guia
```

```nginx
server {
    listen 80;
    server_name guia.iupa.edu.ar;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name guia.iupa.edu.ar;

    ssl_certificate /etc/letsencrypt/live/guia.iupa.edu.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/guia.iupa.edu.ar/privkey.pem;

    root /opt/guia/frontend/dist;
    index index.html;

    # Archivos estáticos del frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy inverso hacia la API
    location /api/ {
        proxy_pass http://localhost:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5050/health;
    }

    # Logs
    access_log /var/log/nginx/guia-access.log;
    error_log /var/log/nginx/guia-error.log;
}
```

Activar el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/guia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Configurar SSL con Let's Encrypt

```bash
sudo certbot --nginx -d guia.iupa.edu.ar
```

---

## 8. Almacenamiento de archivos

Los documentos subidos se guardan en `/opt/guia/publish/storage/files/` por defecto.

Es recomendable:
- Crear un volumen separado o usar un bucket S3 compatible
- Hacer backups periódicos del directorio `storage/files/`

Para cambiar la ruta, modificar `FileStorage:BasePath` en `appsettings.Production.json`.

---

## 9. Backups

### Script de backup automático

Crear `/opt/guia/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/guia/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="guia"
DB_USER="guia"

mkdir -p "$BACKUP_DIR"

# Backup de base de datos
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup de archivos
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /opt/guia/publish/storage/files

# Eliminar backups viejos (más de 30 días)
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "files_*.tar.gz" -mtime +30 -delete

echo "Backup completado: $DATE"
```

Luego agregar al crontab:

```bash
sudo crontab -e
```

```
0 3 * * * /opt/guia/scripts/backup.sh
```

---

## 10. Monitoreo

### Health check

```bash
curl https://guia.iupa.edu.ar/health
# Debería responder: Healthy
```

### Logs de la aplicación

```bash
# Backend
sudo journalctl -u guia-api -f

# Nginx
sudo tail -f /var/log/nginx/guia-access.log
sudo tail -f /var/log/nginx/guia-error.log
```

### Uptime

Se puede agregar un monitor externo (UptimeRobot, BetterUptime) que verifique el health endpoint cada 5 minutos.

---

## 11. Actualización

```bash
# 1. Detener el servicio
sudo systemctl stop guia-api

# 2. Backup preventivo
sudo /opt/guia/scripts/backup.sh

# 3. Actualizar código
cd /opt/guia
sudo git pull origin master

# 4. Publicar backend
sudo -u guia dotnet publish src/API -c Release -o /opt/guia/publish

# 5. Reconstruir frontend
sudo -u guia bash -c "cd /opt/guia/frontend && npm ci && npm run build"

# 6. Iniciar servicio
sudo systemctl start guia-api
```

> Si hay migraciones de base de datos nuevas, se aplican automáticamente al iniciar la API (`EnsureCreated`).

---

## 12. Seguridad

- Cambiar la contraseña por defecto de PostgreSQL
- Usar una JWT Secret robusta (64+ caracteres aleatorios)
- Configurar CORS solo con los orígenes necesarios
- No exponer Swagger en producción (`ASPNETCORE_ENVIRONMENT=Production`)
- Mantener actualizado el sistema operativo
- Firewall: permitir solo puertos 80 y 443 desde internet
- Las API Keys de IA (DeepSeek, Anthropic) deben mantenerse secretas

---

## 13. Resolución de problemas

| Problema | Causa posible | Solución |
|---|---|---|
| 502 Bad Gateway | API caída o no responde | `sudo systemctl restart guia-api` |
| 404 en rutas | Frontend no sirve /index.html | Verificar `try_files` en Nginx |
| Documentos no se ven | Permisos en storage/ | `sudo chown -R guia:guia /opt/guia/publish/storage` |
| Error de conexión DB | PostgreSQL no inició | `sudo systemctl restart postgresql` |
| No envía emails | SMTP mal configurado | Revisar configuración en admin > SMTP |
