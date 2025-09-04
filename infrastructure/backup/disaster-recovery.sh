#!/bin/bash
# Disaster Recovery Script for Sanvi Machinery
# This script provides automated disaster recovery procedures

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/backup-config.yml"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
LOG_FILE="/var/log/sanvi/dr-${TIMESTAMP}.log"
ALERT_EMAIL="devops@sanvi-machinery.com"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
DR_ENV="${DR_ENV:-staging}"

# Ensure log directory exists
mkdir -p /var/log/sanvi

# Log function
log() {
  local level=$1
  local message=$2
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] [${level}] ${message}" | tee -a $LOG_FILE
}

# Alert function
send_alert() {
  local message=$1
  local severity=$2
  
  log "ALERT" "${message} (${severity})"
  
  # Send email alert
  if [[ -n ${ALERT_EMAIL} ]]; then
    echo "${message}" | mail -s "[${severity}] Sanvi DR Alert: ${message}" ${ALERT_EMAIL}
  fi
  
  # Send Slack alert
  if [[ -n ${SLACK_WEBHOOK_URL} ]]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"*[${severity}] Sanvi DR Alert*\n${message}\"}" \
      ${SLACK_WEBHOOK_URL}
  fi
}

# Validation function
validate() {
  local component=$1
  local validation_command=$2
  
  log "INFO" "Validating ${component}..."
  if eval ${validation_command}; then
    log "SUCCESS" "${component} validation passed"
    return 0
  else
    log "ERROR" "${component} validation failed"
    return 1
  fi
}

