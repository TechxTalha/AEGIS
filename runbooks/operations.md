# AEGIS Operations Runbook

## 1. Deployment

### Prerequisites
- Java 25+
- Node.js 18+ (for frontend build)
- MySQL 8+

### Build
1. **Backend**: Navigate to `backend/` and run `./mvnw clean package -DskipTests`.
2. **Frontend**: Navigate to `frontend/` and run `npm install` followed by `npm run build`.

### Configuration
1. Copy `.env.template` to `.env` in the root directory.
2. Fill in all secure parameters (e.g., `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `AEGIS_MODEL_API_KEY`).
3. Source the `.env` file or provide it to the environment of your process manager (systemd, pm2, etc.).

### Run
1. Run the JAR file with the `prod` profile enabled:
   ```bash
   java -jar backend/target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
   ```
2. Serve the frontend static files using a web server like Nginx (pointing to `frontend/dist`), proxying `/api` and `/ws` to the backend on port 8080.

## 2. Backup & Restore

### Backup
Run the provided backup script from the `scripts/` directory:
```bash
cd scripts
./backup.sh
```
This generates a `.sql` dump (and optionally a `.gz` file) in the `backups/` directory based on the `.env` configuration.

### Restore
**WARNING:** Restoring overwrites the current database.
```bash
cd scripts
./restore.sh ../backups/aegis_db_YYYYMMDD_HHMMSS.sql.gz
```

## 3. Monitoring & Alerting

### Prometheus & Actuator
- The application exposes Prometheus-compatible metrics at `/actuator/prometheus`.
- You can point a Prometheus server to scrape this endpoint.
- An internal custom `HealthIndicator` (`AgentSystemHealthIndicator`) is exposed under `/actuator/health`, which reports the count of connected agents.

### Logging
- Logs are automatically written to `backend/logs/aegis-backend.log` and rolled over daily (or when exceeding 10MB).
- Error logs are additionally filtered to `backend/logs/aegis-backend-error.log` for quick inspection.

## 4. Upgrade & Rollback

### Upgrade
1. Run the database backup script.
2. Pull the latest code and build the new backend JAR.
3. Stop the current backend process.
4. Start the new JAR. Flyway will automatically run any necessary schema migrations on startup.

### Rollback
1. Stop the backend process.
2. If database schema migrations were applied in the new version that are backwards-incompatible, use `./restore.sh` to revert the database to the pre-upgrade snapshot.
3. Start the old version of the JAR.

## 5. Disaster Recovery

If the host machine fails:
1. Provision a new host.
2. Install Java 25 and MySQL 8.
3. Restore the MySQL backup using `./restore.sh`.
4. Clone the repository, copy your `.env` file, and deploy the application as per the deployment steps above.
