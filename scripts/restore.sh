#!/bin/bash
# restore.sh - Restores a dump of the AEGIS database

set -e

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <path_to_backup_file>"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file $BACKUP_FILE not found."
  exit 1
fi

# Load environment variables
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '#' | awk '/=/ {print $1}')
fi

DB_USER=${SPRING_DATASOURCE_USERNAME:-aegis_user}
DB_PASS=${SPRING_DATASOURCE_PASSWORD:-aegis_pass}
DB_NAME="aegis"

echo "WARNING: This will overwrite the current '$DB_NAME' database with the contents of $BACKUP_FILE"
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Restore aborted."
    exit 1
fi

echo "Restoring database $DB_NAME..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"
else
  mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$BACKUP_FILE"
fi

echo "Restore completed successfully."
