#!/bin/bash
# backup.sh - Creates a dump of the AEGIS database

set -e

# Load environment variables
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '#' | awk '/=/ {print $1}')
fi

DB_USER=${SPRING_DATASOURCE_USERNAME:-aegis_user}
DB_PASS=${SPRING_DATASOURCE_PASSWORD:-aegis_pass}
DB_NAME="aegis"

BACKUP_DIR="../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/aegis_db_$TIMESTAMP.sql"

echo "Starting backup for database $DB_NAME..."
mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"

echo "Backup completed successfully: $BACKUP_FILE"

# Optional: gzip the backup
gzip "$BACKUP_FILE"
echo "Backup compressed: $BACKUP_FILE.gz"
