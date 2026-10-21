# AEGIS Operations Runbook

## 1. Automated CI/CD Deployment (GitHub Actions)

Deployments are fully automated via [.github/workflows/deploy.yml](file:///c:/AEGIS/.github/workflows/deploy.yml) on push to the `main` branch.

### Pipeline Architecture & Security Safeguards
- **Pre-Flight Validation**: Mandatory secrets (`SERVER_HOST`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `AEGIS_SECRET_KEY`) are validated on the runner before remote deployment begins.
- **Secure Configuration Generation**: `.env` is serialized using a dedicated generator script (`.github/scripts/generate-env.js`) with systemd-compliant escaping, eliminating shell interpolation and command execution vulnerabilities.
- **Artifact Verification**: Compiles backend JAR and Vite frontend, computes SHA-256 checksums, and verifies build integrity prior to transfer.
- **Versioned Releases**:
  - Backend releases staged in `/opt/aegis/releases/<release_id>`
  - Frontend releases staged in `/var/www/aegis/releases/<release_id>`
  - Active releases referenced via atomic symlink switches (`/opt/aegis/current` and `/var/www/aegis/current`)
  - Ensures existing systemd paths (`/opt/aegis/backend.jar` and `/opt/aegis/.env`) and Nginx path (`/var/www/aegis/dist`) are seamlessly preserved without interrupting active web users.
- **Production Health Verification**:
  - Polls backend readiness on `http://127.0.0.1:8080/actuator/health` (requires HTTP 200 and `"status":"UP"`).
  - Verifies Nginx configuration (`nginx -t`) and frontend root entrypoint availability.
- **Complete & Verified Rollback**:
  - If health verification fails within 45 seconds, the pipeline automatically restores the previous working backend JAR, frontend bundle, and environment configuration.
  - Automatically verifies health of the restored release and exits with failure status.
- **Database Migrations Separation**:
  - Flyway migrations are applied automatically upon new version startup.
  - Database schema changes are intentionally **not** rolled back automatically during CI/CD to prevent production data loss. If a destructive migration requires schema reversion, follow the manual database restore runbook below.

### Server Setup Prerequisites (One-Time)
Run these commands once on your target Ubuntu server:

1. **Install Runtime Dependencies**:
   ```bash
   sudo apt update && sudo apt install -y openjdk-25-jdk nginx mysql-server curl
   ```
2. **Configure Nginx Reverse Proxy**:
   Copy the provided Nginx configuration template from `scripts/nginx-aegis.conf`:
   ```bash
   sudo cp scripts/nginx-aegis.conf /etc/nginx/sites-available/aegis
   sudo ln -sfn /etc/nginx/sites-available/aegis /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl reload nginx
   ```
3. **Automated Systemd Unit Deployment**:
   The `aegis-backend.service` unit from `scripts/aegis-backend.service` is automatically staged, installed, and enabled by the CI/CD pipeline on every release.

### Required GitHub Repository Secrets
Configure these in **GitHub → Repository Settings → Secrets and variables → Actions**:
- `SERVER_HOST`: Public IP or domain of your Ubuntu server.
- `SERVER_USER`: SSH username (e.g. `root` or `aegis`).
- `SERVER_SSH_KEY`: Private SSH key for server access.
- `SERVER_PORT`: (Optional, default `22`) SSH port.
- `SPRING_DATASOURCE_URL`: `jdbc:mysql://localhost:3306/aegis?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true`
- `SPRING_DATASOURCE_USERNAME`: `aegis_user`
- `SPRING_DATASOURCE_PASSWORD`: Your MySQL database password.
- `JWT_SECRET`: 256-bit+ secure random string (32+ chars).
- `AEGIS_SECRET_KEY`: 32+ character master encryption key.
- `CORS_ALLOWED_ORIGINS`: (Optional) Comma-separated allowed origins. Defaults to `http://SERVER_HOST,http://localhost`.
- `AEGIS_MODEL_PRIMARY_API_KEY`: (or `AEGIS_MODEL_API_KEY`) Primary model API key (e.g. OpenAI or fast Groq).
- `AEGIS_MODEL_PRIMARY_PROVIDER`: (Optional, default `openai`) Provider identifier.
- `AEGIS_MODEL_PRIMARY_ENDPOINT`: (Optional, default `https://api.openai.com/v1`) Model endpoint.
- `AEGIS_MODEL_PRIMARY_NAME`: (Optional, default `gpt-4o`) Primary model identifier.
- `AEGIS_MODEL_FALLBACK1_API_KEY`: (Optional) Free-tier Fallback 1 (e.g. Groq free tier).
- `AEGIS_MODEL_FALLBACK1_ENDPOINT`: (Optional, default `https://api.groq.com/openai/v1`).
- `AEGIS_MODEL_FALLBACK1_NAME`: (Optional, default `llama-3.3-70b-versatile`).
- `AEGIS_MODEL_FALLBACK2_API_KEY`: (Optional) Free-tier Fallback 2 (e.g. Google Gemini via OpenAI endpoint).
- `AEGIS_MODEL_FALLBACK2_ENDPOINT`: (Optional, default `https://generativelanguage.googleapis.com/v1beta/openai/`).
- `AEGIS_MODEL_FALLBACK2_NAME`: (Optional, default `gemini-1.5-flash`).
- `AEGIS_MODEL_FALLBACK3_API_KEY`: (Optional) Free-tier Fallback 3 (e.g. OpenRouter free models).
- `AEGIS_MODEL_FALLBACK3_ENDPOINT`: (Optional, default `https://openrouter.ai/api/v1`).
- `AEGIS_MODEL_FALLBACK3_NAME`: (Optional, default `meta-llama/llama-3.1-8b-instruct:free`).

## 2. Manual / Local Deployment

### Prerequisites
- Java 25+
- Node.js 18+ (for frontend build)
- MySQL 8+

### Build & Run Locally
1. Run backend with local profile:
   ```bash
   cd backend
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
   ```
2. Run frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

## 3. Backup & Restore

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

## 4. Monitoring & Alerting

### Prometheus & Actuator
- The application exposes Prometheus-compatible metrics at `/actuator/prometheus`.
- You can point a Prometheus server to scrape this endpoint.
- An internal custom `HealthIndicator` (`AgentSystemHealthIndicator`) is exposed under `/actuator/health`, which reports the count of connected agents.

### Logging
- Logs are automatically written to `backend/logs/aegis-backend.log` and rolled over daily (or when exceeding 10MB).
- Error logs are additionally filtered to `backend/logs/aegis-backend-error.log` for quick inspection.

## 5. Upgrade & Rollback

### Upgrade
1. Run the database backup script.
2. Pull the latest code and build the new backend JAR.
3. Stop the current backend process.
4. Start the new JAR. Flyway will automatically run any necessary schema migrations on startup.

### Rollback
1. Stop the backend process.
2. If database schema migrations were applied in the new version that are backwards-incompatible, use `./restore.sh` to revert the database to the pre-upgrade snapshot.
3. Start the old version of the JAR.

## 6. Disaster Recovery

If the host machine fails:
1. Provision a new host.
2. Install Java 25 and MySQL 8.
3. Restore the MySQL backup using `./restore.sh`.
4. Clone the repository, copy your `.env` file, and deploy the application as per the deployment steps above.
