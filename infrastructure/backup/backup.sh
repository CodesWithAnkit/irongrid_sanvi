#!/bin/bash
# Automated Backup Script for Sanvi Machinery

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/backup-config.yml"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
LOG_FILE="/var/log/sanvi/backup-${TIMESTAMP}.log"
BACKUP_DIR="/tmp/sanvi-backup-${TIMESTAMP}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
BACKUP_TYPE="${1:-all}"

# Ensure log directory exists
mkdir -p /var/log/sanvi

# Log function
log() {
  local level=$1
  local message=$2
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] [${level}] ${message}" | tee -a $LOG_FILE
}

# Notification function
send_notification() {
  local status=$1
  local message=$2
  
  # Log notification
  log "NOTIFY" "${status}: ${message}"
  
  # Send email notification
  if [[ "${status}" == "SUCCESS" ]]; then
    email_to=$(yq eval '.notifications.success.email.recipients[]' ${CONFIG_FILE})
    email_subject=$(yq eval '.notifications.success.email.subject' ${CONFIG_FILE})
  else
    email_to=$(yq eval '.notifications.failure.email.recipients[]' ${CONFIG_FILE})
    email_subject=$(yq eval '.notifications.failure.email.subject' ${CONFIG_FILE})
  fi
  
  if [[ -n "${email_to}" ]]; then
    echo "${message}" | mail -s "${email_subject}" ${email_to}
  fi
  
  # Send Slack notification
  if [[ -n "${SLACK_WEBHOOK_URL}" ]]; then
    local slack_color="good"
    [[ "${status}" != "SUCCESS" ]] && slack_color="danger"
    
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{
        \"attachments\": [
          {
            \"color\": \"${slack_color}\",
            \"title\": \"${status}: Sanvi Backup\",
            \"text\": \"${message}\",
            \"footer\": \"Backup System\",
            \"ts\": $(date +%s)
          }
        ]
      }" \
      ${SLACK_WEBHOOK_URL}
  fi
}

# Backup database
backup_database() {
  local db_host=$(yq eval '.database.host' ${CONFIG_FILE})
  local db_port=$(yq eval '.database.port' ${CONFIG_FILE})
  local db_name=$(yq eval '.database.database' ${CONFIG_FILE})
  local db_user=$(yq eval '.database.username' ${CONFIG_FILE})
  local db_format=$(yq eval '.database.options.format' ${CONFIG_FILE})
  local db_compress=$(yq eval '.database.options.compress' ${CONFIG_FILE})
  local db_jobs=$(yq eval '.database.options.jobs' ${CONFIG_FILE})
  
  log "INFO" "Starting database backup..."
  
  # Create backup directory
  mkdir -p ${BACKUP_DIR}/database
  
  # Set password from environment
  export PGPASSWORD="${DB_PASSWORD}"
  
  # Create database backup
  pg_dump -h ${db_host} -p ${db_port} -U ${db_user} -d ${db_name} \
    -F ${db_format} -Z ${db_compress} -j ${db_jobs} \
    -f ${BACKUP_DIR}/database/sanvi-db-${TIMESTAMP}.dump
  
  if [[ $? -eq 0 ]]; then
    log "SUCCESS" "Database backup created: sanvi-db-${TIMESTAMP}.dump"
    return 0
  else
    log "ERROR" "Database backup failed"
    return 1
  fi
}

# Backup application state
backup_application() {
  local app_dir="/opt/sanvi"
  
  log "INFO" "Starting application state backup..."
  
  # Create backup directory
  mkdir -p ${BACKUP_DIR}/application
  
  # Create tarball of application directory
  tar -czf ${BACKUP_DIR}/application/sanvi-app-${TIMESTAMP}.tar.gz -C ${app_dir} .
  
  if [[ $? -eq 0 ]]; then
    log "SUCCESS" "Application backup created: sanvi-app-${TIMESTAMP}.tar.gz"
    return 0
  else
    log "ERROR" "Application backup failed"
    return 1
  fi
}

# Backup file storage (S3)
backup_s3_storage() {
  local s3_bucket=$(yq eval '.storage.primary.bucket' ${CONFIG_FILE})
  
  log "INFO" "Starting S3 storage sync..."
  
  # Create backup directory
  mkdir -p ${BACKUP_DIR}/s3
  
  # Sync from S3
  aws s3 sync s3://${s3_bucket} ${BACKUP_DIR}/s3/
  
  if [[ $? -eq 0 ]]; then
    log "SUCCESS" "S3 storage backup completed"
    return 0
  else
    log "ERROR" "S3 storage backup failed"
    return 1
  fi
}

