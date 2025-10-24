# AWS Deployment Guide

This guide covers deploying the Bitget Trading Bot to AWS with state persistence.

## Prerequisites

1. **AWS CLI** - Install and configure with your credentials
2. **Terraform** - For infrastructure management
3. **Docker** - For containerization
4. **Node.js 18+** - For running the application

## Quick Start

### 1. Set Environment Variables

Create a `.env` file in the project root:

```bash
# Database Configuration (will be set by Terraform)
DB_HOST=your-rds-endpoint
DB_PORT=5432
DB_NAME=trading_bot
DB_USERNAME=tradingbot
DB_PASSWORD=your-secure-password

# AWS Configuration
AWS_REGION=us-east-1

# Bot Configuration
NODE_ENV=production
CONFIG_PATH=./config/production-bot.yaml

# Bitget API Keys (REQUIRED)
BITGET_API_KEY=your-bitget-api-key
BITGET_SECRET=your-bitget-secret
BITGET_PASSPHRASE=your-bitget-passphrase

# AI Configuration (Optional)
OPENAI_API_KEY=your-openai-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key
ENHANCED_AI_MODE=false

# Logging
LOG_LEVEL=info
```

### 2. Deploy Infrastructure

```bash
# Deploy with Terraform
cd aws/terraform
terraform init
terraform plan
terraform apply

# Or use the deployment script
./aws/scripts/deploy.sh --deployment-method docker-compose
```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

### 4. Start the Application

```bash
# Using Docker Compose
cd aws/docker
docker-compose up -d

# Or using the persistent bot directly
npm run start:persistent
```

## Architecture

### Infrastructure Components

- **RDS PostgreSQL** - Database for state persistence
- **EC2/ECS** - Application hosting
- **CloudWatch** - Logging and monitoring
- **S3** - Backup storage (optional)

### Database Schema

The bot persists the following data:

- **Bot State** - Current bot status, equity, positions
- **Trading History** - All executed trades
- **Portfolio Allocations** - Current and target allocations
- **Risk Metrics** - Risk management state
- **AI Predictions** - AI engine outputs
- **Market Data** - Historical market data

## Deployment Methods

### 1. Docker Compose (Recommended for Development)

```bash
# Deploy infrastructure
./aws/scripts/deploy.sh --deployment-method docker-compose

# Start services
cd aws/docker
docker-compose up -d
```

### 2. ECS (Production)

```bash
# Deploy with ECS
./aws/scripts/deploy.sh --deployment-method ecs --use-ecr
```

## Configuration

### Terraform Variables

Create `aws/terraform/terraform.tfvars`:

```hcl
aws_region = "us-east-1"
project_name = "bitget-trading-bot"
environment = "dev"

# Database Configuration
db_name = "trading_bot"
db_username = "tradingbot"
db_password = "your-secure-password"

# Instance Configuration
db_instance_class = "db.t3.micro"
db_allocated_storage = 20
db_max_allocated_storage = 100

# Security
db_publicly_accessible = false
db_deletion_protection = true

# Monitoring
db_monitoring_interval = 0
db_performance_insights_enabled = false

# Backup
db_backup_retention_period = 7
enable_s3_backups = false
```

### Docker Configuration

The Docker setup includes:

- **Trading Bot** - Main application
- **PostgreSQL** - Database (for local development)
- **Redis** - Caching (optional)
- **Nginx** - Reverse proxy

## Monitoring

### Health Checks

- **Application**: `http://localhost:3000/api/health`
- **Database**: Connection health check
- **WebSocket**: `ws://localhost:8080`

### Logs

```bash
# View application logs
docker-compose -f aws/docker/docker-compose.yml logs trading-bot

# View database logs
docker-compose -f aws/docker/docker-compose.yml logs postgres
```

### Metrics

The bot exposes metrics for:

- Trading performance
- Risk metrics
- AI predictions
- Portfolio allocations
- System health

## Backup and Recovery

### Database Backups

```bash
# Manual backup
pg_dump -h $DB_HOST -U $DB_USERNAME -d $DB_NAME > backup.sql

# Restore from backup
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME < backup.sql
```

### State Recovery

The bot automatically recovers state on startup:

1. Loads bot configuration
2. Restores trading positions
3. Recovers portfolio state
4. Resumes trading operations

## Security

### Network Security

- Database is not publicly accessible
- Application runs behind reverse proxy
- SSL/TLS encryption for all connections

### Access Control

- IAM roles for AWS services
- Database user with minimal privileges
- Environment variable encryption

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check security groups
   - Verify credentials
   - Ensure database is running

2. **Migration Errors**
   - Check database permissions
   - Verify schema compatibility
   - Review migration logs

3. **Application Won't Start**
   - Check environment variables
   - Verify API keys
   - Review application logs

### Debug Commands

```bash
# Check database connection
npm run db:migrate

# View application logs
docker-compose logs trading-bot

# Check infrastructure status
terraform show
```

## Cost Optimization

### Development Environment

- Use `db.t3.micro` for RDS
- Disable enhanced monitoring
- Use minimal storage allocation

### Production Environment

- Use appropriate instance sizes
- Enable monitoring and backups
- Implement auto-scaling

## Cleanup

### Destroy Infrastructure

```bash
# Stop application
cd aws/docker
docker-compose down

# Destroy infrastructure
cd aws/terraform
terraform destroy

# Or use the destruction script
./aws/scripts/destroy.sh
```

## Support

For issues and questions:

1. Check the logs for error messages
2. Verify configuration settings
3. Review the troubleshooting section
4. Check AWS service status

## Next Steps

After successful deployment:

1. **Monitor Performance** - Use the dashboard to monitor bot performance
2. **Configure Alerts** - Set up CloudWatch alarms for critical metrics
3. **Backup Strategy** - Implement regular database backups
4. **Scaling** - Plan for horizontal scaling as needed
