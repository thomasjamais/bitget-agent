#!/bin/bash

# AWS Deployment Script for Trading Bot
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="bitget-trading-bot"
AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${ENVIRONMENT:-dev}"

echo -e "${BLUE}🚀 Starting AWS deployment for ${PROJECT_NAME}...${NC}"

# Check required tools
check_requirements() {
    echo -e "${BLUE}🔍 Checking requirements...${NC}"
    
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}❌ Terraform not found. Please install it first.${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found. Please install it first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
}

# Check AWS credentials
check_aws_credentials() {
    echo -e "${BLUE}🔍 Checking AWS credentials...${NC}"
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ AWS credentials valid${NC}"
}

# Deploy infrastructure
deploy_infrastructure() {
    echo -e "${BLUE}🏗️ Deploying infrastructure with Terraform...${NC}"
    
    cd aws/terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    echo -e "${YELLOW}📋 Planning infrastructure deployment...${NC}"
    terraform plan -var="aws_region=${AWS_REGION}" -var="environment=${ENVIRONMENT}"
    
    # Apply deployment
    echo -e "${YELLOW}🚀 Applying infrastructure deployment...${NC}"
    terraform apply -auto-approve -var="aws_region=${AWS_REGION}" -var="environment=${ENVIRONMENT}"
    
    # Get outputs
    echo -e "${BLUE}📤 Getting infrastructure outputs...${NC}"
    DB_ENDPOINT=$(terraform output -raw database_endpoint)
    DB_PORT=$(terraform output -raw database_port)
    DB_NAME=$(terraform output -raw database_name)
    
    echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
    echo -e "${BLUE}📊 Database endpoint: ${DB_ENDPOINT}:${DB_PORT}${NC}"
    
    cd ../..
}

# Build and push Docker image
build_and_push_image() {
    echo -e "${BLUE}🐳 Building and pushing Docker image...${NC}"
    
    # Build image
    docker build -f aws/docker/Dockerfile -t ${PROJECT_NAME}:latest .
    
    # Tag for ECR (if using ECR)
    if [ "$USE_ECR" = "true" ]; then
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}"
        
        # Create ECR repository if it doesn't exist
        aws ecr describe-repositories --repository-names ${PROJECT_NAME} --region ${AWS_REGION} || \
        aws ecr create-repository --repository-name ${PROJECT_NAME} --region ${AWS_REGION}
        
        # Login to ECR
        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}
        
        # Tag and push
        docker tag ${PROJECT_NAME}:latest ${ECR_URI}:latest
        docker push ${ECR_URI}:latest
        
        echo -e "${GREEN}✅ Docker image pushed to ECR: ${ECR_URI}${NC}"
    else
        echo -e "${GREEN}✅ Docker image built locally: ${PROJECT_NAME}:latest${NC}"
    fi
}

# Run database migrations
run_migrations() {
    echo -e "${BLUE}🗄️ Running database migrations...${NC}"
    
    # Set database environment variables
    export DB_HOST="${DB_ENDPOINT}"
    export DB_PORT="${DB_PORT}"
    export DB_NAME="${DB_NAME}"
    export DB_USERNAME="${DB_USERNAME:-tradingbot}"
    export DB_PASSWORD="${DB_PASSWORD}"
    export AWS_REGION="${AWS_REGION}"
    
    # Run migrations
    npm run db:migrate
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# Deploy application
deploy_application() {
    echo -e "${BLUE}🚀 Deploying application...${NC}"
    
    if [ "$DEPLOYMENT_METHOD" = "docker-compose" ]; then
        # Deploy with Docker Compose
        cd aws/docker
        
        # Create environment file
        cat > .env << EOF
# Database Configuration
DB_HOST=${DB_ENDPOINT}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USERNAME=${DB_USERNAME:-tradingbot}
DB_PASSWORD=${DB_PASSWORD}

# AWS Configuration
AWS_REGION=${AWS_REGION}

# Bot Configuration
NODE_ENV=production
CONFIG_PATH=/app/config/production-bot.yaml

# Bitget API Keys
BITGET_API_KEY=${BITGET_API_KEY}
BITGET_SECRET=${BITGET_SECRET}
BITGET_PASSPHRASE=${BITGET_PASSPHRASE}

# AI Configuration (Optional)
OPENAI_API_KEY=${OPENAI_API_KEY:-}
PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY:-}
ENHANCED_AI_MODE=${ENHANCED_AI_MODE:-false}

# Logging
LOG_LEVEL=${LOG_LEVEL:-info}
EOF
        
        # Start services
        docker-compose up -d
        
        echo -e "${GREEN}✅ Application deployed with Docker Compose${NC}"
        
    elif [ "$DEPLOYMENT_METHOD" = "ecs" ]; then
        # Deploy with ECS (placeholder for future implementation)
        echo -e "${YELLOW}⚠️ ECS deployment not implemented yet${NC}"
        
    else
        echo -e "${YELLOW}⚠️ No deployment method specified, skipping application deployment${NC}"
    fi
    
    cd ../..
}

# Health check
health_check() {
    echo -e "${BLUE}🏥 Performing health check...${NC}"
    
    # Wait for services to start
    sleep 30
    
    # Check if services are running
    if [ "$DEPLOYMENT_METHOD" = "docker-compose" ]; then
        if docker-compose -f aws/docker/docker-compose.yml ps | grep -q "Up"; then
            echo -e "${GREEN}✅ Services are running${NC}"
        else
            echo -e "${RED}❌ Some services failed to start${NC}"
            docker-compose -f aws/docker/docker-compose.yml logs
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Health check passed${NC}"
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    # Add cleanup logic here if needed
}

# Main deployment function
main() {
    echo -e "${BLUE}🚀 Starting deployment process...${NC}"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run deployment steps
    check_requirements
    check_aws_credentials
    deploy_infrastructure
    build_and_push_image
    run_migrations
    deploy_application
    health_check
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}📊 Application is running at: http://localhost${NC}"
    echo -e "${BLUE}📊 WebSocket server: ws://localhost:8080${NC}"
    echo -e "${BLUE}📊 Database: ${DB_ENDPOINT}:${DB_PORT}${NC}"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --deployment-method)
            DEPLOYMENT_METHOD="$2"
            shift 2
            ;;
        --use-ecr)
            USE_ECR="true"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --region REGION              AWS region (default: us-east-1)"
            echo "  --environment ENV            Environment (default: dev)"
            echo "  --deployment-method METHOD   Deployment method (docker-compose, ecs)"
            echo "  --use-ecr                    Use ECR for Docker images"
            echo "  --help                       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main
