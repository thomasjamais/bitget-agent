#!/bin/bash

# AWS Destruction Script for Trading Bot
# This script handles the complete destruction of the infrastructure

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

echo -e "${BLUE}🗑️ Starting AWS destruction for ${PROJECT_NAME}...${NC}"

# Stop application services
stop_application() {
    echo -e "${BLUE}🛑 Stopping application services...${NC}"
    
    if [ "$DEPLOYMENT_METHOD" = "docker-compose" ]; then
        cd aws/docker
        docker-compose down -v
        echo -e "${GREEN}✅ Application services stopped${NC}"
        cd ../..
    fi
}

# Destroy infrastructure
destroy_infrastructure() {
    echo -e "${BLUE}🏗️ Destroying infrastructure with Terraform...${NC}"
    
    cd aws/terraform
    
    # Plan destruction
    echo -e "${YELLOW}📋 Planning infrastructure destruction...${NC}"
    terraform plan -destroy -var="aws_region=${AWS_REGION}" -var="environment=${ENVIRONMENT}"
    
    # Confirm destruction
    echo -e "${RED}⚠️ This will destroy all infrastructure. Are you sure? (yes/no)${NC}"
    read -r confirmation
    
    if [ "$confirmation" = "yes" ]; then
        # Apply destruction
        echo -e "${YELLOW}🗑️ Destroying infrastructure...${NC}"
        terraform destroy -auto-approve -var="aws_region=${AWS_REGION}" -var="environment=${ENVIRONMENT}"
        echo -e "${GREEN}✅ Infrastructure destroyed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️ Destruction cancelled${NC}"
        exit 0
    fi
    
    cd ../..
}

# Clean up Docker images
cleanup_docker() {
    echo -e "${BLUE}🧹 Cleaning up Docker images...${NC}"
    
    # Remove local images
    docker rmi ${PROJECT_NAME}:latest 2>/dev/null || true
    
    # Remove ECR images if using ECR
    if [ "$USE_ECR" = "true" ]; then
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}"
        
        # Delete ECR repository
        aws ecr delete-repository --repository-name ${PROJECT_NAME} --region ${AWS_REGION} --force 2>/dev/null || true
        
        echo -e "${GREEN}✅ ECR repository deleted${NC}"
    fi
    
    echo -e "${GREEN}✅ Docker cleanup completed${NC}"
}

# Main destruction function
main() {
    echo -e "${BLUE}🗑️ Starting destruction process...${NC}"
    
    # Run destruction steps
    stop_application
    destroy_infrastructure
    cleanup_docker
    
    echo -e "${GREEN}🎉 Destruction completed successfully!${NC}"
    echo -e "${YELLOW}⚠️ All resources have been destroyed${NC}"
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
        --force)
            FORCE="true"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --region REGION              AWS region (default: us-east-1)"
            echo "  --environment ENV            Environment (default: dev)"
            echo "  --deployment-method METHOD   Deployment method (docker-compose, ecs)"
            echo "  --use-ecr                    Use ECR for Docker images"
            echo "  --force                      Skip confirmation prompt"
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