# Upload backup to storage
upload_backup() {
  local backup_type=$1
  local primary_bucket=$(yq eval '.storage.primary.bucket' ${CONFIG_FILE})
  local primary_path=$(yq eval '.storage.primary.path' ${CONFIG_FILE})
  local secondary_bucket=$(yq eval '.storage.secondary.bucket' ${CONFIG_FILE})
  local secondary_path=$(yq eval '.storage.secondary.path' ${CONFIG_FILE})
  
  log "INFO" "Uploading ${backup_type} backup to primary storage..."
  
  # Upload to primary storage
  aws s3 cp ${BACKUP_DIR}/${backup_type}/ s3://${primary_bucket}/${primary_path}${backup_type}/ --recursive
  primary_status=$?
  
  if [[ ${primary_status} -eq 0 ]]; then
    log "SUCCESS" "${backup_type} backup uploaded to primary storage"
  else
    log "ERROR" "Failed to upload ${backup_type} backup to primary storage"
  fi
  
  # Upload to secondary storage (DR site)
  if [[ -n "${secondary_bucket}" ]]; then
    log "INFO" "Uploading ${backup_type} backup to secondary (DR) storage..."
    aws s3 cp ${BACKUP_DIR}/${backup_type}/ s3://${secondary_bucket}/${secondary_path}${backup_type}/ --recursive
    secondary_status=$?
    
    if [[ ${secondary_status} -eq 0 ]]; then
      log "SUCCESS" "${backup_type} backup uploaded to secondary (DR) storage"
    else
      log "ERROR" "Failed to upload ${backup_type} backup to secondary storage"
    fi
  fi
  
  return $primary_status
}

# Clean up old backups
clean_old_backups() {
  local retention_days=$(yq eval '.backup.retention.days' ${CONFIG_FILE})
  local primary_bucket=$(yq eval '.storage.primary.bucket' ${CONFIG_FILE})
  local primary_path=$(yq eval '.storage.primary.path' ${CONFIG_FILE})
  
  log "INFO" "Cleaning up backups older than ${retention_days} days..."
  
  # Calculate cutoff date
  cutoff_date=$(date -d "-${retention_days} days" +"%Y-%m-%d")
  
  # List all backup objects and filter by date
  aws s3api list-objects-v2 --bucket ${primary_bucket} --prefix ${primary_path} \
    --query "Contents[?LastModified<='${cutoff_date}'].{Key:Key}" --output text | \
    while read key; do
      if [[ -n "${key}" ]]; then
        log "INFO" "Deleting old backup: ${key}"
        aws s3 rm s3://${primary_bucket}/${key}
      fi
    done
  
  log "INFO" "Old backup cleanup completed"
}

# Main backup process
perform_backup() {
  local success=true
  local backup_summary=""
  
  # Create master backup directory
  mkdir -p ${BACKUP_DIR}
  
  # Backup database if requested
  if [[ "${BACKUP_TYPE}" == "all" || "${BACKUP_TYPE}" == "database" ]]; then
    if backup_database; then
      upload_backup "database" || success=false
      backup_summary="${backup_summary}Database: SUCCESS\n"
    else
      success=false
      backup_summary="${backup_summary}Database: FAILED\n"
    fi
  fi
  
  # Backup application state if requested
  if [[ "${BACKUP_TYPE}" == "all" || "${BACKUP_TYPE}" == "application" ]]; then
    if backup_application; then
      upload_backup "application" || success=false
      backup_summary="${backup_summary}Application: SUCCESS\n"
    else
      success=false
      backup_summary="${backup_summary}Application: FAILED\n"
    fi
  fi
  
  # Backup S3 storage if requested
  if [[ "${BACKUP_TYPE}" == "all" || "${BACKUP_TYPE}" == "s3" ]]; then
    if backup_s3_storage; then
      upload_backup "s3" || success=false
      backup_summary="${backup_summary}S3 Storage: SUCCESS\n"
    else
      success=false
      backup_summary="${backup_summary}S3 Storage: FAILED\n"
    fi
  fi
  
  # Clean up old backups
  clean_old_backups
  
  # Clean up temporary backup directory
  log "INFO" "Cleaning up temporary backup files..."
  rm -rf ${BACKUP_DIR}
  
  # Send notification
  if $success; then
    send_notification "SUCCESS" "Backup completed successfully.\n${backup_summary}"
  else
    send_notification "FAILURE" "Backup failed. Check logs for details.\n${backup_summary}"
  fi
  
  return $success
}

# Parse command line arguments
case "${BACKUP_TYPE}" in
  "database"|"application"|"s3"|"all")
    log "INFO" "Starting ${BACKUP_TYPE} backup..."
    perform_backup
    ;;
  *)
    echo "Usage: $0 {database|application|s3|all}"
    echo "  database    - Backup only the database"
    echo "  application - Backup only the application state"
    echo "  s3          - Backup only the S3 storage"
    echo "  all         - Backup everything (default)"
    exit 1
    ;;
esac

exit $?
