# Docker Setup for User Management Backend

This document provides instructions for running the User Management Backend application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

## Quick Start

### 1. Build and Run with Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f backend
```

### 2. Build and Run Individual Docker Image

```bash
# Build the Docker image
docker build -t user-management-backend .

# Run the container
docker run -p 3000:3000 \
  -e DB_URL=mongodb://your-mongo-host:27017/userManagement \
  -e REDIS_URL=redis://your-redis-host:6379 \
  -e REFRESHTOKEN_SECRET=your_secret_here \
  -e ACCESSTOKEN_SECRET=your_secret_here \
  user-management-backend
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_URL=mongodb://mongo:27017/userManagement

# Redis Configuration
REDIS_URL=redis://redis:6379

# JWT Secrets
REFRESHTOKEN_SECRET=your_refresh_token_secret_here
ACCESSTOKEN_SECRET=your_access_token_secret_here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
```

## Docker Compose Services

### Backend Service
- **Image**: Built from local Dockerfile
- **Port**: 3000
- **Environment**: Production-ready with security optimizations
- **Health Check**: Automatic health monitoring

### MongoDB Service
- **Image**: mongo:7.0
- **Port**: 27017
- **Database**: userManagement
- **Initialization**: Automatic setup with indexes

### Redis Service
- **Image**: redis:7.2-alpine
- **Port**: 6379
- **Purpose**: Session management and caching

## Development Mode

To run in development mode with hot reloading:

```bash
# Start development environment
docker-compose --profile dev up --build

# Or run specific development service
docker-compose --profile dev up backend-dev
```

## Production Deployment

### Using Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# Scale the backend service
docker-compose up -d --scale backend=3
```

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml user-management
```

## Health Checks

The application includes built-in health checks:

- **Backend**: HTTP health check at `/api/v1/health`
- **MongoDB**: Connection health check
- **Redis**: Connection health check

## Volumes

The following volumes are mounted:

- `./public/uploads` → `/app/public/uploads` (File uploads)
- `./logs` → `/app/logs` (Application logs)
- `mongo_data` → MongoDB data persistence
- `redis_data` → Redis data persistence

## Security Features

- Non-root user execution
- Alpine Linux base image for smaller attack surface
- Environment variable configuration
- Health checks for monitoring
- Proper file permissions

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000
   
   # Change port in docker-compose.yml
   ports:
     - "3001:3000"
   ```

2. **Database Connection Issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongo
   
   # Check backend logs
   docker-compose logs backend
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER ./public/uploads ./logs
   ```

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend

# Execute commands in running container
docker-compose exec backend sh
```

## Performance Optimization

### Multi-stage Build
The Dockerfile uses multi-stage builds to:
- Reduce final image size
- Separate development and production dependencies
- Optimize layer caching

### Alpine Linux
- Smaller base image (5MB vs 300MB+)
- Security-focused
- Minimal attack surface

### Layer Caching
- Dependencies installed before copying source code
- Faster rebuilds when only source changes

## Monitoring

### Health Checks
```bash
# Check container health
docker ps

# View health check logs
docker inspect <container_id> | grep -A 10 Health
```

### Resource Usage
```bash
# Monitor resource usage
docker stats

# View container details
docker inspect <container_id>
```

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: This will delete data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean up unused resources
docker system prune -a
```

## API Endpoints

Once running, the application will be available at:

- **Health Check**: `http://localhost:3000/api/v1/health`
- **API Base**: `http://localhost:3000/api/v1/`
- **Admin API**: `http://localhost:3000/api/v1/admin`
- **Auth API**: `http://localhost:3000/api/v1/auth`
- **Swagger Docs**: `http://localhost:3000/api-docs`

## Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all required services are running
4. Check network connectivity between containers 