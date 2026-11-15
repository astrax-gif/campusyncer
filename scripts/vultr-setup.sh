#!/bin/bash
# ─────────────────────────────────────────────────────────────
# UE Portal — Vultr Server Setup
# Run this ONCE on your fresh Vultr VPS as root.
#
# Usage:
#   chmod +x scripts/vultr-setup.sh
#   bash scripts/vultr-setup.sh
#
# Or run remotely:
#   ssh root@YOUR_VULTR_IP "bash <(curl -s https://raw.githubusercontent.com/astrax-gif/Ue-portal/main/scripts/vultr-setup.sh)"
# ─────────────────────────────────────────────────────────────

set -e   # exit on any error
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[1/6] Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "${BLUE}[2/6] Installing Nginx...${NC}"
apt install -y nginx
systemctl enable nginx
systemctl start nginx

echo -e "${BLUE}[3/6] Creating web root...${NC}"
mkdir -p /var/www/ue-portal
chown -R www-data:www-data /var/www/ue-portal
chmod -R 755 /var/www/ue-portal

# Put a placeholder index.html so Nginx doesn't 404 before first deploy
cat > /var/www/ue-portal/index.html <<'HTML'
<!doctype html>
<html><head><title>UE Portal — Deploying…</title></head>
<body style="font-family:sans-serif;text-align:center;padding:4rem">
  <h1>🚀 UE Portal</h1>
  <p>First deployment in progress. Check back in a minute.</p>
</body></html>
HTML

echo -e "${BLUE}[4/6] Configuring Nginx...${NC}"
# Copy the config (assumes you cloned the repo — otherwise paste manually)
if [ -f "nginx/ue-portal.conf" ]; then
    cp nginx/ue-portal.conf /etc/nginx/sites-available/ue-portal
else
    echo "⚠  nginx/ue-portal.conf not found — create it manually in /etc/nginx/sites-available/ue-portal"
fi

# Enable the site and disable the default
ln -sf /etc/nginx/sites-available/ue-portal /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t   # test config
systemctl reload nginx

echo -e "${BLUE}[5/6] Allowing deploy user to reload Nginx without password...${NC}"
# GitHub Actions SSH user needs to reload nginx — allow it without sudo password
DEPLOY_USER="${SUDO_USER:-$USER}"
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx" \
    >> /etc/sudoers.d/nginx-reload
chmod 440 /etc/sudoers.d/nginx-reload

echo -e "${BLUE}[6/6] Setting up firewall (UFW)...${NC}"
apt install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status

echo ""
echo -e "${GREEN}✅ Server setup complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Next steps:"
echo ""
echo " 1. Add these secrets to your GitHub repo:"
echo "    Settings → Secrets → Actions → New secret"
echo ""
echo "    VULTR_HOST        → $(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')"
echo "    VULTR_USER        → $DEPLOY_USER"
echo "    VULTR_SSH_KEY     → your private SSH key (cat ~/.ssh/id_rsa)"
echo "    VITE_SUPABASE_URL → https://xxxx.supabase.co"
echo "    VITE_SUPABASE_ANON_KEY → your-anon-key"
echo ""
echo " 2. Edit /etc/nginx/sites-available/ue-portal"
echo "    and replace 'your-domain.com' with your real domain or IP."
echo ""
echo " 3. Push to main — GitHub Actions will auto-deploy."
echo ""
echo " 4. (Optional) Add HTTPS:"
echo "    apt install certbot python3-certbot-nginx -y"
echo "    certbot --nginx -d your-domain.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
