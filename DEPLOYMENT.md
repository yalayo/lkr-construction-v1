# Deployment Guide for LKR Service Management System

This guide will walk you through the steps to deploy the LKR Service Management System to production using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- A PostgreSQL database (can be hosted or local)
- Twilio account for SMS notifications (optional)

## Configuration Steps

1. **Set up environment variables**

   Copy the example production environment file and fill in your values:

   ```bash
   cp .env.production.example .env
   ```

   Edit the `.env` file and add your specific configuration values:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: Your Twilio credentials (if using SMS features)
   - `SESSION_SECRET`: A secure random string for session encryption

2. **Build and start the Docker container**

   ```bash
   docker-compose up -d --build
   ```

   This will build the Docker image and start the container in detached mode.

3. **Verify the deployment**

   Check if the container is running:

   ```bash
   docker-compose ps
   ```

   You should see the container running with status "Up".

   You can also check the application logs:

   ```bash
   docker-compose logs -f
   ```

   The health endpoint should be accessible at:

   ```
   http://your-server-address:5000/health
   ```

## Database Setup

If you need to set up your database for the first time:

1. **Connect to the database**

   Ensure your PostgreSQL database is running and accessible through the provided `DATABASE_URL`.

2. **Push the database schema**

   ```bash
   # This can be run inside the container
   docker-compose exec app npm run db:push
   ```

## Scaling and Production Considerations

- **Memory**: For production, allocate at least 1GB of memory to the container.
- **CPU**: At least 1 CPU core is recommended.
- **Backups**: Set up regular database backups.
- **Monitoring**: Consider adding monitoring with tools like Prometheus and Grafana.
- **SSL**: For production, use a reverse proxy like Nginx with Let's Encrypt for SSL.

## Troubleshooting

If you encounter issues:

1. **Check container logs**:
   ```bash
   docker-compose logs -f app
   ```

2. **Verify database connectivity**:
   ```bash
   docker-compose exec app npx tsx -e "import { pool } from './server/db.js'; pool.query('SELECT NOW()')"
   ```

3. **Restart the container**:
   ```bash
   docker-compose restart app
   ```

4. **Check the health endpoint**:
   ```bash
   curl http://localhost:5000/health
   ```

## Updates and Maintenance

To update the application:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Rebuild and restart the container:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```