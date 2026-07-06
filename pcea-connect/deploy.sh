#!/bin/bash
# deploy.sh – run on Hetzner cloud server

# 1. Update system & install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx

# 2. Clone repository (or copy files via scp)
# git clone https://github.com/your-org/pcea-connect.git
# cd pcea-connect

# 3. Create .env file with production secrets
echo "DB_PASSWORD=your_strong_password" > .env
echo "JWT_SECRET=your_256_bit_secret" >> .env
echo "MPESA_CONSUMER_KEY=..." >> .env
echo "MPESA_CONSUMER_SECRET=..." >> .env
echo "MPESA_PASSKEY=..." >> .env
echo "MPESA_SHORTCODE=..." >> .env
echo "MPESA_CALLBACK_URL=https://pcea-connect.com/api/giving/mpesa-callback" >> .env

# 4. Start everything
sudo docker-compose -f docker-compose.prod.yml up -d

# 5. Obtain SSL certificate (after DNS points to this server)
# sudo certbot --nginx -d pcea-connect.com -d www.pcea-connect.com
