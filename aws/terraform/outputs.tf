# Outputs for AWS Infrastructure

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "database_username" {
  description = "RDS master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds_sg.id
}

output "backup_bucket_name" {
  description = "S3 bucket name for backups (if enabled)"
  value       = var.enable_s3_backups ? aws_s3_bucket.backups[0].bucket : null
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for RDS logs"
  value       = aws_cloudwatch_log_group.rds_logs.name
}
