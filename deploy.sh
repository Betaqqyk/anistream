#!/bin/bash
# ==============================================
#  Movie Website - VPS Deployment Script
#  สำหรับ HostAtom Cloud VPS (Ubuntu 22.04/24.04)
# ==============================================
#
#  วิธีใช้:
#  1. อัพโหลดโปรเจกต์ขึ้น VPS ก่อน (ผ่าน Git หรือ SCP)
#  2. SSH เข้า VPS แล้วรันคำสั่ง:
#     chmod +x deploy.sh
#     sudo ./deploy.sh yourdomain.com
#
# ==============================================

set -e

DOMAIN=${1:-"example.com"}
APP_DIR="/var/www/movie-website"
APP_NAME="movie-website"

echo "====================================="
echo "  🚀 Deploying Movie Website"
echo "  Domain: $DOMAIN"
echo "====================================="

# -------------------------------------------
# 1. Update system
# -------------------------------------------
echo ""
echo "📦 [1/7] Updating system packages..."
apt update && apt upgrade -y

# -------------------------------------------
# 2. Install Node.js 20 LTS
# -------------------------------------------
echo ""
echo "📦 [2/7] Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "   Node.js $(node -v) installed"
echo "   npm $(npm -v) installed"

# -------------------------------------------
# 3. Install PM2
# -------------------------------------------
echo ""
echo "📦 [3/7] Installing PM2..."
npm install -g pm2

# -------------------------------------------
# 4. Setup application
# -------------------------------------------
echo ""
echo "📦 [4/7] Setting up application..."
mkdir -p $APP_DIR

# Copy files if running from project directory
if [ -f "server.js" ]; then
    echo "   Copying project files..."
    rsync -av --exclude='node_modules' --exclude='.git' ./ $APP_DIR/
fi

cd $APP_DIR
npm install --production
echo "   Dependencies installed"

# Seed database if no data exists
if [ ! -f "database/anime.db" ]; then
    echo "   Seeding database..."
    npm run seed
fi

# -------------------------------------------
# 5. Start with PM2
# -------------------------------------------
echo ""
echo "📦 [5/7] Starting application with PM2..."
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 startup
pm2 save
echo "   App running on port 3000"

# -------------------------------------------
# 6. Setup Nginx reverse proxy
# -------------------------------------------
echo ""
echo "📦 [6/7] Configuring Nginx..."
apt install -y nginx

cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Max upload size (for admin uploads)
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo "   Nginx configured for $DOMAIN"

# -------------------------------------------
# 7. SSL Certificate (Let's Encrypt)
# -------------------------------------------
echo ""
echo "📦 [7/7] Setting up SSL certificate..."
apt install -y certbot python3-certbot-nginx

echo ""
echo "====================================="
echo "  ✅ Deployment Complete!"
echo "====================================="
echo ""
echo "  🌐 Website: http://$DOMAIN"
echo "  📊 PM2 Status: pm2 status"
echo "  📋 App Logs:   pm2 logs $APP_NAME"
echo ""
echo "  🔒 To enable HTTPS, make sure your domain"
echo "     DNS is pointed to this server, then run:"
echo ""
echo "     certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "====================================="