# Check environment variables
check_env_vars() {
  local required_vars=("AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "BACKUP_BUCKET" "DB_HOST" "DB_USERNAME" "DB_PASSWORD")
  local missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      missing_vars+=("$var")
    fi
  done
  
  if [[ ${#missing_vars[@]} -gt 0 ]]; then
    log "ERROR" "Missing required environment variables: ${missing_vars[*]}"
    return 1
  fi
  
  return 0
}

# Get latest backup
get_latest_backup() {
  local backup_type=$1
  local bucket=$2
  local prefix=$3
  
  log "INFO" "Finding latest ${backup_type} backup..."
  
  latest_backup=$(aws s3 ls "s3://${bucket}/${prefix}${backup_type}/" --recursive | sort | tail -n 1 | awk '{print $4}')
  
  if [[ -z "${latest_backup}" ]]; then
    log "ERROR" "No ${backup_type} backup found"
    return 1
  fi
  
  log "INFO" "Latest backup: ${latest_backup}"
  echo "${latest_backup}"
  return 0
}

# Restore database from backup
restore_database() {
  local backup_file=$1
  local temp_dir="/tmp/sanvi-dr-${TIMESTAMP}"
  
  log "INFO" "Starting database restoration from ${backup_file}"
  
  # Create temp directory
  mkdir -p ${temp_dir}
  
  # Download backup
  log "INFO" "Downloading database backup..."
  aws s3 cp "s3://${BACKUP_BUCKET}/${backup_file}" "${temp_dir}/db-backup.dump"
  
  # Restore database
  log "INFO" "Restoring database..."
  PGPASSWORD="${DB_PASSWORD}" pg_restore -h "${DB_HOST}" -U "${DB_USERNAME}" -d sanvi --clean --if-exists --no-owner --no-privileges "${temp_dir}/db-backup.dump"
  
  # Clean up
  log "INFO" "Cleaning up temporary files..."
  rm -rf ${temp_dir}
  
  log "SUCCESS" "Database restoration completed"
  return 0
}

# Restore application files
restore_application_files() {
  local backup_file=$1
  local temp_dir="/tmp/sanvi-dr-${TIMESTAMP}"
  local app_dir="/opt/sanvi"
  
  log "INFO" "Starting application files restoration from ${backup_file}"
  
  # Create temp directory
  mkdir -p ${temp_dir}
  
  # Download backup
  log "INFO" "Downloading application backup..."
  aws s3 cp "s3://${BACKUP_BUCKET}/${backup_file}" "${temp_dir}/app-backup.tar.gz"
  
  # Extract backup
  log "INFO" "Extracting application backup..."
  mkdir -p ${temp_dir}/app
  tar -xzf "${temp_dir}/app-backup.tar.gz" -C "${temp_dir}/app"
  
  # Create application directory if it doesn't exist
  if [[ ! -d "${app_dir}" ]]; then
    mkdir -p ${app_dir}
  fi
  
  # Restore files
  log "INFO" "Restoring application files..."
  rsync -av --delete "${temp_dir}/app/" "${app_dir}/"
  
  # Clean up
  log "INFO" "Cleaning up temporary files..."
  rm -rf ${temp_dir}
  
  log "SUCCESS" "Application files restoration completed"
  return 0
}

# Validate restoration
validate_restoration() {
  log "INFO" "Validating restoration..."
  
  # Validate database connection
  validate "Database connection" "PGPASSWORD='${DB_PASSWORD}' psql -h ${DB_HOST} -U ${DB_USERNAME} -d sanvi -c 'SELECT 1' > /dev/null"
  
  # Validate database tables
  validate "Database tables" "PGPASSWORD='${DB_PASSWORD}' psql -h ${DB_HOST} -U ${DB_USERNAME} -d sanvi -c '\dt' | grep -q 'users'"
  
  # Validate application directory
  validate "Application directory" "test -d /opt/sanvi"
  
  # Validate application files
  validate "Application files" "test -f /opt/sanvi/package.json"
  
  log "SUCCESS" "Restoration validation passed"
  return 0
}

# Restart services
restart_services() {
  log "INFO" "Restarting services..."
  
  # Restart backend
  log "INFO" "Restarting backend service..."
  if systemctl is-active --quiet sanvi-backend; then
    systemctl restart sanvi-backend
  else
    log "WARNING" "Backend service not running, starting it..."
    systemctl start sanvi-backend
  fi
  
  # Wait for backend to start
  sleep 5
  
  # Check if backend is running
  if systemctl is-active --quiet sanvi-backend; then
    log "SUCCESS" "Backend service restarted successfully"
  else
    log "ERROR" "Failed to start backend service"
    return 1
  fi
  
  # Restart frontend (if applicable)
  log "INFO" "Restarting frontend service..."
  if systemctl is-active --quiet sanvi-frontend; then
    systemctl restart sanvi-frontend
  else
    log "WARNING" "Frontend service not running, starting it..."
    systemctl start sanvi-frontend
  fi
  
  # Wait for frontend to start
  sleep 5
  
  # Check if frontend is running
  if systemctl is-active --quiet sanvi-frontend; then
    log "SUCCESS" "Frontend service restarted successfully"
  else
    log "ERROR" "Failed to start frontend service"
    return 1
  fi
  
  return 0
}

# Health check
health_check() {
  local api_url="${1:-http://localhost:3000/health}"
  local retries=${2:-10}
  local delay=${3:-5}
  
  log "INFO" "Performing health check on ${api_url}"
  
  for i in $(seq 1 ${retries}); do
    log "INFO" "Health check attempt ${i}/${retries}..."
    
    response_code=$(curl -s -o /dev/null -w "%{http_code}" ${api_url})
    
    if [[ ${response_code} -eq 200 ]]; then
      log "SUCCESS" "Health check passed"
      return 0
    else
      log "WARNING" "Health check failed, response code: ${response_code}, retrying in ${delay} seconds..."
      sleep ${delay}
    fi
  done
  
  log "ERROR" "Health check failed after ${retries} attempts"
  return 1
}

# Main DR process
disaster_recovery() {
  log "INFO" "Starting disaster recovery process"
  
  # Check environment variables
  check_env_vars || { send_alert "Missing required environment variables" "CRITICAL"; return 1; }
  
  # Get latest database backup
  DB_BACKUP=$(get_latest_backup "database" "${BACKUP_BUCKET}" "backups/") || { send_alert "Failed to find latest database backup" "CRITICAL"; return 1; }
  
  # Get latest application backup
  APP_BACKUP=$(get_latest_backup "application" "${BACKUP_BUCKET}" "backups/") || { send_alert "Failed to find latest application backup" "CRITICAL"; return 1; }
  
  # Restore database
  restore_database "${DB_BACKUP}" || { send_alert "Database restoration failed" "CRITICAL"; return 1; }
  
  # Restore application files
  restore_application_files "${APP_BACKUP}" || { send_alert "Application files restoration failed" "CRITICAL"; return 1; }
  
  # Validate restoration
  validate_restoration || { send_alert "Restoration validation failed" "CRITICAL"; return 1; }
  
  # Restart services
  restart_services || { send_alert "Service restart failed" "CRITICAL"; return 1; }
  
  # Perform health check
  health_check || { send_alert "Health check failed" "CRITICAL"; return 1; }
  
  # If all steps passed, recovery was successful
  log "SUCCESS" "Disaster recovery completed successfully"
  send_alert "Disaster recovery completed successfully" "INFO"
  
  return 0
}

# Parse command line arguments
case $1 in
  "test")
    log "INFO" "Starting disaster recovery TEST in ${DR_ENV} environment"
    DR_ENV="test-${DR_ENV}"
    disaster_recovery
    ;;
  "validate")
    log "INFO" "Validating backup and DR configuration"
    check_env_vars && validate_restoration
    ;;
  "full")
    log "INFO" "Starting FULL disaster recovery in ${DR_ENV} environment"
    send_alert "FULL disaster recovery initiated in ${DR_ENV} environment" "WARNING"
    disaster_recovery
    ;;
  *)
    echo "Usage: $0 {test|validate|full}"
    echo "  test     - Run a test recovery in a test environment"
    echo "  validate - Validate backup and DR configuration"
    echo "  full     - Perform a full disaster recovery"
    exit 1
    ;;
esac

exit $?
