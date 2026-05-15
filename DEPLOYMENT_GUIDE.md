# Stude - EC2 Deployment Guide

Complete guide for deploying the Student Coding Performance Analytics Platform on AWS EC2.

## 📋 Prerequisites

Before starting, ensure you have:
- AWS EC2 instance running (Ubuntu/Amazon Linux recommended)
- SSH access to your EC2 instance
- Domain name (optional, but recommended)
- MongoDB Atlas account with cluster set up
- Google OAuth credentials configured
- Cloudinary account for image uploads

## 🔐 EC2 Security Group Configuration

Configure your EC2 Security Group inbound rules:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS traffic |
| Custom TCP | TCP | 5005 | 0.0.0.0/0 | Application port |

## 🚀 Deployment Steps

### 1. Connect to Your EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
# or for Amazon Linux
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 2. Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
# or for Amazon Linux
sudo yum update -y
```

### 3. Install Node.js and npm

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

For Amazon Linux:
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 4. Install Git

```bash
sudo apt install -y git
# or for Amazon Linux
sudo yum install -y git
```

### 5. Clone Your Repository

```bash
# Clone your repository
git clone https://github.com/yourusername/stude.git

# Navigate to project directory
cd stude
```

### 6. Install Dependencies

```bash
# Install all dependencies (root + client)
npm install

# The postinstall script will automatically install client dependencies
```

### 7. Configure Environment Variables

```bash
# Create .env file from example
cp .env.example .env

# Edit the .env file
nano .env
```

Update the following variables in `.env`:

```env
# Server Configuration
PORT=5005
NODE_ENV=production
CLIENT_URL=http://your-ec2-ip:5005

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stude?retryWrites=true&w=majority
MONGODB_URI_ADMIN=mongodb+srv://admin_username:admin_password@cluster.mongodb.net/stude_admin?retryWrites=true&w=majority

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
GOOGLE_CALLBACK_URL=http://your-ec2-ip:5005/api/auth/google/callback

# Session Secret (generate a strong random string)
SESSION_SECRET=your_very_long_random_secret_string_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Important Notes:**
- Replace `your-ec2-ip` with your actual EC2 public IP or domain name
- Generate a strong SESSION_SECRET: `openssl rand -base64 32`
- Update Google OAuth callback URL in Google Cloud Console to match your EC2 IP
- Ensure MongoDB connection strings are correct and accessible from EC2

Save and exit: `Ctrl + O`, `Enter`, `Ctrl + X`

### 8. Build the Application

```bash
# Build both client and server
npm run build
```

This command:
- Builds the React frontend with Vite
- Bundles the Express backend with esbuild
- Outputs production-ready files to `dist/` directory

### 9. Run the Application

#### Option A: Direct Run (for testing)

```bash
npm start
```

The application will be available at: `http://your-ec2-ip:5005`

#### Option B: Using PM2 (Recommended for Production)

PM2 keeps your application running and restarts it automatically if it crashes.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application with PM2
pm2 start npm --name "stude" -- start

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command output instructions

# View application logs
pm2 logs stude

# Monitor application
pm2 monit

# Other useful PM2 commands
pm2 status          # Check status
pm2 restart stude   # Restart app
pm2 stop stude      # Stop app
pm2 delete stude    # Remove from PM2
```

### 10. Verify Deployment

Open your browser and navigate to:
```
http://your-ec2-ip:5005
```

You should see the Stude login page.

## 🔧 Post-Deployment Configuration

### Create Admin User

After deployment, create your first admin user:

```bash
# Run the make-admin script
npm run make-admin
```

Follow the prompts to enter the email address of the user you want to make an admin.

### Initialize Database

If needed, run database migrations:

```bash
# Push database schema
npm run db:push

# Run migrations
npm run db:migrate
```

## 🌐 Setting Up Domain Name (Optional)

### Using Nginx as Reverse Proxy

1. Install Nginx:
```bash
sudo apt install -y nginx
```

2. Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/stude
```

3. Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

4. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/stude /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. Update `.env`:
```env
CLIENT_URL=http://your-domain.com
GOOGLE_CALLBACK_URL=http://your-domain.com/api/auth/google/callback
```

6. Restart application:
```bash
pm2 restart stude
```

### Setting Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically configure Nginx for HTTPS
# Update .env to use https://
```

## 🔄 Updating Your Application

When you need to deploy updates:

```bash
# Navigate to project directory
cd ~/stude

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild the application
npm run build

# Restart with PM2
pm2 restart stude

# Or if running directly
# Stop the current process (Ctrl+C) and run: npm start
```

## 📊 Monitoring and Maintenance

### View Application Logs

```bash
# PM2 logs
pm2 logs stude

# System logs
sudo journalctl -u nginx -f  # Nginx logs
```

### Monitor System Resources

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# PM2 monitoring
pm2 monit
```

### Backup Database

Since you're using MongoDB Atlas, backups are handled automatically. However, you can create manual backups:

```bash
# Export database
mongodump --uri="your_mongodb_uri" --out=/path/to/backup

# Import database
mongorestore --uri="your_mongodb_uri" /path/to/backup
```

## 🐛 Troubleshooting

### Application Won't Start

1. Check logs:
```bash
pm2 logs stude --lines 100
```

2. Verify environment variables:
```bash
cat .env
```

3. Check if port is already in use:
```bash
sudo lsof -i :5005
```

### Cannot Connect to MongoDB

1. Verify MongoDB URI in `.env`
2. Check if EC2 IP is whitelisted in MongoDB Atlas Network Access
3. Test connection:
```bash
npm run db:push
```

### Google OAuth Not Working

1. Verify callback URL matches in:
   - `.env` file
   - Google Cloud Console OAuth credentials
2. Ensure domain/IP is accessible
3. Check if cookies are enabled in browser

### Port 5005 Not Accessible

1. Verify Security Group rules in AWS Console
2. Check if application is running:
```bash
pm2 status
```

3. Test locally on EC2:
```bash
curl http://localhost:5005
```

## 📝 Additional Scripts

```bash
# Scrape student data
npm run db:scrape

# Update specific usernames
npm run db:update-scrape

# Test scraping functionality
npm run test:scrape

# Run quick tests
npm run test:quick

# Test enhanced analytics
npm run test:enhanced-analytics
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong SESSION_SECRET** - Generate with `openssl rand -base64 32`
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Use HTTPS in production** - Set up SSL with Let's Encrypt
5. **Restrict SSH access** - Only allow your IP in Security Group
6. **Regular backups** - MongoDB Atlas handles this, but verify
7. **Monitor logs** - Check PM2 logs regularly for errors
8. **Update Google OAuth** - Keep callback URLs current

## 📞 Support

If you encounter issues:
1. Check application logs: `pm2 logs stude`
2. Verify all environment variables are set correctly
3. Ensure MongoDB Atlas allows connections from your EC2 IP
4. Check Security Group rules in AWS Console

## 🎉 Success!

Your Stude application should now be running on EC2. Access it at:
- Direct: `http://your-ec2-ip:5005`
- With domain: `http://your-domain.com`
- With SSL: `https://your-domain.com`

Happy coding! 🚀
